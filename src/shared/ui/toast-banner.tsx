import { CheckCircle, AlertCircle, X } from "lucide-react"

export type ToastVariant = "success" | "error" | "info"

type ToastBannerProps = {
  message: string
  variant?: ToastVariant
  onDismiss: () => void
}

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-emerald-950/30 border-emerald-800/50 text-emerald-200",
  error: "bg-red-950/30 border-red-800/50 text-red-200",
  info: "bg-indigo-950/30 border-indigo-800/50 text-indigo-200",
}

export const ToastBanner = ({ message, variant = "info", onDismiss }: ToastBannerProps) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-xs ${variantStyles[variant]}`}
  >
    <div className="flex items-start gap-2">
      {variant === "success" ? (
        <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <p>{message}</p>
    </div>
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss notification"
      className="shrink-0 rounded-lg p-1 hover:bg-white/5 cursor-pointer transition"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
)
