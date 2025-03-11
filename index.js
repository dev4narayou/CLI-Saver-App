const express = require("express");
const app = require("./app");

const PORT = process.env.PORT || 3005;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
