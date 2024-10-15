import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to Vercel environment variables (MONGODB_URI)');
}

if (!process.env.MONGODB_DB) {
  throw new Error('Please add your Mongo DB name to Vercel environment variables (MONGODB_DB)');
}

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

// Safe logging of environment variable status
if (process.env.NODE_ENV !== 'production') {
  console.log('Environment variables status:');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  console.log('MONGODB_DB:', process.env.MONGODB_DB ? 'Set' : 'Not set');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(process.env.MONGODB_URI, options);
  clientPromise = client.connect();
}

export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to database');
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}