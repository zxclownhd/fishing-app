export const translations = {
  en: {
    nav: {
      home: "Home",
      profile: "Profile",
      owner: "Owner",
      admin: "Admin",
      favorites: "Favorites",
      logout: "Logout",
      login: "Login",
      register: "Register",
    },
    common: {
      loadingShort: "...",
    },
    auth: {
      registerTitle: "Register",
      emailPlaceholder: "Email",
      displayNamePlaceholder: "Display name",
      passwordPlaceholder: "Password",
      confirmPasswordPlaceholder: "Confirm password",
      createAccount: "Create account",
      haveAccount: "Have an account?",
      loginTitle: "Login",
      noAccount: "No account?",
      errors: {
        invalidEmail: "Invalid email",
        invalidDisplayName:
          "Display name: only letters, numbers, . and _ (3-30 chars)",
        passwordMin: "Password must be at least 8 characters",
        passwordMismatch: "Password does not match",
        registrationFailed: "Registration failed",
        invalidCredentials: "Invalid credentials",
      },
    },
    pages: {},
    errors: {},
  },
  uk: {
    nav: {
      home: "Головна",
      profile: "Профіль",
      owner: "Власник",
      admin: "Адмін",
      favorites: "Обране",
      logout: "Вийти",
      login: "Увійти",
      register: "Реєстрація",
    },
    common: {
      loadingShort: "...",
    },
    auth: {
      registerTitle: "Реєстрація",
      emailPlaceholder: "Ел. пошта",
      displayNamePlaceholder: "Ім’я для відображення",
      passwordPlaceholder: "Пароль",
      confirmPasswordPlaceholder: "Підтвердіть пароль",
      createAccount: "Створити акаунт",
      haveAccount: "Вже є акаунт?",
      loginTitle: "Вхід",
      noAccount: "Немає акаунта?",
      errors: {
        invalidEmail: "Некоректна ел. пошта",
        invalidDisplayName:
          "Ім’я: лише латиниця, цифри, . та _ (3–30 символів)",
        passwordMin: "Пароль має бути не менше 8 символів",
        passwordMismatch: "Паролі не збігаються",
        registrationFailed: "Не вдалося зареєструватися",
        invalidCredentials: "Невірна пошта або пароль",
      },
    },
    pages: {},
    errors: {},
  },
};

export const supportedLocales = ["en", "uk"];

export function getBrowserLocale() {
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("uk")) return "uk";
  return "en";
}
