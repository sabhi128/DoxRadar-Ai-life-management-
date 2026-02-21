const asyncHandler = require('express-async-handler');
const prisma = require('../prismaClient');
const supabase = require('../config/supabase');
// const fs = require('fs'); // Removed
const path = require('path');

// @desc    Upload a document
// @route   POST /api/documents
// @access  Private
const { analyzeDocument } = require('../services/aiService');

// Convert bytes to readable size
const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const { category } = req.body;
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}_${req.file.originalname.replace(/\s+/g, '-')}`;
    const filePath = `user_${req.user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
        });

    if (uploadError) {
        console.error('Supabase Upload Error:', uploadError);
        res.status(500);
        throw new Error('Image upload failed');
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

    const doc = await prisma.document.create({
        data: {
            userId: req.user.id,
            name: req.file.originalname,
            category: category || 'Uncategorized',
            type: fileExt.substring(1).toUpperCase() || 'FILE',
            size: formatBytes(req.file.size),
            path: publicUrl,
        },
    });

    if (doc) {
        // Only attempt AI analysis if explicitly enabled in ENV AND user preferences
        let enableAI = process.env.ENABLE_AI_ANALYSIS !== 'false';

        if (enableAI) {
            // Check user preferences
            const prefs = await prisma.userPreference.findUnique({
                where: { userId: req.user.id }
            });

            if (prefs && prefs.aiDocumentAnalysis === false) {
                enableAI = false;
            }
        }

        if (enableAI) {
            try {
                // Process Analysis with Buffer directly
                const analysis = await analyzeDocument(req.file.buffer, req.file.mimetype);

                // Build update data - always save analysis
                const updateData = { analysis };

                // Use AI-suggested category if analysis succeeded
                if (analysis.status === 'Completed' && analysis.suggestedCategory) {
                    updateData.category = analysis.suggestedCategory;
                }

                await prisma.document.update({
                    where: { id: doc.id },
                    data: updateData,
                });

                const updatedDoc = await prisma.document.findUnique({ where: { id: doc.id } });
                return res.status(201).json(updatedDoc);
            } catch (error) {
                console.error("AI Analysis Failed:", error.message);
            }
        }

        // Return document without analysis if AI is disabled or crashed
        res.status(201).json(doc);
    } else {
        res.status(400);
        throw new Error('Invalid document data');
    }
});

// @desc    Get user documents
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
    const documents = await prisma.document.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(documents);
});

// @desc    Get document insights (full analysis)
// @route   GET /api/documents/:id/insights
// @access  Private
const getDocumentInsights = asyncHandler(async (req, res) => {
    const document = await prisma.document.findUnique({
        where: { id: req.params.id },
        select: {
            id: true,
            userId: true,
            analysis: true,
        }
    });

    if (!document || document.userId !== req.user.id) {
        res.status(404);
        throw new Error('Document insights not found');
    }

    res.status(200).json(document.analysis);
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
    const document = await prisma.document.findUnique({
        where: { id: req.params.id },
    });

    if (!document) {
        res.status(404);
        throw new Error('Document not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the document user
    if (document.userId !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/documents/[user_id]/[filename]
    try {
        const url = new URL(document.path);
        // The path in bucket starts after '/documents/'
        const pathParts = url.pathname.split('/documents/');
        if (pathParts.length > 1) {
            const storagePath = decodeURIComponent(pathParts[1]);

            const { error: deleteError } = await supabase.storage
                .from('documents')
                .remove([storagePath]);

            if (deleteError) {
                console.error('Supabase Delete Error:', deleteError);
                // Don't throw here, continue to delete from DB so they stay in sync
            }
        }
    } catch (err) {
        console.error('Error parsing document path for deletion:', err);
    }

    await prisma.document.delete({
        where: { id: req.params.id },
    });

    res.status(200).json({ id: req.params.id });
});

const deleteAllDocuments = asyncHandler(async (req, res) => {
    // 1. Get all documents for the user to get their paths
    const documents = await prisma.document.findMany({
        where: { userId: req.user.id },
        select: { path: true }
    });

    if (documents.length === 0) {
        return res.status(200).json({ message: 'No documents to delete', count: 0 });
    }

    // 2. Extract storage paths
    const storagePaths = documents.map(doc => {
        try {
            const url = new URL(doc.path);
            const pathParts = url.pathname.split('/documents/');
            return pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : null;
        } catch (err) {
            return null;
        }
    }).filter(p => p !== null);

    // 3. Delete from Supabase Storage
    if (storagePaths.length > 0) {
        const { error: deleteError } = await supabase.storage
            .from('documents')
            .remove(storagePaths);

        if (deleteError) {
            console.error('Supabase Bulk Delete Error:', deleteError);
        }
    }

    // 4. Delete from Database
    const deleteResult = await prisma.document.deleteMany({
        where: { userId: req.user.id }
    });

    res.status(200).json({
        message: 'Successfully deleted all documents',
        count: deleteResult.count
    });
});

module.exports = {
    uploadDocument,
    getDocuments,
    deleteDocument,
    getDocumentInsights,
    deleteAllDocuments,
};
