import PropTypes from "prop-types";

const CommandList = ({ commands }) => {
  return (
    <ul className="command-list">
      {commands.map((command) => (
        <li key={command.id} className="command-item">
          <div className="command">
            <span className="command-text">{command.command}</span>
            <button className="copy-button">Copy</button>
          </div>
          <p className="annotation">{command.annotation}</p>
          <div className="tags">{/* Placeholder for tags */}</div>
        </li>
      ))}
    </ul>
  );
};

CommandList.propTypes = {
  commands: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      command: PropTypes.string.isRequired,
      annotation: PropTypes.string,
    })
  ).isRequired,
};

export default CommandList;
