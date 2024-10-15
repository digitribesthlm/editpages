import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  const { method, query: { accessId } } = req;

  console.log('Received request with method:', method, 'and accessId:', accessId);

  if (!accessId) {
    return res.status(401).json({ message: 'Access ID is required' });
  }

  try {
    console.log('Attempting to connect to database...');
    const { db } = await connectToDatabase();
    console.log('Successfully connected to database');

    const user = await db.collection("users").findOne({
      "accessTokens.token": accessId
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid access token' });
    }

    if (method === 'GET') {
      console.log('Fetching pages for companyId:', user.companyId);
      const pages = await db.collection("pages").find({ companyId: user.companyId }).toArray();
      console.log('Fetched pages:', pages.length);
      return res.status(200).json(pages);
    } else if (method === 'PUT') {
      // ... (rest of your PUT logic)
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error.message);
    
    // Safe logging of environment variable status
    console.log('Environment variables status:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('MONGODB_DB:', process.env.MONGODB_DB ? 'Set' : 'Not set');

    // In development, you might want more details
    if (process.env.NODE_ENV !== 'production') {
      console.error('Full error:', error);
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
}