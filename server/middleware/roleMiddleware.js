const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};

export default authorizeRoles;
