module.exports = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    next(); // ✅ Admin access
  } else {
    res.status(403).send('Access denied. Admins only.');
  }
};
