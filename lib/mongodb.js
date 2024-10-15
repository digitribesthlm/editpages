import { MongoClient } from 'mongodb';

const db_database = process.env.MONGODB_DB;
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!db_database) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB at:', uri);
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    const db = client.db(db_database);
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('An error occurred while connecting to MongoDB:', error);
    throw error;
  }
}