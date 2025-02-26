const loginRouter = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const supabase = require("../utils/supabaseClient");

loginRouter.post("/", async (request, response) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "example@email.com",
    password: "example-password",
  });
  const user = data.user;
  const session = data.session;

  if (error) {
    return response.status(401).json({
      error: "invalid username or password",
    });
  }

  const userForToken = {
    email: user.email,
    id: user.id,
  }

  const token = jwt.sign(userForToken, process.env.SECRET);

  response.status(200).json({
    user: {
      id: user.id,
      email: user.email,
    },
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    },
    token // custom JWT
  });
});



// loginRouter.post("/", async (request, response) => {
//   const { username, password } = request.body;

//   try {
//     // Query user from Supabase
//     const { data: user, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("username", username)
//       .single();

//     if (error || !user) {
//       return response.status(401).json({
//         error: "invalid username or password",
//       });
//     }

//     const passwordCorrect = await bcrypt.compare(password, user.passwordHash);

//     if (!passwordCorrect) {
//       return response.status(401).json({
//         error: "invalid username or password",
//       });
//     }

//     const userForToken = {
//       username: user.username,
//       id: user.id,
//     };

//     const token = jwt.sign(userForToken, process.env.SECRET);

//     response
//       .status(200)
//       .send({ token, username: user.username, name: user.name });
//   } catch (error) {
//     console.error("Login error:", error);
//     response.status(500).json({ error: "Server error during login" });
//   }
// });


module.exports = loginRouter;
