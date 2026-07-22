import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { login as loginApi } from "../../services/authApi";
import { useAuth } from "../../hooks/useAuth";

import { Navigate } from "react-router-dom";

import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { user, token } = await loginApi({
        email,
        password,
      });

      login(user, token);

      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const { token } = useAuth();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.container}>
      <form
        className={styles.card}
        onSubmit={handleSubmit}
      >
        <h1>Login</h1>

        <p>Welcome back.</p>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          required
        />

        <button
          type="submit"
          disabled={loading}
          className = {styles.log}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p>
          Don't have an account?{" "}
          <Link to="/register" className={styles.reg}>
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}