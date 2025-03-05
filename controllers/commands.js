const express = require("express");
const commandRouter = express.Router();
const supabase = require("../utils/supabaseClient");
const authenticate = require("../utils/middleware").authenticate;

// Get commands with user information
commandRouter.get("/", authenticate, async (req, res) => {
  console.log("Fetching commands...");

  // Option 1: Join with profiles (if you have a profiles table)
  const { data, error } = await supabase
    .from("Commands")
    .select(
      `
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `
    )
    .eq("user_id", req.user.id);

  // Option 2: Fetch commands first, then fetch user details
  // const { data: commands, error } = await supabase
  //   .from("Commands")
  //   .select("*")
  //   .eq("user_id", req.user.id);

  // if (commands && commands.length > 0) {
  //   // Fetch user email or other info if needed
  //   const { data: userInfo } = await supabase.auth.admin.getUserById(req.user.id);
  //   commands.forEach(cmd => cmd.user_email = userInfo?.email);
  // }

  console.log("Response data:", data);
  console.log("Response error:", error);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

// adding a new command
commandRouter.post("/", authenticate, async (req, res) => {
  const { command } = req.body;

  try {
    // Get the current user from Supabase using the token
    const authHeader = req.headers.authorization;
    const token = authHeader.split(" ")[1];
    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );

    if (userError || !userData.user) {
      return res.status(403).json({ error: "Invalid user token" });
    }

    const userId = userData.user.id;

    // Insert command with user ID from Auth
    const { data, error } = await supabase
      .from("Commands")
      .insert([{ command, user_id: userId }])
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error adding command:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = commandRouter;
