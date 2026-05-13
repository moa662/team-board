import { useState } from 'react'

interface DateChipsProps {
  value: Date
  onChange: (d: Date) => void
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const addDays = (d: Date, n: number) => {
  const r = new Date(d); r.setDate(d.getDate() + n); r.setHours(0, 0, 0, 0); return r
}

const formatChipLabel = (d: Date) => {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${m}/${day}`
}

const formatWeek = (d: Date) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]

const formatInputValue = (d: Date) => {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const DateChips: React.FC<DateChipsProps> = ({ value, onChange }) => {
  const [showCustom, setShowCustom] = useState(false)
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })()
  const presets = [
    { label: '今天', date: today },
    { label: '明天', date: addDays(today, 1) },
    { label: '后天', date: addDays(today, 2) }
  ]

  const isPreset = presets.some(p => sameDay(p.date, value))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {presets.map(p => {
          const active = sameDay(p.date, value)
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => { onChange(p.date); setShowCustom(false) }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                active
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="leading-tight">{p.label}</div>
              <div className={`text-[10px] font-normal mt-0.5 ${active ? 'text-white/80' : 'text-slate-500'}`}>
                {formatChipLabel(p.date)} · {formatWeek(p.date)}
              </div>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setShowCustom(s => !s)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            !isPreset || showCustom
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="leading-tight">📅 自定义</div>
          {!isPreset && (
            <div className="text-[10px] font-normal mt-0.5 text-white/80">
              {formatChipLabel(value)} · {formatWeek(value)}
            </div>
          )}
        </button>
      </div>
      {showCustom && (
        <input
          type="date"
          value={formatInputValue(value)}
          onChange={e => {
            if (!e.target.value) return
            const [y, m, d] = e.target.value.split('-').map(Number)
            const newDate = new Date(y, m - 1, d, 0, 0, 0, 0)
            onChange(newDate)
          }}
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      )}
    </div>
  )
}
