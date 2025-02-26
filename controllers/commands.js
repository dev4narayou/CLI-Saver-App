const express = require("express");
const commandRouter = express.Router();
const supabase = require("../utils/supabaseClient");

commandRouter.get("/", async (req, res) => {
  console.log("Fetching commands...");
  const { data, error } = await supabase.from("Commands").select("*");
  console.log("Response data:", data);
  console.log("Response error:", error);
  if (error) return res.status(400).json({ error });
  res.json(data);
});

// adding a new command
commandRouter.post("/", async (req, res) => {
  const newCommand = req.body ? req.body : null;
  if (newCommand) {
    const { data, error } = await supabase
      .from("Commands")
      .insert(newCommand)
      .select();

    if (error) return res.status(400).json({ error });
    res.status(201).json(data[0]);
  } else {
    res.status(400).json({ error: "No data provided" });
  }
});

module.exports = commandRouter;
