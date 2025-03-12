import PropTypes from "prop-types";
import { useState } from "react";

const CommandList = ({ commands, onToggleStar }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (command, id, event) => {
    // stop event propagation to prevent star toggle when copying
    event.stopPropagation();

    navigator.clipboard
      .writeText(command)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => console.error("Failed to copy: ", err));
  };

  const handleStarClick = (id, event) => {
    event.stopPropagation(); // prevent the copy action
    onToggleStar(id);
  };

  const getCommandType = (command) => {
    if (!command) return "default";
    const firstWord = command.trim().split(" ")[0];
    return firstWord.toLowerCase();
  };

  const getCommandColor = (commandType) => {
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
      default: "#6E56CF", // default (purpleish)
    };

    return commandColors[commandType] || commandColors.default;
  };

  if (commands.length === 0) {
    return (
      <div className="no-commands">
        <p>No commands match your filters.</p>
      </div>
    );
  }

  return (
    <ul className="command-list">
      {commands.map((cmd) => {
        const commandType = cmd.command_type || getCommandType(cmd.command);
        const color = getCommandColor(commandType);

        return (
          <li
            key={cmd.id}
            className="command-item"
            style={{
              borderLeft: `4px solid ${color}`,
              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(${parseInt(
                color.slice(1, 3),
                16
              )}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(
                color.slice(5, 7),
                16
              )}, 0.1)`,
            }}
            onClick={(e) => handleCopy(cmd.command, cmd.id, e)}
          >
            <div className="command-header">
              <span className="command-type" style={{ backgroundColor: color }}>
                {commandType}
              </span>
              <div className="command-actions">
                <button
                  className={`star-button ${cmd.is_starred ? "starred" : ""}`}
                  onClick={(e) => handleStarClick(cmd.id, e)}
                  aria-label={
                    cmd.is_starred ? "Unstar command" : "Star command"
                  }
                >
                  {cmd.is_starred ? "★" : "☆"}
                </button>
                <span className="command-date">
                  {cmd.created_at &&
                    new Date(cmd.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="command">
              <code className="command-text">{cmd.command}</code>
              <span
                className={`copy-indicator ${
                  copiedId === cmd.id ? "visible" : ""
                }`}
              >
                Copied!
              </span>
            </div>

            {/* Check for both possible property names for description */}
            {(cmd.description || cmd.annotation) && (
              <p className="command-description">
                {cmd.description || cmd.annotation}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
};

CommandList.propTypes = {
  commands: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      command: PropTypes.string.isRequired,
      command_type: PropTypes.string,
      description: PropTypes.string,
      annotation: PropTypes.string, // alt / legacy property name
      created_at: PropTypes.string,
      is_starred: PropTypes.bool,
    })
  ).isRequired,
  onToggleStar: PropTypes.func.isRequired,
};

export default CommandList;
