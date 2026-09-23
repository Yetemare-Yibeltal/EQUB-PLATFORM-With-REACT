const { verifyToken } = require("../services/authService");

module.exports = function protect(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = verifyToken(token);
    req.organizerId = decoded.id;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Not authorized, invalid or expired token" });
  }
};
