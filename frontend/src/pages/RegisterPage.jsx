import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../auth/auth";
import { getErrorMessage } from "../api/getErrorMessage";
import { useI18n } from "../client/i18n/I18nContext";

function isValidEmail(emailValue) {
  const e = String(emailValue || "").trim();

  // only printable ASCII (blocks кирилицю/emoji)
  if (!/^[\u0021-\u007E]+$/.test(e)) return false;

  // basic email shape
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function isValidDisplayName(displayNameValue) {
  // only latin letters, digits, . and _ , 3–30
  const regexForDisplayName = /^[a-zA-Z0-9._]{3,30}$/;
  return regexForDisplayName.test(displayNameValue);
}

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

export default function RegisterPage() {
  const nav = useNavigate();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("USER");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    form: "",
  });

  function validate() {
    const next = {
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
      form: "",
    };

    const emailTrim = email.trim().toLowerCase();
    const displayNameTrim = displayName.trim();

    if (!emailTrim) next.email = t("auth.errors.emailRequired");
    else if (!isValidEmail(emailTrim)) next.email = t("auth.errors.invalidEmail");

    if (!displayNameTrim) next.displayName = t("auth.errors.displayNameRequired");
    else if (!isValidDisplayName(displayNameTrim))
      next.displayName = t("auth.errors.invalidDisplayName");

    if (!password) next.password = t("auth.errors.passwordRequired");
    else if (password.length < 8) next.password = t("auth.errors.passwordMin");

    if (!confirmPassword) next.confirmPassword = t("auth.errors.confirmPasswordRequired");
    else if (password !== confirmPassword)
      next.confirmPassword = t("auth.errors.passwordMismatch");

    setErrors(next);
    return (
      !next.email && !next.displayName && !next.password && !next.confirmPassword
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrors((p) => ({ ...p, form: "" }));

    if (!validate()) return;

    const emailTrim = email.trim().toLowerCase();
    const displayNameTrim = displayName.trim();

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
      setErrors((p) => ({
        ...p,
        form: getErrorMessage(err, t("auth.errors.registrationFailed")),
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h1>{t("auth.registerTitle")}</h1>

      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 10, marginTop: 12 }}
      >
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
            placeholder={t("auth.displayNamePlaceholder")}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (errors.displayName) setErrors((p) => ({ ...p, displayName: "" }));
            }}
            style={inputStyle(!!errors.displayName)}
          />
          <FieldError msg={errors.displayName} />
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

        <div style={{ display: "grid", gap: 6 }}>
          <input
            placeholder={t("auth.confirmPasswordPlaceholder")}
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword)
                setErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            style={inputStyle(!!errors.confirmPassword)}
          />
          <FieldError msg={errors.confirmPassword} />
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={inputBase}
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

        {errors.form ? <div style={{ color: "crimson" }}>{errors.form}</div> : null}
      </form>

      <div style={{ marginTop: 12 }}>
        {t("auth.haveAccount")} <Link to="/login">{t("nav.login")}</Link>
      </div>
    </div>
  );
}