const axios = require("axios");
const fs = require("fs");
const inquirer = require("inquirer");
const path = require("path");
const { execSync } = require("child_process");

const API_BASE_URL = "https://cli-saver-app-e80303b94dbf.herokuapp.com";

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
      `${API_BASE_URL}/api/auth/login`,
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
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Authentication failed:", error.response.data);
      console.error("Status code:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Authentication failed: No response received from server.");
      console.error("Request data:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Authentication failed:", error.message);
    }
    console.error("Config:", error.config);
    throw error;
  }
};

// function to refresh the access token using the refresh token
const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/refresh`,
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
    await axios.get(`${API_BASE_URL}/api/auth/verify`, {
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
      `${API_BASE_URL}/api/commands`,
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
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error saving command:", error.response.data);
      console.error("Status code:", error.response.status);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Error saving command: No response received from server.");
      console.error("Request data:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error saving command:", error.message);
    }
    console.error("Config:", error.config);
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

// check and suggest history configuration
const suggestHistoryConfiguration = async () => {
  const isWindows = process.platform === "win32";
  const isGitBash = isWindows && (process.env.TERM || "").includes("xterm");

  if (isWindows && !isGitBash) {
    console.log(
      "\n📝 NOTE: On Windows, command history retrieval may be limited."
    );
    console.log(
      "For best results, provide the command explicitly when running save-cmd.\n"
    );
    return;
  }

  // check .bashrc
  try {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const bashrcPath = path.join(homeDir, ".bashrc");
    const bashProfilePath = path.join(homeDir, ".bash_profile");

    let configFound = false;
    let configPath = null;

    // check .bashrc if it exists
    if (fs.existsSync(bashrcPath)) {
      const bashrcContent = fs.readFileSync(bashrcPath, "utf-8");
      if (
        bashrcContent.includes('PROMPT_COMMAND="history -a"') ||
        bashrcContent.includes("PROMPT_COMMAND='history -a'") ||
        bashrcContent.includes("PROMPT_COMMAND=history -a")
      ) {
        configFound = true;
      } else {
        configPath = bashrcPath;
      }
    }

    // check .bash_profile if it exists and we haven't found the config yet
    if (!configFound && fs.existsSync(bashProfilePath)) {
      const profileContent = fs.readFileSync(bashProfilePath, "utf-8");
      if (
        profileContent.includes('PROMPT_COMMAND="history -a"') ||
        profileContent.includes("PROMPT_COMMAND='history -a'") ||
        profileContent.includes("PROMPT_COMMAND=history -a")
      ) {
        configFound = true;
      } else if (!configPath) {
        configPath = bashProfilePath;
      }
    }

    // if we didn't find the configuration, suggest adding it
    if (!configFound && configPath) {
      console.log(
        "\n📝 For better command history tracking, we recommend adding:"
      );
      console.log('\x1b[33mPROMPT_COMMAND="history -a"\x1b[0m');
      console.log(`to your ${configPath}`);

      const { shouldModify } = await inquirer.prompt([
        {
          type: "confirm",
          name: "shouldModify",
          message: `Would you like to add this configuration to ${configPath} now?`,
          default: true,
        },
      ]);

      if (shouldModify) {
        try {
          fs.appendFileSync(
            configPath,
            '\n\n# Added by CLI-Saver for better command history tracking\nPROMPT_COMMAND="history -a"\n'
          );
          console.log(`\n✅ Configuration added to ${configPath}`);
          console.log("Please restart your terminal or run:");
          console.log(`\x1b[33msource ${configPath}\x1b[0m`);
          console.log("for the changes to take effect.\n");
        } catch (err) {
          console.log(
            `\n⚠️ Could not modify ${configPath}. Please add the line manually.`
          );
        }
      } else {
        console.log("\nNo problem! You can add it manually later if you want.");
      }
    }
  } catch (error) {
    // silently fail - don't let this prevent the main functionality
  }
};

const main = async () => {
  try {
    // always check if history configuration is optimal
    await suggestHistoryConfiguration();

    const cmdArg = process.argv[2];
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
