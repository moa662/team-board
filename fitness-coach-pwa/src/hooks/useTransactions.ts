import { useState, useEffect } from 'react'
import { db, type Transaction } from '../db'

export const useTransactions = (selectedMonth: Date) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)

    const allTransactions = await db.transactions
      .where('date')
      .between(start, end)
      .reverse()
      .sortBy('date')
    setTransactions(allTransactions)

    const summaryData = await db.getMonthlySummary(year, month)
    setSummary(summaryData)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  const addTransaction = async (
    type: 'income' | 'expense',
    amount: number,
    category: string,
    description: string,
    date: Date
  ) => {
    await db.transactions.add({
      type,
      amount,
      category,
      description,
      date,
      createdAt: new Date()
    })
    await loadData()
  }

  const deleteTransaction = async (id: number) => {
    await db.transactions.delete(id)
    await loadData()
  }

  return {
    transactions,
    summary,
    loading,
    reload: loadData,
    addTransaction,
    deleteTransaction
  }
}
