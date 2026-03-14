import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../auth/auth";
import { getErrorMessage } from "../api/getErrorMessage";
import { useI18n } from "../client/i18n/I18nContext";
import PasswordInput from "../components/PasswordInput";
import "./RegisterPage.css";

function FieldError({ msg }) {
  if (!msg) return null;
  return <div className="error-text register-page__field-error">{msg}</div>;
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
    <div className="page register-page">
      <div className="container register-page__container">
        <section className="register-page__brand">
          <div className="register-page__brand-surface">
            <h1 className="register-page__brand-title">fishing-app</h1>
            <p className="register-page__brand-subtitle">{t("auth.registerBrandSubtitle")}</p>
          </div>
        </section>

        <section className="card register-page__card">
          <h2 className="section-title register-page__form-title">{t("auth.loginTitle")}</h2>

          <form onSubmit={onSubmit} className="register-page__form">
            <div className="register-page__field">
              <input
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                className={`input${errors.email ? " register-page__input--error" : ""}`}
              />
              <FieldError msg={errors.email} />
            </div>

            <div className="register-page__field">
              <PasswordInput
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                }}
                className={`input${errors.password ? " register-page__input--error" : ""}`}
              />
              <FieldError msg={errors.password} />
            </div>

            <button disabled={loading} className="btn btn-primary register-page__submit">
              {loading ? t("common.loadingShort") : t("auth.loginBtn")}
            </button>

            {errors.form ? <div className="error-text">{errors.form}</div> : null}
          </form>

          <div className="register-page__footer-text">
            {t("auth.noAccount")} <Link to="/register">{t("nav.register")}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
