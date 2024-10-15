// /pages/api/pages.js
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  const { method, query: { accessId } } = req;

  if (!accessId) {
    return res.status(401).json({ message: 'Access ID is required' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("seotitledesc");

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
    return res.status(500).json({ message: 'Internal server error' });
  }
}