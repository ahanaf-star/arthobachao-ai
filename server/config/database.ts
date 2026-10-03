import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB safely without crashing the server if disconnected
 */
export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '' || uri.includes('your_mongodb_connection_string')) {
    console.warn('[Database] MONGODB_URI is not configured in .env. Running in standalone fallback mode.');
    isConnected = false;
    return false;
  }

  try {
    // Masked URI check for logging without exposing credentials
    const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log(`[Database] Connecting to MongoDB at ${maskedUri}...`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = true;
    console.log('[Database] MongoDB connected successfully.');

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB runtime connection error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. Falling back to standalone mode.');
      isConnected = false;
    });

    return true;
  } catch (error: any) {
    console.warn('[Database] Unable to connect to MongoDB:', error?.message || error);
    console.warn('[Database] The server will continue running using in-memory / local fallback data.');
    isConnected = false;
    return false;
  }
}

/**
 * Check if MongoDB connection is currently active
 */
export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get active database name
 */
export function getDatabaseName(): string | undefined {
  return isDbConnected() ? mongoose.connection.name : undefined;
}
