import { Spinner } from './Spinner'

interface LoadingProps {
  text?: string
}

export const Loading: React.FC<LoadingProps> = ({ text = '加载中...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Spinner size="lg" />
    <p className="text-slate-400 mt-3 text-sm">{text}</p>
  </div>
)
