import { useState, useEffect } from 'react'
import { db, type Member, type MemberWithRevenue } from '../db'

export const useMembers = () => {
  const [members, setMembers] = useState<MemberWithRevenue[]>([])
  const [loading, setLoading] = useState(true)

  const loadMembers = async () => {
    setLoading(true)
    const allMembers = await db.members.orderBy('createdAt').reverse().toArray()
    const membersWithRevenue = await Promise.all(
      allMembers.map(async member => ({
        ...member,
        totalRevenue: await db.getMemberTotalRevenue(member.id!)
      }))
    )
    setMembers(membersWithRevenue)
    setLoading(false)
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const addMember = async (member: Omit<Member, 'id' | 'createdAt'>) => {
    await db.members.add({ ...member, createdAt: new Date() })
    await loadMembers()
  }

  const updateMemberClasses = async (memberId: number, additionalClasses: number) => {
    const member = await db.members.get(memberId)
    if (!member) return
    await db.members.update(memberId, {
      totalClasses: member.totalClasses + additionalClasses,
      remainingClasses: member.remainingClasses + additionalClasses
    })
    await loadMembers()
  }

  const deleteMember = async (memberId: number) => {
    await db.members.delete(memberId)
    await loadMembers()
  }

  return {
    members,
    loading,
    reload: loadMembers,
    addMember,
    updateMemberClasses,
    deleteMember
  }
}
