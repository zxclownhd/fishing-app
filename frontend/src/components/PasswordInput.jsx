import { useState } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2 12s3.5-6 10-6c2.43 0 4.44.84 6.04 1.9M22 12s-3.5 6-10 6c-2.43 0-4.44-.84-6.04-1.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 9.9A3 3 0 0 1 14.1 14.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 3L21 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PasswordInput({
  className = "",
  showLabel = "Show password",
  hideLabel = "Hide password",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const ariaLabel = visible ? hideLabel : showLabel;

  return (
    <div className="password-input">
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        className={`${className} password-input__field`.trim()}
      />
      <button
        type="button"
        aria-label={ariaLabel}
        className="password-input__toggle"
        onClick={() => setVisible((prev) => !prev)}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
