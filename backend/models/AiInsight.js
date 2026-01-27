import mongoose from "mongoose";

const AiInsightSchema = new mongoose.Schema({
  wallet: { type: String, required: true, index: true },
  balances: { type: Object, required: true },
  totalValue: { type: Number, required: true },
  insights: { type: [String], required: true },
  recommendations: { type: [String], default: [] },
  riskAssessment: { 
    type: String, 
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Automatically delete records older than 30 days
AiInsightSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

const AiInsightModel = mongoose.model("AiInsight", AiInsightSchema);

export default AiInsightModel;
