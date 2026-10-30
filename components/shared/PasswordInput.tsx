"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: ReactNode;
};

export function PasswordInput({ label, helper, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="password-input-wrap">
        <input {...inputProps} type={visible ? "text" : "password"} />
        <button
          type="button"
          className="password-visibility"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {helper}
    </label>
  );
}
