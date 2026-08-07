import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Make sure we attach the correct user id
    // If your JWT payload has _id, use decoded._id
    req.user = {
      id: decoded.id || decoded._id,
      role: decoded.role, // include role if you need role-based checks
    };

    // Optional: validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: 'Invalid user id in token' });
    }

    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
