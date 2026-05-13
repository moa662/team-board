import { useEffect, useRef, useState, useCallback } from 'react'

interface WheelColumnProps {
  items: (string | number)[]
  value: string | number
  onChange: (v: string | number) => void
  itemHeight?: number
  visibleCount?: number
}

const WheelColumn: React.FC<WheelColumnProps> = ({
  items,
  value,
  onChange,
  itemHeight = 40,
  visibleCount = 5
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const scrollTimerRef = useRef<number | null>(null)
  const initRef = useRef(false)

  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = items.findIndex(i => i === value)
    return idx >= 0 ? idx : 0
  })

  // value 由外部变化时同步
  useEffect(() => {
    const idx = items.findIndex(i => i === value)
    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx)
      const el = containerRef.current
      if (el) {
        el.scrollTo({ top: idx * itemHeight, behavior: initRef.current ? 'smooth' : 'auto' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items])

  // 初始定位
  useEffect(() => {
    const el = containerRef.current
    if (!el || initRef.current) return
    el.scrollTop = currentIndex * itemHeight
    initRef.current = true
  }, [currentIndex, itemHeight])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    isScrollingRef.current = true
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = window.setTimeout(() => {
      const idx = Math.round(el.scrollTop / itemHeight)
      const clamped = Math.max(0, Math.min(items.length - 1, idx))
      el.scrollTo({ top: clamped * itemHeight, behavior: 'smooth' })
      if (clamped !== currentIndex) {
        setCurrentIndex(clamped)
        onChange(items[clamped])
        // 触觉反馈（移动端）
        if ('vibrate' in navigator) navigator.vibrate(8)
      }
      isScrollingRef.current = false
    }, 110)
  }, [itemHeight, items, currentIndex, onChange])

  const padding = (visibleCount - 1) / 2 * itemHeight

  return (
    <div className="relative flex-1" style={{ height: visibleCount * itemHeight }}>
      {/* 中央高亮区域 */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-10 rounded-xl bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-violet-500/15 border-y border-violet-500/30"
        style={{
          top: padding,
          height: itemHeight
        }}
      />
      {/* 上下渐变遮罩 */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-20 bg-gradient-to-b from-slate-900 to-transparent"
        style={{ height: padding }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none z-20 bg-gradient-to-t from-slate-900 to-transparent"
        style={{ height: padding }}
      />
      {/* 滚动容器 */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div style={{ height: padding }} />
        {items.map((item, i) => {
          const distance = Math.abs(i - currentIndex)
          const opacity = distance === 0 ? 1 : distance === 1 ? 0.55 : 0.25
          const scale = distance === 0 ? 1 : 0.88
          return (
            <div
              key={i}
              className="flex items-center justify-center font-bold tabular-nums select-none"
              style={{
                height: itemHeight,
                scrollSnapAlign: 'center',
                opacity,
                transform: `scale(${scale})`,
                transition: 'opacity 0.2s, transform 0.2s',
                fontSize: distance === 0 ? '1.6rem' : '1.3rem',
                color: distance === 0 ? '#fff' : '#94a3b8'
              }}
            >
              {typeof item === 'number' ? item.toString().padStart(2, '0') : item}
            </div>
          )
        })}
        <div style={{ height: padding }} />
      </div>
    </div>
  )
}

interface TimeWheelPickerProps {
  value: { hour: number; minute: number }
  onChange: (v: { hour: number; minute: number }) => void
  minuteStep?: number
}

export const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({
  value,
  onChange,
  minuteStep = 15
}) => {
  const isPM = value.hour >= 12
  const period = isPM ? 'PM' : 'AM'
  const hour12 = value.hour % 12 === 0 ? 12 : value.hour % 12

  const hours12 = Array.from({ length: 12 }, (_, i) => i + 1) // 1-12
  const minutes = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep)

  const setPeriod = (p: 'AM' | 'PM') => {
    const newHour = p === 'AM'
      ? (value.hour >= 12 ? value.hour - 12 : value.hour)
      : (value.hour < 12 ? value.hour + 12 : value.hour)
    onChange({ hour: newHour, minute: value.minute })
  }

  const setHour12 = (h: string | number) => {
    const h12 = Number(h)
    const newHour = isPM
      ? (h12 === 12 ? 12 : h12 + 12)
      : (h12 === 12 ? 0 : h12)
    onChange({ hour: newHour, minute: value.minute })
  }

  const setMinute = (m: string | number) => {
    onChange({ hour: value.hour, minute: Number(m) })
  }

  return (
    <div className="space-y-3">
      {/* 上下午切换 */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setPeriod('AM')}
            className={`px-6 py-1.5 rounded-xl text-sm font-bold transition-all ${
              period === 'AM'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ☀️ 上午
          </button>
          <button
            type="button"
            onClick={() => setPeriod('PM')}
            className={`px-6 py-1.5 rounded-xl text-sm font-bold transition-all ${
              period === 'PM'
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🌙 下午
          </button>
        </div>
      </div>

      {/* 双滚轮 */}
      <div className="flex items-center justify-center gap-2 px-6">
        <WheelColumn items={hours12} value={hour12} onChange={setHour12} />
        <div className="text-3xl font-bold text-violet-300 -mt-1">:</div>
        <WheelColumn items={minutes} value={value.minute} onChange={setMinute} />
      </div>

      <div className="text-center text-xs text-slate-500">
        滑动滚轮选择时间 · 步长 {minuteStep} 分钟
      </div>
    </div>
  )
}
