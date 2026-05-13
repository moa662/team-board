type TagVariant = 'green' | 'red' | 'blue' | 'orange' | 'gray' | 'violet'

interface TagProps {
  variant?: TagVariant
  children: React.ReactNode
}

const variantClasses: Record<TagVariant, string> = {
  green: 'bg-emerald-500/20 text-emerald-400',
  red: 'bg-red-500/20 text-red-400',
  blue: 'bg-cyan-500/20 text-cyan-400',
  orange: 'bg-orange-500/20 text-orange-400',
  gray: 'bg-slate-500/20 text-slate-400',
  violet: 'bg-violet-500/20 text-violet-400'
}

export const Tag: React.FC<TagProps> = ({ variant = 'green', children }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold ${variantClasses[variant]}`}>
    {children}
  </span>
)
