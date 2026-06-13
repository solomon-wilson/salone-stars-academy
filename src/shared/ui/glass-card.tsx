import React from "react"

type GlassCardProps = {
  children: React.ReactNode
  className?: string
  id?: string
}

export const GlassCard = ({ children, className = "", id }: GlassCardProps) => (
  <div id={id} className={`glass-card-dark ${className}`}>
    {children}
  </div>
)
