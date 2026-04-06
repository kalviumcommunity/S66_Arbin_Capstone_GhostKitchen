import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const getJwtToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  phone: user.phone,
  address: user.address,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = async (req, res) => {
  try {
    const { username, email, password, phone, address, role, ownerCode } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    let normalizedRole = "customer";
    if (role === "owner") {
      const validOwnerCode = process.env.OWNER_REGISTRATION_CODE;
      if (!validOwnerCode || ownerCode !== validOwnerCode) {
        return res.status(403).json({ message: "Invalid owner registration code" });
      }
      normalizedRole = "owner";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: String(username).trim(),
      email: String(email).toLowerCase().trim(),
      password: hashedPassword,
      role: normalizedRole,
      phone,
      address,
    });

    const token = getJwtToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Register failed", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();
    const ownerEmail = String(process.env.OWNER_LOGIN_EMAIL || "").toLowerCase().trim();
    const ownerPassword = String(process.env.OWNER_LOGIN_PASSWORD || "");

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    if (!ownerEmail || !ownerPassword) {
      return res.status(500).json({ message: "Owner login credentials are not configured" });
    }

    if (normalizedEmail === ownerEmail) {
      if (password !== ownerPassword) {
        return res.status(401).json({ message: "Invalid owner credentials" });
      }

      let ownerUser = await User.findOne({ email: ownerEmail });

      if (!ownerUser) {
        const hashedOwnerPassword = await bcrypt.hash(ownerPassword, 10);
        ownerUser = await User.create({
          username: "Owner",
          email: ownerEmail,
          password: hashedOwnerPassword,
          role: "owner",
        });
      } else if (ownerUser.role !== "owner") {
        ownerUser.role = "owner";
        ownerUser.password = await bcrypt.hash(ownerPassword, 10);
        await ownerUser.save();
      }

      const token = getJwtToken(ownerUser._id);

      return res.json({
        message: "Login successful",
        token,
        user: sanitizeUser(ownerUser),
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.role === "owner") {
      return res.status(401).json({ message: "Invalid owner credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = getJwtToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({ user: sanitizeUser(req.user) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { username, phone, address } = req.body;

    const updates = {};
    if (username !== undefined) updates.username = String(username).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (address !== undefined) updates.address = String(address).trim();

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: "Profile updated",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};
