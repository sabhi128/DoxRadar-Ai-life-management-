const mongoose = require('mongoose');

const lifeAuditSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        scores: {
            health: { type: Number, required: true },
            career: { type: Number, required: true },
            finance: { type: Number, required: true },
            relationships: { type: Number, required: true },
            personalGrowth: { type: Number, required: true },
            recreation: { type: Number, required: true },
            environment: { type: Number, required: true },
            spirituality: { type: Number, required: true },
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('LifeAudit', lifeAuditSchema);
