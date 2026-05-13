import React from 'react'

interface FormItemProps {
  label: string
  children: React.ReactNode
  className?: string
}

export const FormItem: React.FC<FormItemProps> = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
      {label}
    </label>
    {children}
  </div>
)

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  className?: string
}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-5 py-3.5 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 focus:bg-white/15 transition-all font-medium ${className}`}
    {...props}
  />
)

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  className?: string
  options: { value: string | number; label: string }[]
}

export const Select: React.FC<SelectProps> = ({ className = '', options, ...props }) => (
  <div className="relative">
    <select
      className={`w-full px-5 py-3.5 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 focus:bg-white/15 transition-all font-medium appearance-none cursor-pointer pr-10 ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-slate-800 text-white">{opt.label}</option>
      ))}
    </select>
    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)
