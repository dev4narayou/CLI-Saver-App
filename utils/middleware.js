const jwt = require("jsonwebtoken");
require("dotenv").config();

const requestLogger = (request, response, next) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("Body:  ", request.body);
  console.log("---");
  next();
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Received token (first 15 chars):", token.substring(0, 15));

  try {
    // verify we're using the correct secret
    console.log(
      "Using JWT secret:",
      process.env.SUPABASE_JWT_SECRET
        ? "Secret is defined"
        : "Secret is UNDEFINED"
    );

    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
    console.log("Token decoded successfully for user ID:", decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = { requestLogger, authenticate };
