import { useState, useEffect } from 'react'
import { Dashboard } from './pages/Dashboard'
import { SchedulePage } from './pages/SchedulePage'
import { MembersPage } from './pages/MembersPage'
import { FinancePage } from './pages/FinancePage'
import { ExportPage } from './pages/ExportPage'
import { db } from './db'
import { loadSampleData } from './utils/sampleData'
import { Button, Modal } from './components'

const tabs = [
  { id: 'home', label: '首页', icon: '🏠' },
  { id: 'schedule', label: '排课', icon: '📅' },
  { id: 'members', label: '会员', icon: '👥' },
  { id: 'finance', label: '收入', icon: '💰' },
  { id: 'export', label: '导出', icon: '📊' }
]

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const checkFirstRun = async () => {
      const memberCount = await db.members.count()
      if (memberCount === 0) {
        setShowWelcome(true)
      }
    }
    checkFirstRun()
  }, [])

  const handleLoadSampleData = async () => {
    await loadSampleData()
    setShowWelcome(false)
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <Dashboard onNavigate={setActiveTab} />
      case 'schedule': return <SchedulePage />
      case 'members': return <MembersPage />
      case 'finance': return <FinancePage />
      case 'export': return <ExportPage onLoadSample={handleLoadSampleData} />
      default: return <Dashboard onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="app-bg min-h-screen text-white pb-28 md:pb-0 md:pl-20">
      {/* 桌面端侧边导航 */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-20 bg-slate-900/85 backdrop-blur-3xl border-r border-white/10">
        <div className="flex flex-col items-center py-6 h-full">
          <div className="text-3xl mb-8">💪</div>
          <div className="flex flex-col gap-3 flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 w-14 h-14 rounded-2xl transition-all ${
                  activeTab === tab.id
                    ? 'text-violet-400 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <span className="text-2xl">{tab.icon}</span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 顶部标题区 */}
      <div className="relative z-10 px-5 pt-6 pb-5 md:px-8 md:pt-8 md:max-w-6xl md:mx-auto">
        <h1 className="text-2xl font-extrabold md:text-3xl bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent inline-block">💪 教练助手</h1>
        <p className="text-slate-400 text-sm mt-1 md:text-base">专业的私教业务管理工具</p>
      </div>

      {/* 内容区 */}
      <div className="relative z-10 px-5 md:px-8 md:max-w-6xl md:mx-auto">
        {renderPage()}
      </div>

      {/* 移动端底部导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/85 backdrop-blur-3xl border-t border-white/10">
        <div className="flex justify-around py-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'text-violet-400 bg-violet-500/10'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="h-8"></div>
      </div>

      {/* 欢迎弹窗 */}
      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title="欢迎使用教练助手"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowWelcome(false)}>
              空白开始
            </Button>
            <Button onClick={handleLoadSampleData}>
              加载示例数据体验
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="text-5xl mb-4">💪</div>
          <p className="text-slate-400">专业的健身私教管理工具</p>
        </div>
      </Modal>
    </div>
  )
}

export default App
