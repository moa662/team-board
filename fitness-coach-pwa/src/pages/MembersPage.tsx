import React, { useState, useEffect } from 'react'
import { db, type MemberWithRevenue } from '../db'
import { Modal, Button, StatCard, EmptyState, PageHeader, Card } from '../components'

export const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<MemberWithRevenue[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithRevenue | null>(null)
  const [formData, setFormData] = useState({
    name: '', phone: '', notes: '', totalClasses: 10, remainingClasses: 10, pricePerClass: 300
  })

  const loadMembers = async () => {
    const allMembers = await db.members.orderBy('createdAt').reverse().toArray()
    const membersWithRevenue = await Promise.all(
      allMembers.map(async member => ({
        ...member,
        totalRevenue: await db.getMemberTotalRevenue(member.id!)
      }))
    )
    setMembers(membersWithRevenue)
  }

  useEffect(() => { loadMembers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    await db.members.add({ ...formData, createdAt: new Date() })
    setIsAddModalOpen(false)
    setFormData({ name: '', phone: '', notes: '', totalClasses: 10, remainingClasses: 10, pricePerClass: 300 })
    loadMembers()
  }

  const handleUpdateClasses = async (memberId: number, additionalClasses: number) => {
    const member = await db.members.get(memberId)
    if (!member) return
    await db.members.update(memberId, {
      totalClasses: member.totalClasses + additionalClasses,
      remainingClasses: member.remainingClasses + additionalClasses
    })
    loadMembers()
  }

  const handleDelete = async (memberId: number) => {
    if (!confirm('确定要删除这个会员吗？')) return
    await db.members.delete(memberId)
    setSelectedMember(null)
    loadMembers()
  }

  return (
    <div>
      <PageHeader
        title="会员管理"
        subtitle={`共 ${members.length} 位会员`}
        action={<Button onClick={() => setIsAddModalOpen(true)}>+ 添加会员</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard value={members.length} label="会员总数" />
        <StatCard
          value={`¥${members.reduce((sum, m) => sum + m.totalRevenue, 0).toLocaleString()}`}
          label="累计收入"
          color="green"
        />
        <StatCard
          value={members.reduce((sum, m) => sum + m.remainingClasses, 0)}
          label="剩余课时"
          color="orange"
        />
        <StatCard
          value={`¥${members.length ? Math.round(members.reduce((sum, m) => sum + m.totalRevenue, 0) / members.length) : 0}`}
          label="平均客单价"
          color="blue"
        />
      </div>

      {members.length === 0 ? (
        <Card>
          <EmptyState icon="👥" title="暂无会员" description="点击右上角添加第一个会员" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((member, idx) => {
            const usageRate = member.totalClasses > 0
              ? ((member.totalClasses - member.remainingClasses) / member.totalClasses) * 100
              : 0
            const isLowOnClasses = member.remainingClasses <= 3
            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="glass-card lift-card rounded-2xl p-4 cursor-pointer hover:border-violet-500/30 group slide-up"
                style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}
              >
                {/* 顶部：头像 + 名字 + 进度环 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30 flex-shrink-0">
                    {member.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-white truncate">{member.name}</div>
                      {member.remainingClasses === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-medium flex-shrink-0">
                          已用完
                        </span>
                      )}
                      {isLowOnClasses && member.remainingClasses > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-medium flex-shrink-0">
                          课时少
                        </span>
                      )}
                    </div>
                    {/* 内嵌进度条 */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isLowOnClasses ? 'bg-gradient-to-r from-orange-500 to-red-500 progress-shine' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                          }`}
                          style={{ width: `${usageRate}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium tabular-nums">{Math.round(usageRate)}%</span>
                    </div>
                  </div>
                </div>

                {/* 底部数据条 */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">{member.remainingClasses}</span>
                    <span className="text-slate-500 text-xs">剩余</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-orange-400 font-bold">¥{member.pricePerClass}</span>
                    <span className="text-slate-500 text-xs">/节</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-cyan-400 font-bold">¥{member.totalRevenue}</span>
                    <span className="text-slate-500 text-xs">累计</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="添加会员">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">姓名</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="输入会员姓名" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">手机号（选填）</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="输入手机号" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">总课时</label>
              <input type="number" value={formData.totalClasses} onChange={e => {
                const val = parseInt(e.target.value) || 0
                setFormData({ ...formData, totalClasses: val, remainingClasses: val })
              }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">单价（元/节）</label>
              <input type="number" value={formData.pricePerClass} onChange={e => setFormData({ ...formData, pricePerClass: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" min="0" />
            </div>
          </div>
          <div className="pt-2">
            <Button type="submit" fullWidth>添加会员</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} title="会员详情">
        {selectedMember && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-white/10">
              <div className="w-14 h-14 mx-auto mb-3 bg-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-bold text-xl">
                {selectedMember.name[0]}
              </div>
              <h3 className="text-lg font-bold text-white">{selectedMember.name}</h3>
              <p className="text-slate-400 text-sm">{selectedMember.phone || '未填写手机号'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard value={selectedMember.remainingClasses} label="剩余课时" color="green" />
              <StatCard value={`¥${selectedMember.totalRevenue}`} label="累计收入" color="blue" />
            </div>
            <div className="space-y-3">
              <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                <span className="text-slate-400">总课时</span>
                <span className="font-semibold text-white">{selectedMember.totalClasses} 节</span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                <span className="text-slate-400">已上课时</span>
                <span className="font-semibold text-white">{selectedMember.totalClasses - selectedMember.remainingClasses} 节</span>
              </div>
              <div className="bg-white/5 p-4 rounded-xl flex justify-between items-center">
                <span className="text-slate-400">单价</span>
                <span className="font-semibold text-white">¥{selectedMember.pricePerClass}/节</span>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => {
                  const additional = prompt('请输入要增加的课时数：', '10')
                  if (additional && !isNaN(parseInt(additional))) {
                    handleUpdateClasses(selectedMember.id!, parseInt(additional))
                  }
                }}
                fullWidth
              >
                续费加课
              </Button>
              <Button variant="danger" onClick={() => handleDelete(selectedMember.id!)} fullWidth>
                删除会员
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
