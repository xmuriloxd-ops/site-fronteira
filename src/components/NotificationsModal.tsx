import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, Trash2, ArrowUp, ArrowDown, Settings2, ShieldCheck, CheckCheck } from 'lucide-react';
import { AdminNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AdminNotification[]>>;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  showToast
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('Todas as notificações foram marcadas como lidas.', 'success');
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    showToast('Notificação marcada como lida.', 'info');
  };

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    setNotifications([]);
    showToast('Histórico de notificações limpo.', 'info');
  };

  const handleRemoveSingle = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notificação removida.', 'info');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-slate-50 w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden z-10"
          >
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative p-2 bg-slate-100 rounded-xl text-[#002075]">
                  <Bell className="w-5 h-5 animate-swing" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base leading-tight">Central de Notificações</h3>
                  <p className="text-xs text-slate-400 font-medium">Movimentações de ração (Entrada & Saída)</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Panel */}
            {notifications.length > 0 && (
              <div className="bg-slate-100/50 border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-500">
                  {unreadCount === 0 
                    ? 'Nenhuma notificação não lida' 
                    : `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}`}
                </span>
                <div className="flex gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-black uppercase tracking-wider text-[#002075] hover:text-[#001755] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Lidas
                    </button>
                  )}
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-black uppercase tracking-wider text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Tudo
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Notification List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 max-h-[50vh] sm:max-h-[55vh]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4 border border-slate-200/50">
                    <Bell className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-700 text-sm">Sem notificações</h4>
                  <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                    Nenhum operador realizou movimentações de abastecimento ou consumo recentemente.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isConsumption = notif.type === 'consumption';
                  const isRefill = notif.type === 'refill';
                  const isAdjustment = notif.type === 'adjustment';

                  return (
                    <div
                      key={notif.id}
                      className={`relative bg-white p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                        notif.read 
                          ? 'border-slate-100 opacity-75' 
                          : 'border-blue-200 bg-blue-50/10 shadow-xs'
                      }`}
                    >
                      {/* Unread dot indicator */}
                      {!notif.read && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#002075] animate-pulse" />
                      )}

                      {/* Icon */}
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isConsumption 
                          ? 'bg-red-50 text-red-600' 
                          : isRefill 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {isConsumption ? (
                          <ArrowDown className="w-4 h-4" />
                        ) : isRefill ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <Settings2 className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                          <span className="font-extrabold text-slate-800 text-sm">
                            {isConsumption ? 'Consumo de Ração' : isRefill ? 'Abastecimento' : 'Ajuste Técnico'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>

                        {/* Description */}
                        <div className="text-xs text-slate-600 mt-1 leading-relaxed">
                          O operador <strong className="text-slate-800">{notif.operatorName}</strong> (Matrícula: {notif.operatorId}) registrou{' '}
                          <span className={`font-bold ${isConsumption ? 'text-red-600' : isRefill ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {isConsumption ? '-' : isRefill ? '+' : ''}
                            {notif.quantity.toLocaleString('pt-BR')} kg
                          </span>{' '}
                          no <strong className="text-slate-800">{notif.siloName}</strong> ({notif.feedType}).
                        </div>

                        {/* Meta Tags */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-mono text-[9px] uppercase tracking-wider">
                            Setor: {notif.sector}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-mono text-[9px] uppercase tracking-wider">
                            Lote: {notif.batch}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0 self-center">
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Marcar como lida"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveSingle(notif.id)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 select-none pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>MÓDULO DE SEGURANÇA ADMIN</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
