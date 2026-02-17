import mongoose from "mongoose";

const InsightHistorySchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        index: true,
        lowercase: true
    },

    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },

    portfolioSnapshot: {
        totalValue: { type: Number, required: true },
        balances: [{
            chainName: String,
            chainId: Number,
            symbol: String,
            balance: Number,
            valueUSD: Number
        }],
        connectedChains: { type: Number, required: true }
    },

    analysis: {
        healthScore: { type: Number, required: true, min: 0, max: 100 },
        riskLevel: {
            type: String,
            required: true,
            enum: ['Low', 'Medium', 'High']
        },
        summary: { type: String, required: true },
        diversification: String,
        performance: String,
        volatility: String
    },

    recommendations: [{
        type: {
            type: String,
            enum: ['Buy', 'Sell', 'Hold'],
            required: true
        },
        asset: { type: String, required: true },
        reason: { type: String, required: true },
        priority: { type: Number, default: 1 }
    }],

    topPick: {
        asset: String,
        reason: String
    },

    predictions: {
        expectedReturn7d: Number,
        expectedReturn30d: Number,
        confidenceScore: { type: Number, min: 0, max: 100 },
        marketOutlook: String
    },

    anomalies: [{
        type: {
            type: String,
            enum: ['unusual_transaction', 'high_volatility', 'concentration_risk', 'other']
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        description: String,
        detectedAt: { type: Date, default: Date.now }
    }],

    rebalancing: {
        needed: { type: Boolean, default: false },
        actions: [{
            type: {
                type: String,
                enum: ['buy', 'sell', 'hold']
            },
            asset: String,
            amount: Number,
            currentAllocation: Number,
            targetAllocation: Number,
            reason: String
        }]
    },

    userProfile: {
        riskPersonality: {
            type: String,
            enum: ['Conservative', 'Balanced', 'Aggressive']
        },
        learningMode: {
            type: String,
            enum: ['Beginner', 'Expert']
        }
    },

    marketContext: {
        sentiment: {
            type: String,
            enum: ['bullish', 'bearish', 'neutral']
        },
        btcPrice: Number,
        ethPrice: Number,
        fearGreedIndex: Number
    },

    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    }
});

// Compound indexes for efficient queries
InsightHistorySchema.index({ walletAddress: 1, timestamp: -1 });
InsightHistorySchema.index({ walletAddress: 1, createdAt: -1 });

// TTL index for automatic cleanup after 90 days
InsightHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for age calculation
InsightHistorySchema.virtual('age').get(function () {
    return Date.now() - this.timestamp;
});

// Instance method to check if insight is recent (less than 1 hour old)
InsightHistorySchema.methods.isRecent = function () {
    const oneHour = 60 * 60 * 1000;
    return (Date.now() - this.timestamp) < oneHour;
};

// Static method to get insights for a wallet
InsightHistorySchema.statics.getWalletHistory = function (walletAddress, limit = 10, offset = 0) {
    return this.find({ walletAddress: walletAddress.toLowerCase() })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean();
};

// Static method to get latest insight for a wallet
InsightHistorySchema.statics.getLatest = function (walletAddress) {
    return this.findOne({ walletAddress: walletAddress.toLowerCase() })
        .sort({ timestamp: -1 })
        .lean();
};

// Static method to get trend data
InsightHistorySchema.statics.getTrendData = async function (walletAddress, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.find({
        walletAddress: walletAddress.toLowerCase(),
        timestamp: { $gte: startDate }
    })
        .select('timestamp analysis.healthScore analysis.riskLevel portfolioSnapshot.totalValue')
        .sort({ timestamp: 1 })
        .lean();
};

// Static method to count insights for a wallet
InsightHistorySchema.statics.countForWallet = function (walletAddress) {
    return this.countDocuments({ walletAddress: walletAddress.toLowerCase() });
};

const InsightHistoryModel = mongoose.model("InsightHistory", InsightHistorySchema);

export default InsightHistoryModel;
