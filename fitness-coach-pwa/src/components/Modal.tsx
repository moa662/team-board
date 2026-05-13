import React from 'react'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  confirmText,
  cancelText = '取消',
  onConfirm
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-violet-500/20 max-h-[90vh] overflow-hidden flex flex-col transform transition-all">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-lg">
              ➕
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white/10 text-slate-400 hover:text-white transition-all hover:rotate-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {(footer || confirmText) && (
          <div className="px-6 py-5 border-t border-white/10 flex gap-3 justify-end bg-white/5">
            {footer ?? (
              <>
                <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
                {confirmText && <Button onClick={onConfirm}>{confirmText}</Button>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
