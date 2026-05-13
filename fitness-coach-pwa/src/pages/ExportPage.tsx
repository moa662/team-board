import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { db } from '../db'
import { Button, PageHeader } from '../components'

interface ExportPageProps {
  onLoadSample?: () => Promise<void>
}

export const ExportPage: React.FC<ExportPageProps> = ({ onLoadSample }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isLoadingSample, setIsLoadingSample] = useState(false)

  const downloadExcel = (data: any[], fileName: string, sheetName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    XLSX.writeFile(workbook, fileName)
  }

  const exportMembers = async () => {
    setIsExporting(true)
    try {
      const members = await db.members.toArray()
      const data = await Promise.all(
        members.map(async m => ({
          姓名: m.name,
          手机号: m.phone || '',
          总课时: m.totalClasses,
          剩余课时: m.remainingClasses,
          客单价: m.pricePerClass,
          累计收入: await db.getMemberTotalRevenue(m.id!),
          备注: m.notes || '',
          创建时间: new Date(m.createdAt).toLocaleDateString('zh-CN')
        }))
      )
      downloadExcel(data, `会员列表_${new Date().toLocaleDateString('zh-CN')}.xlsx`, '会员')
    } finally {
      setIsExporting(false)
    }
  }

  const exportClasses = async () => {
    setIsExporting(true)
    try {
      const classes = await db.classes.orderBy('startTime').reverse().toArray()
      const data = classes.map(c => ({
        会员姓名: c.memberName,
        课程时间: new Date(c.startTime).toLocaleString('zh-CN'),
        时长: c.duration + '分钟',
        状态: c.status === 'scheduled' ? '待上课' : c.status === 'completed' ? '已完成' : '已取消',
        创建时间: new Date(c.createdAt).toLocaleDateString('zh-CN')
      }))
      downloadExcel(data, `排课记录_${new Date().toLocaleDateString('zh-CN')}.xlsx`, '排课')
    } finally {
      setIsExporting(false)
    }
  }

  const exportTransactions = async () => {
    setIsExporting(true)
    try {
      const transactions = await db.transactions.orderBy('date').reverse().toArray()
      const data = transactions.map(t => ({
        类型: t.type === 'income' ? '收入' : '支出',
        分类: t.category,
        金额: t.amount,
        描述: t.description || '',
        关联会员: t.memberName || '',
        日期: new Date(t.date).toLocaleDateString('zh-CN'),
        创建时间: new Date(t.createdAt).toLocaleDateString('zh-CN')
      }))
      downloadExcel(data, `收支流水_${new Date().toLocaleDateString('zh-CN')}.xlsx`, '收支')
    } finally {
      setIsExporting(false)
    }
  }

  const exportAll = async () => {
    setIsExporting(true)
    try {
      const [members, classes, transactions] = await Promise.all([
        db.members.toArray(),
        db.classes.orderBy('startTime').toArray(),
        db.transactions.orderBy('date').toArray()
      ])

      const membersData = await Promise.all(
        members.map(async m => ({
          姓名: m.name,
          手机号: m.phone || '',
          总课时: m.totalClasses,
          剩余课时: m.remainingClasses,
          客单价: m.pricePerClass,
          累计收入: await db.getMemberTotalRevenue(m.id!),
          备注: m.notes || '',
          创建时间: new Date(m.createdAt).toLocaleDateString('zh-CN')
        }))
      )

      const classesData = classes.map(c => ({
        会员姓名: c.memberName,
        课程时间: new Date(c.startTime).toLocaleString('zh-CN'),
        时长: c.duration + '分钟',
        状态: c.status === 'scheduled' ? '待上课' : c.status === 'completed' ? '已完成' : '已取消',
        创建时间: new Date(c.createdAt).toLocaleDateString('zh-CN')
      }))

      const transactionsData = transactions.map(t => ({
        类型: t.type === 'income' ? '收入' : '支出',
        分类: t.category,
        金额: t.amount,
        描述: t.description || '',
        关联会员: t.memberName || '',
        日期: new Date(t.date).toLocaleDateString('zh-CN'),
        创建时间: new Date(t.createdAt).toLocaleDateString('zh-CN')
      }))

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(membersData), '会员')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(classesData), '排课')
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(transactionsData), '收支')
      XLSX.writeFile(workbook, `健身教练数据_完整备份_${new Date().toLocaleDateString('zh-CN')}.xlsx`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleLoadSample = async () => {
    if (!onLoadSample) return
    if (!confirm('确定要加载示例数据吗？这会清空现有数据。')) return
    setIsLoadingSample(true)
    try {
      await onLoadSample()
    } finally {
      setIsLoadingSample(false)
    }
  }

  const exportItems = [
    {
      icon: '👥',
      title: '会员列表',
      desc: '会员信息、课时、收入',
      action: exportMembers,
      iconBg: 'from-violet-500 to-fuchsia-500'
    },
    {
      icon: '📅',
      title: '排课记录',
      desc: '所有课程历史记录',
      action: exportClasses,
      iconBg: 'from-cyan-500 to-blue-500'
    },
    {
      icon: '💰',
      title: '收入明细',
      desc: '已上课实收记录',
      action: exportTransactions,
      iconBg: 'from-emerald-500 to-teal-500'
    }
  ]

  return (
    <div>
      <PageHeader title="数据导出" subtitle="导出 Excel 备份到本地" />

      {/* 提示条 - 精简 */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <span className="text-base">💡</span>
        <p className="text-amber-200/80 text-xs">
          数据存储在本地浏览器，建议定期导出备份
        </p>
      </div>

      {/* 分类导出 - 紧凑列表 */}
      <div className="space-y-2 mb-4">
        {exportItems.map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            disabled={isExporting}
            className="w-full glass-card rounded-2xl p-3 flex items-center gap-3 text-left hover:bg-white/10 hover:border-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center text-lg shadow-md flex-shrink-0`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm">{item.title}</div>
              <div className="text-xs text-slate-400">{item.desc}</div>
            </div>
            <svg className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* 完整备份 - 突出主操作 */}
      <Button onClick={exportAll} disabled={isExporting} fullWidth size="lg">
        {isExporting ? '导出中...' : '📦 一键完整备份'}
      </Button>

      {/* 示例数据 - 弱化 */}
      {onLoadSample && (
        <button
          onClick={handleLoadSample}
          disabled={isLoadingSample}
          className="w-full mt-3 py-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
        >
          {isLoadingSample ? '加载中...' : '加载示例数据'}
        </button>
      )}
    </div>
  )
}
