import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../auth/auth";
import { getErrorMessage } from "../api/getErrorMessage";
import { useI18n } from "../client/i18n/I18nContext";

const inputBase = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
};

function inputStyle(hasError) {
  return hasError ? { ...inputBase, borderColor: "crimson" } : inputBase;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <div style={{ color: "crimson", fontSize: 13 }}>{msg}</div>;
}

export default function LoginPage() {
  const nav = useNavigate();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", form: "" });

  function validate() {
    const next = { email: "", password: "", form: "" };

    const emailTrim = email.trim().toLowerCase();
    const pass = password;

    if (!emailTrim) next.email = t("auth.errors.emailRequired");
    else {
      const regexForMail = /^\S+@\S+\.\S+$/;
      if (!regexForMail.test(emailTrim)) next.email = t("auth.errors.emailInvalid");
    }

    if (!pass) next.password = t("auth.errors.passwordRequired");

    setErrors(next);
    return !next.email && !next.password;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors((p) => ({ ...p, form: "" }));

    if (!validate()) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
      nav("/");
    } catch (err) {
      const msg = getErrorMessage(err, "auth.errors.invalidCredentials", t);
      setErrors((p) => ({ ...p, form: msg }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h1>{t("auth.loginTitle")}</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <input
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: "" }));
            }}
            style={inputStyle(!!errors.email)}
          />
          <FieldError msg={errors.email} />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <input
            placeholder={t("auth.passwordPlaceholder")}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: "" }));
            }}
            style={inputStyle(!!errors.password)}
          />
          <FieldError msg={errors.password} />
        </div>

        <button
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" }}
        >
          {loading ? t("common.loadingShort") : t("auth.loginBtn")}
        </button>

        {errors.form ? <div style={{ color: "crimson" }}>{errors.form}</div> : null}
      </form>

      <div style={{ marginTop: 12 }}>
        {t("auth.noAccount")} <Link to="/register">{t("nav.register")}</Link>
      </div>
    </div>
  );
}