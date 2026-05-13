import { useState, useEffect } from 'react'
import { db, type Class, type Member } from '../db'
import { startOfDay, endOfDay } from '../utils/date'

export const useClasses = (selectedDate: Date) => {
  const [todayClasses, setTodayClasses] = useState<Class[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const start = startOfDay(selectedDate)
    const end = endOfDay(selectedDate)

    const classes = await db.classes.where('startTime').between(start, end).toArray()
    classes.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    setTodayClasses(classes)

    const allMembers = await db.members.toArray()
    setMembers(allMembers)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const addClass = async (memberId: number, startTime: Date, duration: number) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return

    await db.classes.add({
      memberId,
      memberName: member.name,
      startTime,
      duration,
      status: 'scheduled',
      createdAt: new Date()
    })
    await loadData()
  }

  const completeClass = async (classId: number) => {
    await db.completeClass(classId)
    await loadData()
  }

  const cancelClass = async (classId: number) => {
    await db.classes.update(classId, { status: 'cancelled' })
    await loadData()
  }

  return {
    todayClasses,
    members,
    loading,
    reload: loadData,
    addClass,
    completeClass,
    cancelClass
  }
}
