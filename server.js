const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Connect to MongoDB
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true,
  },
  role: {
    type: String,
    enum: ["farmer", "buyer", "admin"],
    default: "farmer",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Add index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

const User = mongoose.model("User", userSchema);

// Equipment Schema
const equipmentSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  dailyRate: Number,
  location: String,
  availability: Boolean,
  image: String,
});

const Equipment = mongoose.model("Equipment", equipmentSchema);

// Community Post Schema
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  comments: [
    {
      text: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const Post = mongoose.model("Post", postSchema);

// API Routes

// User Authentication
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, phone, password, location } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !password || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      location,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      location: user.location,
      role: user.role,
      lastLogin: user.lastLogin,
    };

    res.json({ message: "Login successful", user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Equipment Routes
app.get("/api/equipment", async (req, res) => {
  try {
    const equipment = await Equipment.find();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/equipment/rent", async (req, res) => {
  try {
    const { equipmentId, startDate, endDate, userId } = req.body;
    // Add rental logic here
    res.json({ message: "Equipment rented successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Community Routes
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().populate("author");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/posts", async (req, res) => {
  try {
    const { title, content, category, authorId } = req.body;
    const post = new Post({ title, content, category, author: authorId });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Market Linkage Routes
app.post("/api/market/list", async (req, res) => {
  try {
    const { cropType, quantity, quality, location, price } = req.body;
    // Add market listing logic here
    res.json({ message: "Produce listed successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
