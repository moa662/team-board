import React, { useState, useEffect } from 'react'
import { db, type Member } from '../db'
import { EmptyState } from '../components'
import { formatTime } from '../utils/date'

interface DashboardProps {
  onNavigate: (tab: string) => void
}

interface DayCell {
  date: Date
  classCount: number
  completedCount: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isPast: boolean
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d
  })
  const [calendarCells, setCalendarCells] = useState<DayCell[]>([])
  const [maxDayCount, setMaxDayCount] = useState(1)
  const [selectedDayClasses, setSelectedDayClasses] = useState<any[]>([])
  const [lowMembers, setLowMembers] = useState<Member[]>([])
  const [monthTotal, setMonthTotal] = useState(0)
  const [monthCompleted, setMonthCompleted] = useState(0)

  const loadCalendar = async () => {
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const firstDayOfWeek = (firstOfMonth.getDay() + 6) % 7 // 周一为首
    const gridStart = new Date(firstOfMonth)
    gridStart.setDate(firstOfMonth.getDate() - firstDayOfWeek)
    gridStart.setHours(0, 0, 0, 0)

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const cells: DayCell[] = []
    let max = 0
    let totalThisMonth = 0
    let completedThisMonth = 0

    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999)

      const classes = await db.classes.where('startTime').between(d, dEnd).toArray()
      const completed = classes.filter(c => c.status === 'completed').length

      const isCurrentMonth = d.getMonth() === month
      if (isCurrentMonth) {
        totalThisMonth += classes.length
        completedThisMonth += completed
      }
      if (classes.length > max) max = classes.length

      cells.push({
        date: d,
        classCount: classes.length,
        completedCount: completed,
        isCurrentMonth,
        isToday: d.getTime() === today.getTime(),
        isSelected: d.getTime() === selectedDate.getTime(),
        isPast: d.getTime() < today.getTime()
      })
    }

    setCalendarCells(cells)
    setMaxDayCount(max || 1)
    setMonthTotal(totalThisMonth)
    setMonthCompleted(completedThisMonth)
  }

  const loadSelectedDay = async () => {
    const start = new Date(selectedDate); start.setHours(0, 0, 0, 0)
    const end = new Date(start); end.setHours(23, 59, 59, 999)
    const classes = await db.classes.where('startTime').between(start, end).toArray()
    classes.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    setSelectedDayClasses(classes)
  }

  const loadMembers = async () => {
    const allMembers = await db.members.toArray()
    const low = allMembers.filter(m => m.remainingClasses > 0 && m.remainingClasses <= 3)
      .sort((a, b) => a.remainingClasses - b.remainingClasses).slice(0, 5)
    setLowMembers(low)
  }

  useEffect(() => { loadCalendar() }, [viewMonth, selectedDate])
  useEffect(() => { loadSelectedDay() }, [selectedDate])
  useEffect(() => { loadMembers() }, [])

  const handleCompleteClass = async (classId: number) => {
    await db.completeClass(classId)
    await loadSelectedDay()
    await loadCalendar()
    await loadMembers()
  }

  const goPrevMonth = () => {
    const d = new Date(viewMonth); d.setMonth(d.getMonth() - 1); setViewMonth(d)
  }
  const goNextMonth = () => {
    const d = new Date(viewMonth); d.setMonth(d.getMonth() + 1); setViewMonth(d)
  }
  const goToday = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    setSelectedDate(today)
    const m = new Date(today); m.setDate(1)
    setViewMonth(m)
  }

  // 热力色：基于课时密度比例
  const getHeatStyle = (count: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return { background: 'transparent', borderColor: 'transparent' }
    if (count === 0) return { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }
    const ratio = count / maxDayCount
    // 紫色渐进：低饱和→高饱和
    const opacity = 0.15 + ratio * 0.55
    const borderOpacity = 0.25 + ratio * 0.4
    return {
      background: `rgba(139, 92, 246, ${opacity.toFixed(2)})`,
      borderColor: `rgba(139, 92, 246, ${borderOpacity.toFixed(2)})`
    }
  }

  const monthLabel = viewMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  const selectedLabel = selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })
  const isSelectedToday = selectedDate.getTime() === (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime() })()
  const pendingCount = selectedDayClasses.filter(c => c.status === 'scheduled').length

  // 找下一节课（仅今天且未完成）
  const nextClass = isSelectedToday
    ? selectedDayClasses.find(c => c.status === 'scheduled' && c.startTime.getTime() > Date.now())
    : null

  return (
    <div className="space-y-4">
      {/* 1. 月度日历热力图 */}
      <div className="glass-card rounded-2xl p-4 md:p-5">
        {/* 月份导航 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goPrevMonth}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all text-sm"
          >
            ←
          </button>
          <div className="flex items-center gap-3">
            <div className="font-bold text-white">{monthLabel}</div>
            <button
              onClick={goToday}
              className="text-[10px] px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-colors"
            >
              今天
            </button>
          </div>
          <button
            onClick={goNextMonth}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all text-sm"
          >
            →
          </button>
        </div>

        {/* 本月汇总 - 一行薄字 */}
        <div className="flex items-center justify-center gap-4 mb-3 text-xs">
          <span className="text-slate-400">本月共 <span className="text-violet-300 font-semibold">{monthTotal}</span> 节</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">完成 <span className="text-emerald-300 font-semibold">{monthCompleted}</span> 节</span>
          {monthTotal > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">完成率 <span className="text-cyan-300 font-semibold">{Math.round(monthCompleted / monthTotal * 100)}%</span></span>
            </>
          )}
        </div>

        {/* 周次表头 */}
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {['一', '二', '三', '四', '五', '六', '日'].map((w, i) => (
            <div key={w} className={`text-center text-[10px] font-medium ${i >= 5 ? 'text-orange-400/60' : 'text-slate-500'}`}>
              {w}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell, i) => {
            const heatStyle = getHeatStyle(cell.classCount, cell.isCurrentMonth)
            const isWeekend = i % 7 >= 5
            return (
              <button
                key={i}
                onClick={() => cell.isCurrentMonth && setSelectedDate(cell.date)}
                disabled={!cell.isCurrentMonth}
                style={heatStyle}
                className={`
                  aspect-square rounded-lg border flex flex-col items-center justify-center relative transition-all
                  ${!cell.isCurrentMonth ? 'opacity-0 pointer-events-none' : 'hover:scale-105 cursor-pointer'}
                  ${cell.isSelected ? 'ring-2 ring-violet-400 ring-offset-1 ring-offset-slate-900' : ''}
                `}
              >
                <span className={`text-xs font-semibold ${
                  cell.isToday ? 'text-violet-200' :
                  cell.isPast ? 'text-white/50' :
                  isWeekend ? 'text-orange-300/80' : 'text-white/85'
                }`}>
                  {cell.date.getDate()}
                </span>
                {cell.classCount > 0 && (
                  <span className="text-[9px] font-bold text-white/95 leading-none mt-0.5">
                    {cell.classCount}
                  </span>
                )}
                {cell.isToday && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-violet-300" />
                )}
              </button>
            )
          })}
        </div>

        {/* 热力图例 */}
        <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-slate-500">
          <span>少</span>
          <div className="flex gap-0.5">
            {[0.18, 0.32, 0.46, 0.60, 0.74].map((o, i) => (
              <div key={i} className="w-3 h-3 rounded-sm border" style={{ background: `rgba(139,92,246,${o})`, borderColor: `rgba(139,92,246,${o + 0.1})` }} />
            ))}
          </div>
          <span>多</span>
        </div>
      </div>

      {/* 2. 今日 / 选中日 时间轴 */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-base">{isSelectedToday ? '⏰' : '📋'}</span>
            <span className="text-sm font-semibold text-white">
              {isSelectedToday ? '今日课程' : selectedLabel}
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-medium">
                待上 {pendingCount}
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigate('schedule')}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            完整排课 →
          </button>
        </div>

        {/* 下一节课突出显示 */}
        {nextClass && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/30">
                  {nextClass.memberName[0]}
                </div>
                <div>
                  <div className="text-[10px] text-violet-300 font-medium uppercase tracking-wider">下一节</div>
                  <div className="font-bold text-white">{nextClass.memberName}</div>
                  <div className="text-xs text-slate-400">{formatTime(nextClass.startTime)} · {nextClass.duration}分钟</div>
                </div>
              </div>
              <button
                onClick={() => handleCompleteClass(nextClass.id!)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-semibold transition-colors"
              >
                ✓ 完成
              </button>
            </div>
          </div>
        )}

        {selectedDayClasses.length === 0 ? (
          <EmptyState icon={isSelectedToday ? '🌴' : '📅'} title={isSelectedToday ? '今天没有课程' : '当天没有课程'} />
        ) : (
          <div className="p-3 space-y-1">
            {selectedDayClasses.map(cls => {
              const isNext = nextClass && cls.id === nextClass.id
              if (isNext) return null // 已在上方突出显示
              return (
                <div
                  key={cls.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-1 h-9 rounded-full flex-shrink-0 ${
                    cls.status === 'completed' ? 'bg-emerald-500' :
                    cls.status === 'cancelled' ? 'bg-slate-500' :
                    'bg-gradient-to-b from-violet-500 to-fuchsia-500'
                  }`} />
                  <div className="w-12 text-xs text-slate-400 font-mono tabular-nums">
                    {formatTime(cls.startTime)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{cls.memberName}</div>
                    <div className="text-[10px] text-slate-500">{cls.duration}分钟</div>
                  </div>
                  {cls.status === 'completed' && <span className="text-[10px] text-emerald-400">✓</span>}
                  {cls.status === 'cancelled' && <span className="text-[10px] text-slate-500">取消</span>}
                  {cls.status === 'scheduled' && isSelectedToday && (
                    <button
                      onClick={() => handleCompleteClass(cls.id!)}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 text-[10px] font-medium transition-all"
                    >
                      完成
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. 续费提醒 */}
      {lowMembers.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden border-orange-500/20">
          <div className="px-5 py-3 flex items-center justify-between border-b border-white/10 bg-orange-500/5">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <span className="text-sm font-semibold text-orange-300">续费提醒</span>
              <span className="text-[10px] text-orange-400/60">课时 ≤ 3</span>
            </div>
            <button
              onClick={() => onNavigate('members')}
              className="text-xs text-orange-300 hover:text-orange-200 transition-colors"
            >
              管理会员 →
            </button>
          </div>
          <div className="p-3 space-y-1">
            {lowMembers.map(m => (
              <div
                key={m.id}
                onClick={() => onNavigate('members')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/30 to-amber-500/30 border border-orange-500/30 flex items-center justify-center font-bold text-sm text-orange-200">
                    {m.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{m.name}</div>
                    <div className="text-[10px] text-slate-500">{m.phone || '未填手机'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-orange-400">{m.remainingClasses}</div>
                  <div className="text-[10px] text-slate-500">剩余</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
