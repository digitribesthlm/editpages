
// /lib/auth.js
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './mongodb';

export async function verifyToken(req) {
  const token = req.cookies.token;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ userId: decoded.userId });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}