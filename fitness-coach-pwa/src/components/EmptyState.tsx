interface EmptyStateProps {
  icon: string
  title: string
  description?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="p-10 text-center">
    <div className="text-4xl mb-3">{icon}</div>
    <div className="text-slate-300 font-medium">{title}</div>
    {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
  </div>
)
