import { useState, useRef, useEffect } from 'react'
import './App.css'
import './components/CommandList'
import CommandList from './components/CommandList';

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sampleCommands, setSampleCommands] = useState([
    { id: '1', command: 'git status', annotation: 'Check the status of the repository', tags: ['git', 'status'] },
    { id: '2', command: 'npm install', annotation: 'Install all dependencies', tags: ['npm', 'install'] },
    { id: '3', command: 'docker-compose up', annotation: 'Start the Docker containers', tags: ['docker', 'compose'] },
  ]);

  const searchInputRef = useRef(null);

  useEffect(() => {
    // Focus on input when component mounts
    searchInputRef.current.focus();

    // Re-focus when the window regains focus (e.g., after alt+tab)
    const handleWindowFocus = () => {
      searchInputRef.current.focus();
    };
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  const handleClick = () => {
    setSampleCommands([...sampleCommands, { id: '4', command: 'echo "Hello, world!"', annotation: 'Prints a message to the console', tags: ['echo'] }]);
  }

  return (
    <>
      <div className="app-container">
        <header className="app-header">
          <h1>Command Saving App</h1>
          <input
            type="text"
            placeholder="Search for your saved commands..."
            className="main-search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            ref={searchInputRef}
          />
        </header>
        <main className="app-main">
          {/* Placeholder for command list */}
          <CommandList commands={sampleCommands} />
          <button onClick={() => handleClick()}>TEST ADD</button>
        </main>
      </div>
    </>
  );
}

export default App
