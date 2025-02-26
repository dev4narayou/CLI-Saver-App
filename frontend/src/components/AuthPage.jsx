import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthPage = ({ handleLogin, handleRegister }) => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="auth-container">
      <div className="auth-toggle">
        <button
          className={showLogin ? "active" : ""}
          onClick={() => setShowLogin(true)}
        >
          Log In
        </button>
        <button
          className={!showLogin ? "active" : ""}
          onClick={() => setShowLogin(false)}
        >
          Register
        </button>
      </div>

      <div className="auth-form-container">
        {showLogin ? (
          <LoginForm handleSubmit={handleLogin} />
        ) : (
          <RegisterForm handleSubmit={handleRegister} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
