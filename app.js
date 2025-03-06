const express = require("express");
require("express-async-errors");
const app = express();
const commandRouter = require("./controllers/commands");
const userRouter = require("./controllers/users");
const authRouter = require("./controllers/authenticate");
const requestLogger = require("./utils/middleware").requestLogger;
const logger = require("./utils/logger");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use(express.static("dist"));
app.use("/api/users", userRouter);
app.use("/api/commands", commandRouter);
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = app;