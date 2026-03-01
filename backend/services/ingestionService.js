const { fetchUnreadEmails, updateLastIngestion } = require('./gmailService');
const { analyzeDocument } = require('./aiService');
const { autoLogSubscription } = require('./subscriptionService');
const { createNotification } = require('./notificationService');
const prisma = require('../prismaClient');
const supabase = require('../config/supabase');
const path = require('path');

// Helper to format bytes
const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Main autonomous ingestion loop.
 * Fetches unread emails for all connected users and processes them with AI.
 */
const runIngestionCycle = async () => {
    console.log(`[IngestionEngine] Starting cycle at ${new Date().toISOString()}`);

    try {
        // 1. Get all users with Gmail tokens
        const connectedUsers = await prisma.gmailToken.findMany({
            select: { userId: true, email: true }
        });

        console.log(`[IngestionEngine] Processing ${connectedUsers.length} connected users.`);

        for (const userRecord of connectedUsers) {
            const { userId, email } = userRecord;
            console.log(`[IngestionEngine] Fetching for user ${email}...`);

            try {
                // Clear out previous generic scan notifications to prevent dashboard spam
                await prisma.notification.deleteMany({
                    where: {
                        userId: userId,
                        title: 'Email Auto-Scan Started'
                    }
                });

                // Create a fresh active status notification
                await createNotification(userId, {
                    type: 'info',
                    title: 'Email Auto-Scan Started',
                    message: `DoxRadar is actively scanning ${email} for new documents and subscriptions.`
                });

                // 2. Fetch unread emails
                const emails = await fetchUnreadEmails(userId);
                console.log(`[IngestionEngine] Found ${emails.length} new messages.`);

                // Fetch user preferences for threshold checks
                const preferences = await prisma.userPreference.findUnique({
                    where: { userId }
                });
                const threshold = preferences?.highCostThreshold || 50.0;

                let processedCount = 0;

                for (const emailData of emails) {
                    try {
                        // 2.5 Deduplication Check
                        const existingLog = await prisma.emailLog.findUnique({
                            where: { gmailId: emailData.id }
                        });

                        if (existingLog) {
                            console.log(`[IngestionEngine] Skipping already processed email: ${emailData.id}`);
                            continue;
                        }

                        // 3. Extract basic info
                        const subject = emailData.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
                        const from = emailData.payload.headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
                        const snippet = emailData.snippet;

                        console.log(`[IngestionEngine] AI analyzing: "${subject}" from ${from}`);

                        // 4. Handle Attachments (Recursively search nested multiparts)
                        let attachments = [];
                        const extractAttachments = async (parts) => {
                            if (!parts) return;
                            for (const part of parts) {
                                if (part.filename && part.body && part.body.attachmentId) {
                                    console.log(`[IngestionEngine] Found attachment: ${part.filename} (${part.mimeType})`);
                                    const attachData = await require('./gmailService').getAttachment(userId, emailData.id, part.body.attachmentId);
                                    if (attachData && attachData.data) {
                                        attachments.push({
                                            filename: part.filename,
                                            mimeType: part.mimeType,
                                            buffer: Buffer.from(attachData.data, 'base64')
                                        });
                                    }
                                }
                                if (part.parts) {
                                    await extractAttachments(part.parts);
                                }
                            }
                        };

                        await extractAttachments(emailData.payload.parts);

                        // 5. Run AI Analysis
                        let analysis;

                        // We still restrict what gets sent to the AI to prevent crashing the Gemini model with binary files,
                        // but we will save ALL attachments to the database later in the loop.
                        const aiSupportedMimes = [
                            'application/pdf',
                            'image/jpeg',
                            'image/png',
                            'text/plain',
                            'text/csv',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'application/msword',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                        ];

                        const bestAttachment = attachments.find(a => aiSupportedMimes.includes(a.mimeType) || a.mimeType.startsWith('image/'));

                        if (bestAttachment) {
                            console.log(`[IngestionEngine] Analyzing attachment: ${bestAttachment.filename}`);
                            analysis = await analyzeDocument(bestAttachment.buffer, bestAttachment.mimeType);
                        } else {
                            console.log(`[IngestionEngine] No financial attachments, analyzing email body.`);
                            const emailContent = `Subject: ${subject}\nFrom: ${from}\nSnippet: ${snippet}`;
                            const textBuffer = Buffer.from(emailContent);
                            analysis = await analyzeDocument(textBuffer, 'text/plain');
                        }

                        // 6. Log the email processing
                        const emailLog = await prisma.emailLog.upsert({
                            where: { gmailId: emailData.id },
                            update: {
                                subject: subject,
                                snippet: snippet,
                                classification: analysis.suggestedCategory,
                                extractedData: analysis
                            },
                            create: {
                                gmailId: emailData.id,
                                userId: userId,
                                subject: subject,
                                sender: from,
                                snippet: snippet,
                                classification: analysis.suggestedCategory,
                                extractedData: analysis
                            }
                        });

                        // 7a. Risk Intelligence & Action Recommendation Engine
                        // Replaces the old static categorizations with dynamic AI-driven severity & actions.
                        const severityColors = {
                            'Low': 'info',
                            'Medium': 'warning',
                            'High': 'warning',
                            'Critical': 'danger'
                        };

                        const notifType = severityColors[analysis.severityLevel] || 'info';

                        if (analysis.isScam || analysis.suggestedCategory === 'Scam') {
                            await createNotification(userId, {
                                type: 'danger',
                                title: '🚨 Scam Detected',
                                message: analysis.actionRecommendation || `Suspicious email found: "${subject}". ${analysis.scamReason || ''}`,
                                metadata: { gmailId: emailData.id, logId: emailLog.id, severity: analysis.severityLevel }
                            });
                        }

                        // Emit Action Required Notification if the AI flagged one
                        if (analysis.requiresAction && analysis.actionRecommendation && !(analysis.isScam || analysis.suggestedCategory === 'Scam')) {
                            await createNotification(userId, {
                                type: notifType,
                                title: analysis.severityLevel === 'Critical' ? '🛑 URGENT ACTION REQUIRED' : '⚡ Action Recommended',
                                message: analysis.actionRecommendation,
                                metadata: { gmailId: emailData.id, logId: emailLog.id, severity: analysis.severityLevel }
                            });
                        }

                        // 7b. High Cost Monitoring (Fallback in case AI missed it)
                        const cost = parseFloat(analysis.subscriptionDetails?.price || 0);
                        const period = analysis.subscriptionDetails?.period || 'Monthly';
                        const monthlyCost = period === 'Monthly' ? cost : cost / 12;

                        if (monthlyCost >= threshold && !analysis.requiresAction) {
                            await createNotification(userId, {
                                type: 'warning',
                                title: '💰 High Cost Detected',
                                message: `New high-cost item found: ${analysis.subscriptionDetails?.name || 'Service'}. Cost: $${monthlyCost.toFixed(2)}/mo.`,
                                metadata: { gmailId: emailData.id, logId: emailLog.id, severity: 'Medium' }
                            });
                        }

                        // 7c. Auto-log subscription if detected
                        if (analysis.suggestedCategory === 'Subscription' || analysis.isSubscription) {
                            await autoLogSubscription(userId, analysis, `Email: ${subject}`);
                        }

                        // 6b. Save ALL attachments to Documents (no restriction)
                        // We upload every attachment found in the email, regardless of extension.
                        for (const attachment of attachments) {
                            console.log(`[IngestionEngine] Uploading attachment to storage: ${attachment.filename}`);

                            const fileExt = path.extname(attachment.filename);
                            const storageFileName = `${Date.now()}_gmail_${attachment.filename.replace(/\s+/g, '-')}`;
                            const storagePath = `user_${userId}/${storageFileName}`;

                            // Upload to Supabase Storage
                            const { data: uploadData, error: uploadError } = await supabase.storage
                                .from('documents')
                                .upload(storagePath, attachment.buffer, {
                                    contentType: attachment.mimeType,
                                    upsert: false
                                });

                            if (uploadError) {
                                console.error(`[IngestionEngine] Storage upload error:`, uploadError.message);
                            } else {
                                // Get Public URL
                                const { data: { publicUrl } } = supabase.storage
                                    .from('documents')
                                    .getPublicUrl(storagePath);

                                // Create a Document record for the attachment
                                await prisma.document.create({
                                    data: {
                                        userId: userId,
                                        name: attachment.filename,
                                        category: analysis.suggestedCategory,
                                        type: fileExt.substring(1).toUpperCase() || 'FILE',
                                        size: formatBytes(attachment.buffer.length),
                                        path: publicUrl,
                                        analysis: analysis
                                    }
                                });
                                console.log(`[IngestionEngine] Saved attachment as Document: ${attachment.filename}`);

                                // Emit specific document upload notification
                                await createNotification(userId, {
                                    type: 'success',
                                    title: '📄 New Document Saved',
                                    message: `Auto-saved "${attachment.filename}" to your Documents.`
                                });
                            }
                        }

                        // Increment processed count
                        processedCount++;

                    } catch (emailErr) {
                        console.error(`[IngestionEngine] Failed to process message ${emailData.id}:`, emailErr.message);
                    }
                } // end email loop

                // 8. Update last ingestion time ONLY if this user's cycle succeeded
                await updateLastIngestion(userId);

                // 9. Emit Cycle Finished Notification
                await prisma.notification.deleteMany({
                    where: {
                        userId: userId,
                        title: 'Email Auto-Scan Started'
                    }
                });

                if (processedCount > 0) {
                    await createNotification(userId, {
                        type: 'success',
                        title: '✅ Scan Complete',
                        message: `Successfully processed ${processedCount} new document(s) and subscription(s).`
                    });
                } else if (emails.length > 0) {
                    await createNotification(userId, {
                        type: 'info',
                        title: '✅ Scan Complete',
                        message: `Checked ${emails.length} new messages, but found no relevant documents or subscriptions.`
                    });
                } else {
                    await createNotification(userId, {
                        type: 'info',
                        title: '✅ Scan Complete',
                        message: `No new unread messages found in your inbox.`
                    });
                }

            } catch (userErr) {
                console.error(`[IngestionEngine] Skipping user ${email} due to error:`, userErr.message);
            }
        } // end connectedUsers loop

    } catch (error) {
        console.error(`[IngestionEngine] Cycle failed globally:`, error.message);
    }

    console.log(`[IngestionEngine] Cycle finished.`);
};

module.exports = {
    runIngestionCycle
};
