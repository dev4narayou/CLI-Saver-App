// New auth controller for your backend
// filepath: /c:/Users/devma/Documents/CLI-Saver-App/pre-alpha1-backend/controllers/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const authRouter = express.Router();
const supabase = require("../utils/supabaseClient");

// Run this in a Node.js REPL or script
require("crypto").randomBytes(64).toString("hex");

// Login endpoint
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use Supabase to authenticate
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Generate your own JWT tokens
    const access_token = jwt.sign(
      { id: data.user.id, email: data.user.email },
      process.env.SUPABASE_JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refresh_token = jwt.sign(
      { id: data.user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ access_token, refresh_token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Token refresh endpoint
authRouter.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

    // Generate new tokens
    const access_token = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const new_refresh_token = jwt.sign(
      { id: decoded.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ access_token, refresh_token: new_refresh_token });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Token verification endpoint
authRouter.get("/verify", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    res
      .status(200)
      .json({ valid: true, user: { id: decoded.id, email: decoded.email } });
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = authRouter;
