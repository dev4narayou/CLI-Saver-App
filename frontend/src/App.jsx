import { useState, useRef, useEffect, use } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleLogin = async (event) => {
    event.preventDefault();
    // login from frontend
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
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email: event.target.email.value,
      password: event.target.password.value,
    });
    if (data) {
      console.log("Registration successful:");
    }
    if (error) {
      console.error("Registration failed:", error);
    }
  };

  const getCommands = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('Commands')
      .select('*')
      .eq('user_id', user.id);
    setCommands(data);
  };

  const searchInputRef = useRef(null);

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

  useEffect(() => {
    getCommands();
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    // Focus on input when component mounts
    searchInputRef.current?.focus();

    // Re-focus when the window regains focus (e.g., after alt+tab)
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
    const res = await supabase
      .from('Commands')
      .insert([
        {
          user_id: session.user.id,
          command: event.target.command.value,
        },
      ])
    console.log(res);
    console.log("submitted command")
  };

  // END TESTING
  const currentSession = session;

  return (
    <>
      {!session && (
        <AuthPage handleLogin={handleLogin} handleRegister={handleRegister} />
      )}
      {session && (
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
            <div className="header-integrations">
              {/* <div className="api-access">Setup API Access</div> */}
              <div className="github-logo">
                <img
                  src="/github-mark-white.png"
                  alt="Github logo"
                  width="24"
                  height="24"
                />
              </div>
            </div>
          </header>
          <main className="app-main">
            {/* Placeholder for command list */}
            <CommandList commands={commands} />

            <div id="testing">
              <h2>⬇️ Testing below here ⬇️</h2>
              <button onClick={() => handleClick()}>TEST ADD</button>
              <form onSubmit={submitCommand}>
                <label htmlFor="command"> command </label>
                <input type="text" id="command" name="command" />
                <button type="submit">Submit</button>
              </form>
              <button
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                      console.error("Error signing out:", error);
                      // Optionally, show an error message to the user
                    } else {
                      console.log("Successfully signed out");
                      setSession(null); // Explicitly update local state
                      // Optionally, redirect the user or update the UI
                    }
                  } catch (err) {
                    console.error("Unexpected error:", err);
                    // Optionally, show an error message to the user
                  }
                }}
              >
                logout
              </button>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

export default App;
