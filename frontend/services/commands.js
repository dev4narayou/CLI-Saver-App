import axios from "axios";
const baseUrl = "/api/commands";

let token = null;

const setToken = (newToken) => {
  token = `Bearer ${newToken}`;
  // Update the config after setting the token
  config.headers.Authorization = token;
};

// Define config AFTER the token variable
const config = {
  headers: {
    Authorization: token,
    "Content-Type": "application/json",
  },
};

const getAll = async () => {
  const response = await axios.get(baseUrl, config);
  return response.data;
};

const create = async (newObject) => {
  const { user_id, command } = newObject;
  if (!user_id || !command) {
    throw new Error("Missing required fields");
  }
  const response = await axios.post(baseUrl, newObject, config);
  return response.data;
};

export default { setToken, getAll, create };