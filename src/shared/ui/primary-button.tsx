import React from "react"

type PrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  loading?: boolean
}

export const PrimaryButton = ({ children, loading, className = "", disabled, ...props }: PrimaryButtonProps) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`bg-brand-primary hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-indigo-sm disabled:opacity-50 cursor-pointer ${className}`}
  >
    {loading ? "Loading..." : children}
  </button>
)
