import React, { useState, useEffect } from 'react'
import { db } from '../db'
import { EmptyState, PageHeader, Card } from '../components'

interface IncomeStats {
  actualIncome: number      // 已完成课程的实收金额
  pendingDebt: number       // 待上课的负债（潜在收入）
  classCount: number        // 已完成课时数
  pendingCount: number      // 待上课时数
}

export const FinancePage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [incomeRecords, setIncomeRecords] = useState<any[]>([])
  const [stats, setStats] = useState<IncomeStats>({
    actualIncome: 0, pendingDebt: 0, classCount: 0, pendingCount: 0
  })

  const loadData = async () => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)

    // 已完成课程产生的实际收入
    const incomeTransactions = await db.transactions
      .where('date').between(start, end)
      .and(t => t.type === 'income')
      .reverse().sortBy('date')
    setIncomeRecords(incomeTransactions)

    const actualIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)

    // 当月待上课程的负债（按当前会员单价计算）
    const pendingClasses = await db.classes
      .where('startTime').between(start, end)
      .and(c => c.status === 'scheduled')
      .toArray()

    let pendingDebt = 0
    for (const cls of pendingClasses) {
      const member = await db.members.get(cls.memberId)
      if (member) pendingDebt += member.pricePerClass
    }

    setStats({
      actualIncome,
      pendingDebt,
      classCount: incomeTransactions.length,
      pendingCount: pendingClasses.length
    })
  }

  useEffect(() => { loadData() }, [selectedMonth])

  const monthLabel = selectedMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })

  return (
    <div>
      <PageHeader title="收入统计" subtitle="基于实际上课产生的收入" />

      {/* 月份导航 */}
      <Card className="mb-4">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() - 1); setSelectedMonth(d); }}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-all"
          >
            ←
          </button>
          <div className="font-semibold text-white text-lg">{monthLabel}</div>
          <button
            onClick={() => { const d = new Date(selectedMonth); d.setMonth(d.getMonth() + 1); setSelectedMonth(d); }}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-all"
          >
            →
          </button>
        </div>
      </Card>

      {/* 核心数据卡片 - 实收 vs 负债 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {/* 实际收入 */}
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-base shadow-lg shadow-emerald-500/30">
              ✅
            </div>
            <div className="text-sm font-medium text-emerald-300">已上课实收</div>
          </div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            ¥{stats.actualIncome.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            完成 {stats.classCount} 节课程
          </div>
        </div>

        {/* 负债（潜在收入） */}
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-base shadow-lg shadow-orange-500/30">
              ⏳
            </div>
            <div className="text-sm font-medium text-orange-300">待上课负债</div>
          </div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            ¥{stats.pendingDebt.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            待上 {stats.pendingCount} 节课程
          </div>
        </div>
      </div>

      {/* 收入明细列表 */}
      <Card header={`${monthLabel}收入明细`}>
        {incomeRecords.length === 0 ? (
          <EmptyState
            icon="📊"
            title="本月暂无收入"
            description="完成课程后会自动产生收入记录"
          />
        ) : (
          <div className="divide-y divide-white/10">
            {incomeRecords.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-emerald-500/30 flex-shrink-0">
                    💵
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {t.memberName || t.category}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(t.date).toLocaleString('zh-CN', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <span className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex-shrink-0">
                  +¥{t.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
