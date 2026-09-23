const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;

exports.hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

exports.comparePassword = (password, hash) => bcrypt.compare(password, hash);

exports.generateToken = (organizerId) =>
  jwt.sign({ id: organizerId }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
