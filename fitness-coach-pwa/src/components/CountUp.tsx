import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  formatter?: (n: number) => string
  className?: string
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  formatter,
  className
}) => {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) {
      setDisplay(to)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (to - from) * eased
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      fromRef.current = display
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  const isInt = Number.isInteger(value)
  const text = formatter
    ? formatter(display)
    : isInt
      ? Math.round(display).toLocaleString()
      : display.toFixed(1)

  return <span className={className}>{prefix}{text}{suffix}</span>
}
