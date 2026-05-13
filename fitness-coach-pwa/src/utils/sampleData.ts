import { db } from '../db'

export const loadSampleData = async () => {
  // 清空现有数据
  await db.members.clear()
  await db.classes.clear()
  await db.transactions.clear()

  // 添加示例会员
  const members = [
    { name: '张小明', phone: '138****1234', totalClasses: 36, remainingClasses: 28, pricePerClass: 300, notes: '每周二、四晚上课', createdAt: new Date(2024, 0, 15) },
    { name: '李芳芳', phone: '139****5678', totalClasses: 48, remainingClasses: 35, pricePerClass: 350, notes: '私教VIP会员', createdAt: new Date(2024, 1, 20) },
    { name: '王大伟', phone: '137****9012', totalClasses: 24, remainingClasses: 12, pricePerClass: 280, notes: '增肌训练', createdAt: new Date(2024, 2, 10) },
    { name: '陈美玲', phone: '136****3456', totalClasses: 60, remainingClasses: 45, pricePerClass: 400, notes: '减脂塑形', createdAt: new Date(2024, 3, 5) },
    { name: '赵强', phone: '', totalClasses: 20, remainingClasses: 8, pricePerClass: 250, notes: '', createdAt: new Date(2024, 4, 1) }
  ]

  const memberIds = await Promise.all(
    members.map(m => db.members.add({ ...m, createdAt: new Date(m.createdAt) }))
  )

  // 示例课程
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const classes = [
    { memberId: memberIds[0], memberName: '张小明', startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0), duration: 60, status: 'scheduled' },
    { memberId: memberIds[1], memberName: '李芳芳', startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0), duration: 60, status: 'scheduled' },
    { memberId: memberIds[2], memberName: '王大伟', startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0), duration: 90, status: 'scheduled' },
    { memberId: memberIds[3], memberName: '陈美玲', startTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 0), duration: 60, status: 'completed' },
    { memberId: memberIds[4], memberName: '赵强', startTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 0), duration: 60, status: 'completed' },
    { memberId: memberIds[0], memberName: '张小明', startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0), duration: 60, status: 'scheduled' }
  ]

  await Promise.all(
    classes.map(c => db.classes.add({ ...c, status: c.status as 'scheduled' | 'completed' | 'cancelled', createdAt: new Date() }))
  )

  // 示例收支记录
  const transactions = [
    { type: 'income', category: '课程收入', amount: 300, description: '张小明 - 课程完成', memberId: memberIds[3], memberName: '陈美玲', date: yesterday },
    { type: 'income', category: '课程收入', amount: 250, description: '赵强 - 课程完成', memberId: memberIds[4], memberName: '赵强', date: yesterday },
    { type: 'expense', category: '场地', amount: 5000, description: '本月场地租金', date: new Date(today.getFullYear(), today.getMonth(), 1) },
    { type: 'expense', category: '器材', amount: 1200, description: '新购哑铃套装', date: new Date(today.getFullYear(), today.getMonth(), 5) },
    { type: 'income', category: '其他收入', amount: 800, description: '营养补剂销售', date: new Date(today.getFullYear(), today.getMonth(), 8) },
    { type: 'expense', category: '餐饮', amount: 150, description: '教练聚餐', date: new Date(today.getFullYear(), today.getMonth(), 10) }
  ]

  await Promise.all(
    transactions.map(t => db.transactions.add({ ...t, type: t.type as 'income' | 'expense', createdAt: new Date() }))
  )

  return true
}
