import { useState, useRef, useEffect, useMemo } from "react";
import "./App.css";
import "./components/CommandList";
import AuthPage from "./components/AuthPage";
import CommandList from "./components/CommandList";
import registerService from "../services/register";
import commandService from "../services/commands";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  // states for filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "week", "month"
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // existing states
  const [sampleCommands, setSampleCommands] = useState([
    {
      id: "1",
      command: "git status",
      annotation: "Check the status of the repository",
      tags: ["git", "status"],
    },
    {
      id: "2",
      command: "npm install",
      annotation: "Install all dependencies",
      tags: ["npm", "install"],
    },
    {
      id: "3",
      command: "docker-compose up",
      annotation: "Start the Docker containers",
      tags: ["docker", "compose"],
    },
  ]);
  const [commands, setCommands] = useState([]);
  const [session, setSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const searchInputRef = useRef(null);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage(""); // Clear previous error message
    const res = await supabase.auth.signInWithPassword({
      email: event.target.email.value,
      password: event.target.password.value,
    });
    const { data, error } = res;

    if (data) {
      console.log("Logged in:", data);
    }
    if (error) {
      console.error("Login failed:", error);
      setErrorMessage("Login failed: " + error.message);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setErrorMessage(""); // Clear previous error message
    const { data, error } = await supabase.auth.signUp({
      email: event.target.email.value,
      password: event.target.password.value,
    });
    if (data) {
      console.log("Registration successful:", data);
    }
    if (error) {
      console.error("Registration failed:", error);
      setErrorMessage("Registration failed: " + error.message);
    }
  };

  const getCommands = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("Commands")
      .select("*")
      .eq("user_id", user.id);
    setCommands(data);
  };

  const filteredCommands = useMemo(() => {
    if (!commands || commands.length === 0) return [];

    return commands.filter((cmd) => {
      // filter by search term
      const matchesSearch =
        searchTerm === "" ||
        cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cmd.description &&
          cmd.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cmd.annotation &&
          cmd.annotation.toLowerCase().includes(searchTerm.toLowerCase()));

      // filter by date
      let matchesDate = true;
      if (dateFilter !== "all" && cmd.created_at) {
        const cmdDate = new Date(cmd.created_at);
        const now = new Date();

        if (dateFilter === "today") {
          // check if command was created today
          matchesDate = cmdDate.toDateString() === now.toDateString();
        } else if (dateFilter === "week") {
          // check if command was created within the last 7 days
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = cmdDate >= weekAgo;
        } else if (dateFilter === "month") {
          // check if command was created within the last 30 days
          const monthAgo = new Date(now);
          monthAgo.setDate(monthAgo.getDate() - 30);
          matchesDate = cmdDate >= monthAgo;
        }
      }

      // filter by starred status
      const matchesStarred = !showStarredOnly || cmd.is_starred;

      return matchesSearch && matchesDate && matchesStarred;
    });
  }, [commands, searchTerm, dateFilter, showStarredOnly]);

  // function to toggle star status of a command
  const toggleStar = async (id) => {
    try {
      const commandToUpdate = commands.find((cmd) => cmd.id === id);
      if (!commandToUpdate) return;

      const newStarredStatus = !commandToUpdate.is_starred;

      // update in Supabase
      const { error } = await supabase
        .from("Commands")
        .update({ is_starred: newStarredStatus })
        .eq("id", id);

      if (error) throw error;

      // update local state
      setCommands(
        commands.map((cmd) =>
          cmd.id === id ? { ...cmd, is_starred: newStarredStatus } : cmd
        )
      );
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  // Add handleLogout function
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      console.log("Logged out successfully");
      // The session will be automatically updated by the onAuthStateChange listener
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // listen for auth state changes
  useEffect(() => {
    // set initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // set up listener for future auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // clean up the subscription
    return () => {
      if (data?.subscription) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  // fetch commands on initial render
  useEffect(() => {
    getCommands();
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    // focus on input when component mounts
    searchInputRef.current?.focus();

    // re-focus when the window regains focus (e.g., after alt+tab)
    const handleWindowFocus = () => {
      searchInputRef.current?.focus();
    };
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [session]);

  const handleClick = () => {
    setSampleCommands([
      ...sampleCommands,
      {
        id: "4",
        command: 'echo "Hello, world!"',
        annotation: "Prints a message to the console",
        tags: ["echo"],
      },
    ]);
  };

  // TESTING
  const submitCommand = async (event) => {
    event.preventDefault();
    const res = await supabase.from("Commands").insert([
      {
        user_id: session.user.id,
        command: event.target.command.value,
      },
    ]);
    console.log(res);
    console.log("submitted command");
  };

  // END TESTING
  const currentSession = session;

  return (
    <>
      {!session && (
        <AuthPage handleLogin={handleLogin} handleRegister={handleRegister} />
      )}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {session && (
        <div className="app-container">
          <header className="app-header">
            <div className="header-top">
              <div className="logo-section">
                <h1>Command Saver</h1>
                <span className="app-version">Beta</span>
              </div>

              <div className="user-section">
                <span className="user-email">{session.user.email}</span>
                <button
                  className="logout-button"
                  onClick={handleLogout}
                  aria-label="Log out"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="search-section">
              <div className="search-wrapper">
                <svg
                  className="search-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search for your saved commands..."
                  className="main-search-bar"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  ref={searchInputRef}
                />
              </div>
            </div>

            <div className="filter-bar">
              <div className="filter-options">
                <div className="filter-group">
                  <label>Date:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                <div className="filter-group starred-filter">
                  <label>
                    <input
                      type="checkbox"
                      checked={showStarredOnly}
                      onChange={(e) => setShowStarredOnly(e.target.checked)}
                    />
                    <span>Starred Only</span>
                  </label>
                </div>
              </div>

              <div className="github-link">
                <a
                  href="https://github.com/dev4narayou/CLI-Saver-App"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/github-mark-white.png"
                    alt="Github repository"
                    width="20"
                    height="20"
                  />
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
          </header>

          <main className="app-main">
            <CommandList
              commands={filteredCommands}
              onToggleStar={toggleStar}
            />
          </main>
        </div>
      )}
    </>
  );
}

export default App;
