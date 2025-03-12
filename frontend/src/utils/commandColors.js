// Command type color mapping
const commandColors = {
  git: "#F05033",
  npm: "#CB3837",
  yarn: "#2C8EBB",
  docker: "#2496ED",
  kubectl: "#326CE5",
  ssh: "#4D4D4D",
  aws: "#FF9900",
  gcloud: "#4285F4",
  az: "#0078D4",
  curl: "#073551",
  wget: "#35BF5C",
  python: "#3776AB",
  node: "#339933",
  echo: "#FFA500",
  default: "#6E56CF", // Default purple for unknown command types
};

/**
 * Get color for a specific command type
 * @param {string} commandType - The command type
 * @returns {string} - Color hex code
 */
export const getCommandColor = (commandType) => {
  if (!commandType) return commandColors.default;

  // check if we have an exact match
  if (commandColors[commandType]) {
    return commandColors[commandType];
  }

  // check if any key in commandColors is a prefix of commandType
  for (const prefix in commandColors) {
    if (commandType.startsWith(prefix)) {
      return commandColors[prefix];
    }
  }

  return commandColors.default;
};

export default commandColors;
