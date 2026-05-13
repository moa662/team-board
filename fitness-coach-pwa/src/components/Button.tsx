import React from 'react'
import { Spinner } from './Spinner'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: 'button' | 'submit'
  fullWidth?: boolean
}

const variantClasses = {
  primary: 'btn-primary text-white',
  secondary: 'btn-secondary text-white hover:text-white',
  danger: 'bg-red-500/80 text-white hover:bg-red-500'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-2xl',
  lg: 'px-5 py-3.5 text-base rounded-3xl'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  fullWidth = false
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 ${
      variantClasses[variant]
    } ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
  >
    {loading && <Spinner size="sm" />}
    {children}
  </button>
)
