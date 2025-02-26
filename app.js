const express = require("express");
require("express-async-errors");
const app = express();
const commandRouter = require("./controllers/commands");
const loginRouter = require("./controllers/login");
const userRouter = require("./controllers/users");
const registerRouter = require("./controllers/register");
const requestLogger = require("./utils/middleware").requestLogger;
const logger = require("./utils/logger");
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use(express.static("dist"));
app.use("/api/users", userRouter);
app.use("/api/login", loginRouter);
app.use("/api/register", registerRouter);
app.use("/api/commands", commandRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = app;