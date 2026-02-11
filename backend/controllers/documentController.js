const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// @desc    Upload a document
// @route   POST /api/documents
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const { category } = req.body;

    // Convert bytes to readable size
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const doc = await Document.create({
        user: req.user.id,
        name: req.file.originalname,
        category: category || 'Uncategorized',
        type: path.extname(req.file.originalname).substring(1).toUpperCase() || 'FILE',
        size: formatBytes(req.file.size),
        path: req.file.path,
    });

    res.status(201).json(doc);
});

// @desc    Get user documents
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
    const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(documents);
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
    const document = await Document.findById(req.params.id);

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
    if (document.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Delete file from filesystem
    if (fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
    }

    await document.deleteOne();

    res.status(200).json({ id: req.params.id });
});

module.exports = {
    uploadDocument,
    getDocuments,
    deleteDocument,
};
