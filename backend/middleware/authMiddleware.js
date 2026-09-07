import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    console.log('========== AUTH CHECK ==========');
    console.log('URL:', req.originalUrl);
    console.log('METHOD:', req.method);

    const authHeader = req.headers.authorization;

    console.log('Authorization header exists:', !!authHeader);
    console.log('Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No Authorization header provided',
      });
    }

    const token = authHeader.split(' ')[1];

    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length);

    if (!token) {
      return res.status(401).json({
        message: 'No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('JWT decoded successfully:', decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.error('========== AUTH ERROR ==========');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.error('================================');

    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};

export default authMiddleware;
