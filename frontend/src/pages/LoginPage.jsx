import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../auth/auth";
import { getErrorMessage } from "../api/getErrorMessage";
import { useI18n } from "../client/i18n/I18nContext";

export default function LoginPage() {
  const nav = useNavigate();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await login(email.trim(), password);
      nav("/");
    } catch (err) {
      console.error(err);
      const msg = getErrorMessage(err, t("auth.errors.invalidCredentials"));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h1>{t("auth.loginTitle")}</h1>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 10, marginTop: 12 }}
      >
        <input
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder={t("auth.passwordPlaceholder")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <button
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          {loading ? t("common.loadingShort") : t("nav.login")}
        </button>

        {error && <div style={{ color: "crimson" }}>{error}</div>}
      </form>

      <div style={{ marginTop: 12 }}>
        {t("auth.noAccount")} <Link to="/register">{t("nav.register")}</Link>
      </div>
    </div>
  );
}
