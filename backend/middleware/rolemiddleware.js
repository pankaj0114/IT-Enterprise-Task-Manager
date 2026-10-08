export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: 'Access denied: role not found',
      });
    }

    const userRole = String(req.user.role).trim().toLowerCase();

    const normalizedAllowedRoles = allowedRoles.map((role) =>
      String(role).trim().toLowerCase(),
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied: insufficient role',
      });
    }

    next();
  };
};
