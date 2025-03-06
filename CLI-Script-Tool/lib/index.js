const axios = require("axios");
const fs = require("fs");
const inquirer = require("inquirer");
const path = require("path");
const { execSync } = require("child_process");

// path to the file where tokens will be stored
const TOKEN_FILE_PATH = path.join(__dirname, "auth.json");

// function to read tokens from the file
const readTokens = () => {
  if (fs.existsSync(TOKEN_FILE_PATH)) {
    const data = fs.readFileSync(TOKEN_FILE_PATH, "utf-8");
    return JSON.parse(data);
  }
  return null;
};

// function to store tokens to the file
const storeTokens = (accessToken, refreshToken) => {
  const tokens = { accessToken, refreshToken };
  fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify(tokens), "utf-8");
};

// function to authenticate using credentials
const authenticate = async () => {
  const { email, password } = await inquirer.prompt([
    { type: "input", name: "email", message: "Email: " },
    { type: "password", name: "password", message: "Password: " },
  ]);

  try {
    // request backend for login (no longer supabase)
    const response = await axios.post(
      "http://localhost:3005/api/auth/login",
      {
        email,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { access_token, refresh_token } = response.data;

    // store tokens locally
    storeTokens(access_token, refresh_token);
    console.log("Authentication successful!");
    return { access_token, refresh_token };
  } catch (error) {
    console.error(
      "Authentication failed:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// function to refresh the access token using the refresh token
const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      "http://localhost:3005/api/auth/refresh",
      {
        refresh_token: refreshToken,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { access_token, refresh_token } = response.data;
    storeTokens(access_token, refresh_token);
    return access_token;
  } catch (error) {
    console.error(
      "Token refresh failed:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// function to check token validity and refresh if needed
const getAccessToken = async () => {
  const tokens = readTokens();

  if (!tokens) {
    console.log("No tokens found, please log in.");
    const result = await authenticate();
    return result.access_token;
  }

  const { accessToken, refreshToken } = tokens;

  try {
    // use backend to verify token instead of Supabase directly
    await axios.get("http://localhost:3005/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return accessToken;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("Access token expired. Refreshing token...");
      try {
        const newAccessToken = await refreshAccessToken(refreshToken);
        return newAccessToken;
      } catch (refreshError) {
        console.log("Refresh token expired. Please log in again.");
        const result = await authenticate();
        return result.access_token;
      }
    }
    throw error;
  }
};

const saveCommand = async (command, description) => {
  try {
    const accessToken = await getAccessToken();

    // for debugging: Log the token (first few characters)
    console.log(`Using token: ${accessToken.substring(0, 15)}...`);

    await axios.post(
      "http://localhost:3005/api/commands",
      {
        command,
        description: description || null,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Command saved successfully!");
  } catch (error) {
    console.error(
      "Error saving command:",
      error.response?.data || error.message
    );
  }
};

// function to get the last executed command across different shell environments
const getLastBashCommand = () => {
  try {
    // try to detect which shell we're running in
    let lastCommand = null;

    // method 1: Try reading bash history file (for Git Bash)
    try {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const bashHistoryPath = path.join(homeDir, ".bash_history");

      if (fs.existsSync(bashHistoryPath)) {
        const history = fs
          .readFileSync(bashHistoryPath, "utf-8")
          .split("\n")
          .filter((line) => line.trim() !== "");

        if (history.length > 0) {
          // get the last non-empty command
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i] && !history[i].includes("node index2.js")) {
              return history[i];
            }
          }
        }
      }
    } catch (e) {
      // silently fail and try next method
    }

    // method 2: Try doskey for Windows Command Prompt
    try {
      const doskeyOutput = execSync("doskey /history").toString().trim();
      const lines = doskeyOutput
        .split("\n")
        .filter((line) => line.trim() !== "");

      if (lines.length > 0) {
        // Find the most recent command that isn't running our script
        for (let i = lines.length - 1; i >= 0; i--) {
          if (!lines[i].includes("node index2.js")) {
            return lines[i].trim();
          }
        }
      }
    } catch (e) {
      // silently fail and try next method
    }

    // method 3: Try to create a temporary batch file to extract cmd.exe history
    // this is a more complex approach that we can't implement easily

    return null;
  } catch (error) {
    console.log("Could not retrieve last command:", error.message);
    return null;
  }
};

const main = async () => {
  try {
    // check if a command was passed as an argument
    const cmdArg = process.argv[2];
    // use command line argument first, then fall back to history
    const lastCommand = cmdArg || getLastBashCommand();

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "command",
        message: "Enter command to save:",
        default: lastCommand || "", // use passed command, history, or empty string
      },
      {
        type: "input",
        name: "description",
        message: "Enter description (optional, press Enter to skip): ",
      },
    ]);

    await saveCommand(answers.command, answers.description);
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
};

main();
