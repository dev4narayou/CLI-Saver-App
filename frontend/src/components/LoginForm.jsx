const LoginForm = ({ handleSubmit }) => {
  return (
    <div className="register-form">
      {" "}
      <h2>Log In</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">Email</label>
          <input type="text" name="email" id="login-email" required />
        </div>
        <div>
          <label htmlFor="login-password">Password</label>
          <input type="password" name="password" id="login-password" required />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginForm;
