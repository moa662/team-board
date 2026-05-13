import React, { useState } from 'react'
import { Modal, Button, StatCard, EmptyState, PageHeader, Card, Tag, FormItem, Loading, ConfirmDialog, TimeWheelPicker, DateChips } from '../components'
import { useClasses } from '../hooks/useClasses'
import { formatDate, formatTime, formatWeekday, addDays, startOfDay } from '../utils/date'
import { db, type Class } from '../db'

type ViewMode = 'day' | 'week'

const getWeekDates = (date: Date): Date[] => {
  const d = new Date(date)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const result = new Date(monday)
    result.setDate(monday.getDate() + i)
    return result
  })
}

const useWeekClasses = (weekDates: Date[]) => {
  const [weekClasses, setWeekClasses] = useState<Record<string, Class[]>>({})
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    const loadWeekClasses = async () => {
      setLoading(true)
      const result: Record<string, Class[]> = {}

      for (const date of weekDates) {
        const start = startOfDay(date)
        const end = new Date(start)
        end.setHours(23, 59, 59, 999)

        const classes = await db.classes.where('startTime').between(start, end).toArray()
        classes.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        result[start.toDateString()] = classes
      }

      setWeekClasses(result)
      setLoading(false)
    }
    loadWeekClasses()
  }, [weekDates.map(d => d.toDateString()).join(',')])

  return { weekClasses, loading }
}

export const SchedulePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ memberId: 0, startTime: '', duration: 60 })

  const { todayClasses, members, loading: dayLoading, completeClass, cancelClass, addClass } = useClasses(selectedDate)
  const weekDates = getWeekDates(selectedDate)
  const { weekClasses, loading: weekLoading } = useWeekClasses(weekDates)

  const handleCompleteClass = async (classId: number) => {
    setCompletingId(classId)
    await completeClass(classId)
    setCompletingId(null)
  }

  const handleCancelClass = async () => {
    if (confirmCancelId) {
      await cancelClass(confirmCancelId)
      setConfirmCancelId(null)
    }
  }

  const handleSubmitClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.memberId || !formData.startTime) return
    await addClass(formData.memberId, new Date(formData.startTime), formData.duration)
    setIsAddModalOpen(false)
    setFormData({ memberId: 0, startTime: '', duration: 60 })
  }

  const scheduledCount = todayClasses.filter(c => c.status === 'scheduled').length
  const completedCount = todayClasses.filter(c => c.status === 'completed').length

  const getTagVariant = (status: string): 'green' | 'gray' | 'orange' => {
    switch (status) {
      case 'completed': return 'green'
      case 'cancelled': return 'gray'
      default: return 'orange'
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const goToPrevWeek = () => setSelectedDate(addDays(selectedDate, -7))
  const goToNextWeek = () => setSelectedDate(addDays(selectedDate, 7))

  const totalWeekClasses = Object.values(weekClasses).flat().length
  const weekScheduled = Object.values(weekClasses).flat().filter(c => c.status === 'scheduled').length
  const weekCompleted = Object.values(weekClasses).flat().filter(c => c.status === 'completed').length

  const loading = viewMode === 'day' ? dayLoading : weekLoading

  // 触摸滑动切换视图
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 60
    const isRightSwipe = distance < -60
    if (isLeftSwipe && viewMode === 'day') setViewMode('week')
    if (isRightSwipe && viewMode === 'week') setViewMode('day')
  }

  if (loading) return <Loading text="加载课程中..." />

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <PageHeader
        title="排课管理"
        subtitle="管理会员课程安排"
        action={<Button onClick={() => setIsAddModalOpen(true)}>+ 添加课程</Button>}
      />

      {/* 视图切换 + 日期导航 */}
      <Card className="mb-4">
        <div className="p-4">
          {/* 顶部 - 视图切换胶囊 */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex p-1 bg-white/5 rounded-2xl border border-white/10">
              <button
                onClick={() => setViewMode('day')}
                className={`px-5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  viewMode === 'day'
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                日视图
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                周视图
              </button>
            </div>
          </div>

          {/* 日期导航 */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={viewMode === 'day' ? () => setSelectedDate(addDays(selectedDate, -1)) : goToPrevWeek}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-all"
            >
              ←
            </button>

            <div className="flex-1 text-center">
              {viewMode === 'week' ? (
                <div className="font-semibold text-white">
                  {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                </div>
              ) : (
                <div>
                  <div className="font-semibold text-white">{formatDate(selectedDate)}</div>
                  <div className="text-xs text-slate-400">{formatWeekday(selectedDate)}</div>
                </div>
              )}
            </div>

            <button
              onClick={viewMode === 'day' ? () => setSelectedDate(addDays(selectedDate, 1)) : goToNextWeek}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-all"
            >
              →
            </button>

            <button
              onClick={() => { setSelectedDate(new Date()); setViewMode('day'); }}
              className="px-3 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all"
            >
              今天
            </button>
          </div>

          {/* 滑动提示 - 仅移动端 */}
          <div className="md:hidden mt-3 text-center text-xs text-slate-500">
            ← 左右滑动切换视图 →
          </div>
        </div>
      </Card>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <StatCard icon="📊" value={viewMode === 'day' ? todayClasses.length : totalWeekClasses} label={viewMode === 'day' ? '今日总课时' : '本周总课时'} color="purple" />
        <StatCard icon="⏰" value={viewMode === 'day' ? scheduledCount : weekScheduled} label="待上课" color="orange" />
        <StatCard icon="✅" value={viewMode === 'day' ? completedCount : weekCompleted} label="已完成" color="green" />
      </div>

      {/* 周视图日历 */}
      {viewMode === 'week' ? (
        <>
          {/* 周视图 - 横向时间轴布局 */}
          <div className="space-y-2">
            {weekDates.map((date, i) => {
              const classes = weekClasses[date.toDateString()] || []
              const completedCount = classes.filter(c => c.status === 'completed').length
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-2xl border cursor-pointer transition-all overflow-hidden ${
                    isSelected(date)
                      ? 'bg-violet-500/15 border-violet-500/50 ring-1 ring-violet-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-stretch">
                    {/* 左侧日期块 */}
                    <div className={`w-20 flex-shrink-0 flex flex-col items-center justify-center py-3 border-r ${
                      isSelected(date) ? 'border-violet-500/30' : 'border-white/10'
                    } ${isToday(date) ? 'bg-violet-500/20' : ''}`}>
                      <div className={`text-xs font-medium ${isToday(date) ? 'text-violet-300' : 'text-slate-500'}`}>
                        {['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]}
                      </div>
                      <div className={`text-2xl font-bold ${isToday(date) ? 'text-violet-300' : 'text-white'}`}>
                        {date.getDate()}
                      </div>
                      {isToday(date) && (
                        <div className="text-[10px] text-violet-300 font-medium">今天</div>
                      )}
                    </div>

                    {/* 右侧课程列表 */}
                    <div className="flex-1 p-3 min-w-0">
                      {classes.length === 0 ? (
                        <div className="h-full flex items-center text-slate-500 text-sm">
                          无课程安排
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {classes.map(cls => (
                            <div
                              key={cls.id}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 ${
                                cls.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' :
                                cls.status === 'cancelled' ? 'bg-slate-500/10 text-slate-500 line-through' :
                                'bg-violet-500/20 text-violet-200 border border-violet-500/20'
                              }`}
                            >
                              <span className="opacity-70">{formatTime(cls.startTime)}</span>
                              <span className="font-semibold">{cls.memberName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 右侧统计 */}
                    {classes.length > 0 && (
                      <div className="flex-shrink-0 flex items-center gap-3 px-3 border-l border-white/5">
                        <div className="text-center">
                          <div className="text-lg font-bold text-white">{classes.length}</div>
                          <div className="text-[10px] text-slate-500">课时</div>
                        </div>
                        {completedCount > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-emerald-400">{completedCount}</div>
                            <div className="text-[10px] text-slate-500">完成</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 周视图 - 选中日期的课程详情 */}
          <Card header={`${formatDate(selectedDate)} · ${formatWeekday(selectedDate)}`} className="mt-4">
            {(() => {
              const classes = weekClasses[selectedDate.toDateString()] || []
              if (classes.length === 0) {
                return <EmptyState icon="📅" title="当天没有课程安排" />
              }
              return (
                <div className="divide-y divide-white/10">
                  {classes.map(cls => (
                    <div key={cls.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          cls.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          cls.status === 'cancelled' ? 'bg-white/10 text-slate-400' :
                          'bg-violet-500/20 text-violet-400'
                        }`}>
                          {cls.status === 'completed' ? '✓' : '⏰'}
                        </div>
                        <div>
                          <div className="font-medium text-white">{cls.memberName}</div>
                          <div className="text-sm text-slate-400">
                            {formatTime(cls.startTime)} · {cls.duration}分钟
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag variant={getTagVariant(cls.status)}>
                          {cls.status === 'completed' ? '已完成' : cls.status === 'cancelled' ? '已取消' : '待上课'}
                        </Tag>
                        {cls.status === 'scheduled' && (
                          <>
                            <Button size="sm" onClick={() => handleCompleteClass(cls.id!)} loading={completingId === cls.id!}>完成</Button>
                            <Button size="sm" variant="secondary" onClick={() => setConfirmCancelId(cls.id!)}>取消</Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </Card>
        </>
      ) : (
        /* 日视图课程列表 */
        <Card header={`${formatDate(selectedDate)} · ${formatWeekday(selectedDate)}`}>
          {todayClasses.length === 0 ? (
            <EmptyState icon="📅" title="今天没有课程安排" />
          ) : (
            <div className="divide-y divide-white/10">
              {todayClasses.map((cls, index) => (
                <div key={cls.id} className="p-4 flex items-center justify-between group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    {/* 左侧时间线指示器 */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold ${
                        cls.status === 'completed' ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-500/30' :
                        cls.status === 'cancelled' ? 'bg-white/10 text-slate-500' :
                        'bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-violet-300 border border-violet-500/30'
                      }`}>
                        {cls.status === 'completed' ? '✓' : cls.memberName[0]}
                      </div>
                      {/* 连接点的竖线 */}
                      {index < todayClasses.length - 1 && (
                        <div className="absolute left-1/2 top-12 w-px h-4 -translate-x-1/2 bg-white/10" />
                      )}
                    </div>

                    {/* 课程信息 */}
                    <div className="flex-1">
                      <div className="font-semibold text-white text-base">{cls.memberName}</div>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <span>🕐</span>
                          {formatTime(cls.startTime)}
                        </span>
                        <span>·</span>
                        <span>{cls.duration}分钟</span>
                      </div>
                    </div>
                  </div>

                  {/* 右侧操作区 */}
                  <div className="flex items-center gap-2">
                    <Tag variant={getTagVariant(cls.status)}>
                      {cls.status === 'completed' ? '已完成' : cls.status === 'cancelled' ? '已取消' : '待上课'}
                    </Tag>
                    {cls.status === 'scheduled' && (
                      <>
                        <Button size="sm" onClick={() => handleCompleteClass(cls.id!)} loading={completingId === cls.id!}>完成</Button>
                        <Button size="sm" variant="secondary" onClick={() => setConfirmCancelId(cls.id!)}>取消</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 新建课程弹窗 */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="新建课程">
        <form onSubmit={handleSubmitClass} className="space-y-5">
          <FormItem label="选择会员">
            <Select
              value={formData.memberId}
              onChange={e => setFormData({ ...formData, memberId: parseInt(e.target.value) })}
              options={[
                { value: 0, label: '请选择会员' },
                ...members.map(m => ({ value: m.id!, label: `${m.name} (剩余: ${m.remainingClasses}节)` }))
              ]}
              required
            />
          </FormItem>
          <FormItem label="开始时间">
            <Input
              type="datetime-local"
              value={formData.startTime}
              onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
          </FormItem>
          <FormItem label="课程时长">
            <Select
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              options={[
                { value: 30, label: '🔥 30 分钟 - 快速训练' },
                { value: 45, label: '⚡ 45 分钟 - 标准课程' },
                { value: 60, label: '💪 60 分钟 - 完整训练' },
                { value: 90, label: '🏋️ 90 分钟 - 深度训练' }
              ]}
            />
          </FormItem>
          <div className="pt-4">
            <Button type="submit" fullWidth disabled={members.length === 0} size="lg">
              <span className="flex items-center justify-center gap-2">
                <span>✅</span>
                <span>创建课程</span>
              </span>
            </Button>
          </div>
          {members.length === 0 && (
            <div className="text-center text-sm text-amber-400 bg-amber-500/10 rounded-xl py-3 px-4">
              ⚠️ 暂无会员，请先在会员管理中添加会员
            </div>
          )}
        </form>
      </Modal>

      {/* 取消课程确认弹窗 */}
      <ConfirmDialog
        isOpen={confirmCancelId !== null}
        onClose={() => setConfirmCancelId(null)}
        onConfirm={handleCancelClass}
        title="取消课程"
        message="确定要取消这节课吗？"
        confirmText="取消课程"
        variant="danger"
      />
    </div>
  )
}
