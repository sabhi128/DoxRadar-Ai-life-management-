const mongoose = require('mongoose');

const documentSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: [true, 'Please add a document name'],
        },
        category: {
            type: String,
            required: [true, 'Please add a category'],
            default: 'Uncategorized',
        },
        type: {
            type: String, // e.g., 'PDF', 'Image'
            required: true,
        },
        size: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: [true, 'Please add the file path'],
        },
        analysis: {
            summary: { type: String },
            expiryDate: { type: Date },
            renewalDate: { type: Date },
            risks: [{ type: String }],
            tags: [{ type: String }],
            status: {
                type: String,
                enum: ['Pending', 'Completed', 'Failed'],
                default: 'Pending'
            }
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Document', documentSchema);
