const Organizer = require("../models/Organizer");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../services/authService");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password must be at least 6 characters" });
    }

    const existing = await Organizer.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    const passwordHash = await hashPassword(password);
    const organizer = await Organizer.create({ name, email, passwordHash });
    const token = generateToken(organizer._id);

    res.status(201).json({
      token,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    const organizer = await Organizer.findOne({ email: email.toLowerCase() });
    if (!organizer) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await comparePassword(password, organizer.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(organizer._id);

    res.json({
      token,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCurrentOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.organizerId).select(
      "-passwordHash",
    );
    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found" });
    }
    res.json(organizer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
