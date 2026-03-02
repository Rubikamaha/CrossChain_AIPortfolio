import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("💡 Retrying in 5 seconds...");

    // Retry once after 5 seconds
    setTimeout(async () => {
      try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected on retry");
      } catch (retryError) {
        console.error("❌ MongoDB retry failed:", retryError.message);
        console.error("⚠️ Running without database - historical features disabled");
      }
    }, 5000);
  }
};

// Connection event handlers
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Check if database is connected
export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
