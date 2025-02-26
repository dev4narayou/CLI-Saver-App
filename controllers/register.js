const registerRouter = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../utils/supabaseClient");
require("dotenv").config();

// need to handle ui messaging for these errors
registerRouter.post("/", async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({
        error: "Email and password are required"
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Registration error:", error);

      if (error.message.includes("already registered")) {
        return response.status(409).json({
          error: "Email already in use"
        });
      }

      return response.status(400).json({
        error: error.message || "Registration failed"
      });
    }

    return response.status(201).json({
      message: "Registration successful",
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });

  } catch (error) {
    console.error("Server error during registration:", error);
    return response.status(500).json({
      error: "Internal server error during registration"
    });
  }
});

module.exports = registerRouter;
