import { useState, useRef, useEffect, use } from 'react'
import './App.css'
import './components/CommandList'
import AuthPage from "./components/AuthPage";
import CommandList from './components/CommandList';
import loginService from '../services/login';
import registerService from '../services/register';

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sampleCommands, setSampleCommands] = useState([
    { id: '1', command: 'git status', annotation: 'Check the status of the repository', tags: ['git', 'status'] },
    { id: '2', command: 'npm install', annotation: 'Install all dependencies', tags: ['npm', 'install'] },
    { id: '3', command: 'docker-compose up', annotation: 'Start the Docker containers', tags: ['docker', 'compose'] },
  ]);
  const [user, setUser] = useState(null); // holds the login response object (see backend/controllers/login.js)

  const handleLogin = async (event) => {
    event.preventDefault();
    const res = await loginService.login({
      email: event.target.email.value,
      password: event.target.password.value,
    });
    if (res) {
      setUser(res);
      localStorage.setItem('user', JSON.stringify(res));
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const res = await registerService.register({
      email: event.target.email.value,
      password: event.target.password.value,
    });
  };

  const getCommands = async () => {
    // const { data } = await supabase.from('commands').select('*');
    // console.log(data);
  }

  const searchInputRef = useRef(null);

  useEffect(() => {
    const loggedInUserJSON = localStorage.getItem('user');
    if (loggedInUserJSON) {
      const user = JSON.parse(loggedInUserJSON);
      setUser(user);
    }
  }
  , []);

  useEffect(() => {
    getCommands();
  }
  , []);

  useEffect(() => {
    if (user == null) {
      return;
    }
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
      {user == null && (
        <AuthPage handleLogin={handleLogin} handleRegister={handleRegister} />
      )}
      {user != null && (
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
      )}
    </>
  );
}

export default App
