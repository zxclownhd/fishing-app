import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../auth/auth";

export default function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");


  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const emailTrim = email.trim().toLowerCase();
    const displayNameTrim = displayName;

    const validationEmail = (email) => {
      const regexForMail = /^\S+@\S+\.\S+$/;
      return regexForMail.test(email);
    };
    const validationDisplayName = (displayName) => {
      const regexForDisplayName = /^[a-zA-Z0-9._]{3,30}$/;
      return regexForDisplayName.test(displayName);
    };

    if (!validationEmail(emailTrim)) {
      setError("Invalid email");
      return;
    };

    if (!validationDisplayName(displayNameTrim)) {
      setError("Display name: only letters, numbers, . and _");
      return;
    }

    if(password.length < 8) {
      setError("Password must be at least 8 character");
      return;
    };

    if (password !== confirmPassword) {
    setError("Password does not match")
    return;
    }

    try {
      setLoading(true);
      await register({
        email: emailTrim,
        password,
        displayName: displayNameTrim,
        role,
      });
      nav("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  //const emailTrim = email.trim().toLowerCase();
  //const displayNameTrim = displayName;

  //const emailValid = /^\S+@\S+\.\S+$/.test(emailTrim);
  //const displayNameValid = /^[a-zA-Z0-9._]+$/.test(displayNameTrim);

  //const passwordValid = password.length >= 8;
  //const passwordsMatch = password === confirmPassword;

  //const canSubmit = emailValid && displayNameValid && passwordValid && passwordsMatch;

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h1>Register</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        >
          <option value="USER">USER</option>
          <option value="OWNER">OWNER</option>
        </select>

        <button disabled={loading} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }}>
          {loading ? "..." : "Create account"}
        </button>

        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>

      <div style={{ marginTop: 12 }}>
        Have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
}