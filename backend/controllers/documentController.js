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
            path: publicUrl, // Store Public URL
        },
    });

    if (doc) {
        // Only attempt AI analysis if explicitly enabled
        const enableAI = process.env.ENABLE_AI_ANALYSIS !== 'false';

        if (enableAI) {
            try {
                // Process Analysis with Buffer directly
                const analysis = await analyzeDocument(req.file.buffer, req.file.mimetype);

                // Only update if analysis succeeded
                if (analysis.status === 'Completed') {
                    await prisma.document.update({
                        where: { id: doc.id },
                        data: { analysis },
                    });

                    const updatedDoc = await prisma.document.findUnique({ where: { id: doc.id } });
                    return res.status(201).json(updatedDoc);
                } else {
                    console.warn('AI Analysis failed, returning document without analysis');
                }
            } catch (error) {
                console.error("AI Analysis Failed:", error.message);
            }
        }

        // Return document without analysis if AI is disabled or failed
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

module.exports = {
    uploadDocument,
    getDocuments,
    deleteDocument,
};
