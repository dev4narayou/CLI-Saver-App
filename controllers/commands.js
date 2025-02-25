const express = require("express");
const commandRouter = express.Router();

// currently returns all commands
commandRouter.get("/", (req, res) => {
  res.send("Hello World!");
});

// adding a new command
commandRouter.post("/", (req, res) => {
  const newNote = req.body ? req.body : null;
  if (newNote) {
    res.status(201).json(newNote);
  }
});






module.exports = commandRouter;