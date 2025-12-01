import type {
  ButtonHTMLAttributes,
  CSSProperties,
  PropsWithChildren
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const styles: Record<ButtonVariant, CSSProperties> = {
    primary: {
      backgroundColor: "#2563eb",
      color: "#fff"
    },
    secondary: {
      backgroundColor: "#e2e8f0",
      color: "#0f172a"
    },
    ghost: {
      backgroundColor: "transparent",
      color: "#0f172a",
      border: "1px solid #cbd5f5"
    }
  };

  return (
    <button
      style={{
        border: "none",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 14,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        ...styles[variant]
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
