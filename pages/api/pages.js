// /pages/api/pages.js
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  const { method, query: { accessId } } = req;

  console.log('Received request with method:', method, 'and accessId:', accessId);

  if (!accessId) {
    return res.status(401).json({ message: 'Access ID is required' });
  }

  try {
    console.log('Attempting to connect to database...');
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
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
      const { pageId, ...updateData } = req.body;
      if (!pageId) {
        return res.status(400).json({ message: 'pageId is required for updates' });
      }
      const result = await db.collection("pages").updateOne(
        { pageId: parseInt(pageId), companyId: user.companyId },
        { $set: updateData }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Page not found' });
      }
      return res.status(200).json({ message: 'Page updated successfully' });
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    
    // Safe logging of environment variable status
    console.log('Environment variables status:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('MONGODB_DB:', process.env.MONGODB_DB ? 'Set' : 'Not set');

    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
}