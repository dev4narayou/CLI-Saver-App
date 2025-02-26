const userRouter = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../utils/supabaseClient");
require("dotenv").config();

userRouter.post("/", async (request, response) => {
  const { username, password } = request.body;

  try {
    await supabase
      .from("users")
      .insert([{ username, passwordHash: await bcrypt.hash(password, 10) }]);
  } catch (error) {
    console.error("Login error:", error);
    response.status(500).json({ error: "Server error " });
  }
});

module.exports = userRouter;