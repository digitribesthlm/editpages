import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  const { method, query: { accessId } } = req;

  console.log('Received request with method:', method, 'and accessId:', accessId);

  if (!accessId) {
    return res.status(401).json({ message: 'Access ID is required' });
  }

  try {
    const { db } = await connectToDatabase();

    const user = await db.collection("users").findOne({
      "accessTokens.token": accessId
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid access token' });
    }

    if (method === 'GET') {
      const pages = await db.collection("pages").find({ companyId: user.companyId }).toArray();
      return res.status(200).json(pages);
    } else if (method === 'PUT') {
      // ... (rest of your PUT logic)
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal server error', details: error.message });
  }
}