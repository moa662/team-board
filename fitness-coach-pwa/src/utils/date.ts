export const formatDate = (date: Date, format: 'full' | 'short' | 'month' = 'full'): string => {
  const d = new Date(date)
  switch (format) {
    case 'full':
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    case 'short':
      return d.toLocaleDateString('zh-CN')
    case 'month':
      return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  }
}

export const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export const formatWeekday = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN', { weekday: 'long' })
}

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export const startOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export const endOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}
