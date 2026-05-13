interface CardProps {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  hover?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ children, className = '', header, hover = false, onClick }) => (
  <div onClick={onClick} className={`glass-card rounded-3xl overflow-hidden animate-fade-in ${hover ? 'glass-card-hover transition-all cursor-pointer' : ''} ${className}`}>
    {header && <div className="px-5 py-4 border-b border-white/10 font-bold text-white">{header}</div>}
    <div>{children}</div>
  </div>
)
