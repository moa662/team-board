import Dexie, { type Table } from 'dexie'

export interface Member {
  id?: number
  name: string
  phone?: string
  notes?: string
  totalClasses: number
  remainingClasses: number
  pricePerClass: number
  createdAt: Date
}

export interface MemberWithRevenue extends Member {
  totalRevenue: number
}

export interface Class {
  id?: number
  memberId: number
  memberName: string
  startTime: Date
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled'
  createdAt: Date
}

export interface Transaction {
  id?: number
  type: 'income' | 'expense'
  category: string
  amount: number
  description: string
  classId?: number
  memberId?: number
  memberName?: string
  date: Date
  createdAt: Date
}

export class AppDatabase extends Dexie {
  members!: Table<Member, number>
  classes!: Table<Class, number>
  transactions!: Table<Transaction, number>

  constructor() {
    super('FitnessCoachDB')
    this.version(1).stores({
      members: '++id, name, createdAt',
      classes: '++id, memberId, startTime, status',
      transactions: '++id, type, date, memberId, classId'
    })
  }

  async completeClass(classId: number): Promise<void> {
    const cls = await this.classes.get(classId)
    if (!cls || cls.status === 'completed') return

    const member = await this.members.get(cls.memberId)
    if (!member) return

    await this.transaction('rw', this.classes, this.members, this.transactions, async () => {
      await this.classes.update(classId, { status: 'completed' })
      await this.members.update(cls.memberId, {
        remainingClasses: member.remainingClasses - 1
      })
      await this.transactions.add({
        type: 'income',
        category: '课程收入',
        amount: member.pricePerClass,
        description: `${member.name} - 课程完成`,
        classId: cls.id,
        memberId: member.id,
        memberName: member.name,
        date: new Date(),
        createdAt: new Date()
      })
    })
  }

  async getMemberTotalRevenue(memberId: number): Promise<number> {
    const transactions = await this.transactions
      .where('memberId')
      .equals(memberId)
      .and(t => t.type === 'income')
      .toArray()
    return transactions.reduce((sum, t) => sum + t.amount, 0)
  }

  async getMonthlySummary(year: number, month: number): Promise<{
    income: number
    expense: number
    balance: number
  }> {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)

    const transactions = await this.transactions
      .where('date')
      .between(start, end)
      .toArray()

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

    return {
      income,
      expense,
      balance: income - expense
    }
  }
}

export const db = new AppDatabase()
