const express = require("express");
const app = express();
const commandRouter = require("./controllers/commands");

const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("Body:  ", request.body);
  console.log("---");
  next();
};

app.use(requestLogger);
app.use(express.json());

app.use(express.static("dist"));
app.use("/api/commands", commandRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = app;