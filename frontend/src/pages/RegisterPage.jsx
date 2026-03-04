import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../auth/auth";
import { getErrorMessage } from "../api/getErrorMessage";
import { useI18n } from "../client/i18n/I18nContext";

function isValidEmail(emailValue) {
  const regexForMail = /^\S+@\S+\.\S+$/;
  return regexForMail.test(emailValue);
}

function isValidDisplayName(displayNameValue) {
  // твоє правило: тільки латиниця, цифри, . і _ , 3–30
  const regexForDisplayName = /^[a-zA-Z0-9._]{3,30}$/;
  return regexForDisplayName.test(displayNameValue);
}

export default function RegisterPage() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { t } = useI18n();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const emailTrim = email.trim().toLowerCase();
    const displayNameTrim = displayName.trim();

    if (!isValidEmail(emailTrim)) {
      setError(t("auth.errors.invalidEmail"));
      return;
    }

    if (!isValidDisplayName(displayNameTrim)) {
      setError(t("auth.errors.invalidDisplayName"));
      return;
    }

    if (password.length < 8) {
      setError(t("auth.errors.passwordMin"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.errors.passwordMismatch"));
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
      setError(getErrorMessage(err, t("auth.errors.registrationFailed")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h1>{t("auth.registerTitle")}</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <input
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder={t("auth.displayNamePlaceholder")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder={t("auth.passwordPlaceholder")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder={t("auth.confirmPasswordPlaceholder")}
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
          <option value="USER">{t("roles.USER", "USER")}</option>
          <option value="OWNER">{t("roles.OWNER", "OWNER")}</option>
        </select>

        <button
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          {loading ? t("common.loadingShort") : t("auth.createAccount")}
        </button>

        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>

      <div style={{ marginTop: 12 }}>
        {t("auth.haveAccount")} <Link to="/login">{t("nav.login")}</Link>
      </div>
    </div>
  );
}