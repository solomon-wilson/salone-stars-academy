import React from "react"

export const AppBackground = () => (
  <>
    <div
      className="absolute inset-0 opacity-25 pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at 22% 28%, #f472b6, transparent 55%), radial-gradient(circle at 78% 22%, #c084fc, transparent 55%), radial-gradient(circle at 72% 78%, #fb923c, transparent 50%), radial-gradient(circle at 18% 82%, #60a5fa, transparent 55%)",
      }}
    />
    <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div
        className="desktop-flow-line top-[15%]"
        style={{
          background: "linear-gradient(90deg, #7c3aed00, #7c3aed73 22%, #a855f7b3, #2563eb7a 78%, #2563eb00)",
          animation: "desktop-flow-1 20s ease-in-out infinite",
        }}
      />
      <div
        className="desktop-flow-line top-[50%]"
        style={{
          background: "linear-gradient(90deg, #2563eb00, #2563eb60 30%, #7c3aed80 70%, #7c3aed00)",
          animation: "desktop-flow-2 25s ease-in-out infinite",
        }}
      />
    </div>
    <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none opacity-15">
      <div
        className="mobile-flow-line top-[20%]"
        style={{
          background: "linear-gradient(90deg, #7c3aed00, #7c3aed60 50%, #7c3aed00)",
          animation: "mobile-flow-1 18s ease-in-out infinite",
        }}
      />
    </div>
  </>
)

export const SierraLeoneFlagStripe = ({ className = "" }: { className?: string }) => (
  <div className={`h-2 w-full flex ${className}`} aria-hidden="true">
    <div className="flex-1 bg-[#0072C6]" />
    <div className="flex-1 bg-white" />
    <div className="flex-1 bg-[#1EB53A]" />
  </div>
)
