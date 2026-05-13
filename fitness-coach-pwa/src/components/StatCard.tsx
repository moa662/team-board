import { CountUp } from './CountUp'

interface StatCardProps {
  value: string | number
  label: string
  color?: 'default' | 'green' | 'orange' | 'blue' | 'purple' | 'red'
  icon?: string
}

const colorClasses = {
  default: 'from-slate-400 to-slate-300',
  green: 'from-emerald-400 to-teal-400',
  orange: 'from-orange-400 to-amber-400',
  blue: 'from-cyan-400 to-blue-400',
  purple: 'from-violet-400 to-fuchsia-400',
  red: 'from-red-400 to-rose-400'
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, color = 'default', icon }) => {
  // 提取纯数字做动画;混合字符串(¥1234)拆出前缀
  let display: React.ReactNode = value
  if (typeof value === 'number') {
    display = <CountUp value={value} />
  } else if (typeof value === 'string') {
    const match = value.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/)
    if (match) {
      const [, prefix, num, suffix] = match
      const n = parseFloat(num.replace(/,/g, ''))
      if (!isNaN(n)) {
        display = <CountUp value={n} prefix={prefix} suffix={suffix} formatter={v => Math.round(v).toLocaleString()} />
      }
    }
  }

  return (
    <div className="glass-card lift-card rounded-2xl p-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <div className={`text-2xl font-extrabold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
          {display}
        </div>
      </div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </div>
  )
}
