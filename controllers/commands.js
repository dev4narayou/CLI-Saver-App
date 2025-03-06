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
  const { command, description } = req.body;

  try {
    // The authenticate middleware already verified the token
    // and put the user info in req.user
    const userId = req.user.id;

    const commandType = command.trim().split(" ")[0].toLowerCase();

    // Insert command with user ID from the JWT token
    const { data, error } = await supabase
      .from("Commands")
      .insert([
        {
          command,
          description: description || null,
          user_id: userId,
          command_type: commandType,
        },
      ])
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
