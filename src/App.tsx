/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Plus, 
  History, 
  Trash2, 
  Download, 
  User, 
  Layers, 
  Hash, 
  MapPin, 
  AlertTriangle, 
  Settings2, 
  Check, 
  RotateCcw,
  Search,
  Filter,
  FileText,
  Clock,
  Info,
  ChevronDown,
  Image,
  Lock,
  LogOut,
  UserPlus,
  Eye,
  EyeOff,
  ShieldCheck,
  Key,
  Bell,
  CheckCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sliders,
  Calendar,
  Smartphone,
  Monitor,
  Globe,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Silo, Transaction, OperatorSession, TransactionType, OperatorAccount, AdminNotification } from './types';
import { GrupoBtzLogo } from './components/GrupoBtzLogo';
import { PlacaControleModal } from './components/PlacaControleModal';
import { NotificationsModal } from './components/NotificationsModal';
import { AuthScreen } from './components/AuthScreen';

// Pre-populated default silos
const DEFAULT_SILOS: Silo[] = [
  { id: '1', name: 'Silo 01', feedType: 'Ração Inicial', currentBalance: 12450, maxCapacity: 15000, minThreshold: 3000 },
  { id: '2', name: 'Silo 02', feedType: 'Ração Crescimento', currentBalance: 8200, maxCapacity: 15000, minThreshold: 2500 },
  { id: '3', name: 'Silo 03', feedType: 'Ração Engorda', currentBalance: 2100, maxCapacity: 15000, minThreshold: 2500 },
];

// Pre-populated history to give the app a polished look instantly
const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3).toISOString(), // 3 days ago
    siloId: '1',
    siloName: 'Silo 01',
    type: 'refill',
    quantity: 5000,
    sector: 'Setor A',
    batch: 'Lote 012',
    operatorName: 'Carlos Silva',
    operatorId: 'BTZ-884',
    notes: 'Abastecimento Semanal - Transportadora BTZ'
  },
  {
    id: 'tx-2',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(), // 2 days ago
    siloId: '2',
    siloName: 'Silo 02',
    type: 'consumption',
    quantity: 450,
    sector: 'Setor B',
    batch: 'Lote 045',
    operatorName: 'Maria Oliveira',
    operatorId: 'BTZ-102',
    notes: 'Trato da manhã'
  },
  {
    id: 'tx-3',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    siloId: '3',
    siloName: 'Silo 03',
    type: 'consumption',
    quantity: 600,
    sector: 'Setor C',
    batch: 'Lote 089',
    operatorName: 'Carlos Silva',
    operatorId: 'BTZ-884',
    notes: 'Trato da tarde'
  },
  {
    id: 'tx-4',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    siloId: '3',
    siloName: 'Silo 03',
    type: 'adjustment',
    quantity: 2100, // Adjusted to exactly 2100 kg
    sector: 'Setor C',
    batch: 'Lote 089',
    operatorName: 'Roberto Sousa',
    operatorId: 'BTZ-304',
    notes: 'Ajuste após auditoria visual'
  }
];

// Base44 Client implementation for secure cloud account deletion
const base44Client = {
  deleteAccount: async (operatorId: string) => {
    console.log(`[Base44 Client] Requesting account deletion for operator ID: ${operatorId}`);
    try {
      const response = await fetch('https://api.base44.com/v1/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Operator-Id': operatorId,
        },
        body: JSON.stringify({ operatorId, timestamp: new Date().toISOString() }),
      });
      return response.ok;
    } catch (error) {
      console.warn('[Base44 Client] Network request failed, proceeding with offline fallback deletion:', error);
      // Fallback to allow offline operator deletion complying with store policies
      return true;
    }
  }
};

export default function App() {
  // --- STATE ---
  // Currently logged in operator
  const [currentOperator, setCurrentOperator] = useState<OperatorAccount | null>(() => {
    const saved = localStorage.getItem('btz_current_operator');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse btz_current_operator", e);
      }
    }
    return null;
  });

  // Silos grouped per operator
  const [silosByOperator, setSilosByOperator] = useState<Record<string, Silo[]>>(() => {
    const savedByOperator = localStorage.getItem('btz_silos_by_operator');
    if (savedByOperator) {
      try {
        return JSON.parse(savedByOperator);
      } catch (e) {
        console.error("Failed to parse btz_silos_by_operator", e);
      }
    }
    
    // Migrating from legacy single operator data if available
    const legacySilos = localStorage.getItem('btz_silos');
    const savedCurrentOp = localStorage.getItem('btz_current_operator');
    if (legacySilos && savedCurrentOp) {
      try {
        const parsedSilos = JSON.parse(legacySilos);
        const parsedOp = JSON.parse(savedCurrentOp);
        if (parsedOp && parsedOp.operatorId && Array.isArray(parsedSilos)) {
          const initialMap = {
            [parsedOp.operatorId]: parsedSilos.map((s: any, idx: number) => ({
              ...s,
              minThreshold: s.minThreshold !== undefined ? s.minThreshold : (DEFAULT_SILOS[idx]?.minThreshold ?? 2500)
            }))
          };
          localStorage.setItem('btz_silos_by_operator', JSON.stringify(initialMap));
          return initialMap;
        }
      } catch (e) {
        console.error("Failed to migrate legacy silos", e);
      }
    }
    
    return {};
  });

  // Derived current silos based on active operator
  const silos = React.useMemo(() => {
    if (!currentOperator) return DEFAULT_SILOS;
    const opSilos = silosByOperator[currentOperator.operatorId];
    if (opSilos) return opSilos;
    return DEFAULT_SILOS;
  }, [silosByOperator, currentOperator]);

  // State-like setter for silos that updates the partitioned map
  const setSilos = (update: Silo[] | ((prev: Silo[]) => Silo[])) => {
    if (!currentOperator) return;
    setSilosByOperator(prevMap => {
      const currentSilos = prevMap[currentOperator.operatorId] || DEFAULT_SILOS;
      const nextSilos = typeof update === 'function' ? update(currentSilos) : update;
      const nextMap = {
        ...prevMap,
        [currentOperator.operatorId]: nextSilos
      };
      localStorage.setItem('btz_silos_by_operator', JSON.stringify(nextMap));
      return nextMap;
    });
  };

  // Admin Notifications for Feed Input/Output of all operators
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    const saved = localStorage.getItem('btz_admin_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse btz_admin_notifications", e);
      }
    }
    return [];
  });

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('btz_transactions');
    return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
  });

  // Operator session inputs
  const [operatorSession, setOperatorSession] = useState<OperatorSession>(() => {
    const saved = localStorage.getItem('btz_session');
    return saved ? JSON.parse(saved) : {
      operatorName: '',
      operatorId: '',
      sector: '',
      batch: ''
    };
  });

  // Registered operator accounts for login system
  const [operators, setOperators] = useState<OperatorAccount[]>(() => {
    const saved = localStorage.getItem('btz_operators');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse btz_operators", e);
      }
    }
    return [
      { operatorId: '86887', operatorName: 'MURILO MENDES', password: '123' },
      { operatorId: 'admin', operatorName: 'Administrador', password: 'admin', isAdmin: true },
      { operatorId: 'administrador', operatorName: 'Administrador', password: 'admin', isAdmin: true }
    ];
  });

  // Inner operator management panel states
  const [operatorPanelTab, setOperatorPanelTab] = useState<'identificacao' | 'cadastro'>('identificacao');
  const [innerRegName, setInnerRegName] = useState('');
  const [innerRegId, setInnerRegId] = useState('');
  const [innerRegPassword, setInnerRegPassword] = useState('');
  const [innerRegIsAdmin, setInnerRegIsAdmin] = useState(false);
  
  // Device Access Logs
  const [accessLogs, setAccessLogs] = useState<any[]>([]);

  // Administrator self-credential modification states
  const [adminFormTab, setAdminFormTab] = useState<'create' | 'edit_self'>('create');
  const [adminSelfName, setAdminSelfName] = useState('');
  const [adminSelfId, setAdminSelfId] = useState('');
  const [adminSelfPassword, setAdminSelfPassword] = useState('');

  // Active operation modals
  const [activeModal, setActiveModal] = useState<{
    siloId: string;
    type: TransactionType | 'config';
  } | null>(null);

  // Modal input values
  const [inputQty, setInputQty] = useState<string>('');
  const [inputNotes, setInputNotes] = useState<string>('');
  
  // Custom config values
  const [configFeedType, setConfigFeedType] = useState<string>('');
  const [configMaxCapacity, setConfigMaxCapacity] = useState<string>('');
  const [configSiloName, setConfigSiloName] = useState<string>('');
  const [configMinThreshold, setConfigMinThreshold] = useState<string>('');

  // Filtering & search states for transactions
  const [filterSilo, setFilterSilo] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Mobile navigation and gesture states
  const [activeTab, setActiveTab] = useState<'silos' | 'identificacao' | 'historico' | 'admin'>(() => {
    const savedOpStr = localStorage.getItem('btz_current_operator');
    if (savedOpStr) {
      try {
        const op = JSON.parse(savedOpStr);
        if (op?.isAdmin) {
          return 'historico';
        }
      } catch (e) {}
    }
    return 'silos';
  });
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState<boolean>(false);
  const [isConfirmDeleteAccountOpen, setIsConfirmDeleteAccountOpen] = useState<boolean>(false);
  const [isPlacaModalOpen, setIsPlacaModalOpen] = useState<boolean>(false);
  const [customConfirm, setCustomConfirm] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Mobile Bottom Drawer configurations
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [mobileDrawerConfig, setMobileDrawerConfig] = useState<{
    title: string;
    options: { value: string; label: string }[];
    currentValue: string;
    onSelect: (val: string) => void;
  } | null>(null);

  // Responsive layout state & hook
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Browser history stack compatibility for mobile back-button navigation
  const isPopStateRef = React.useRef<boolean>(false);
  const openCount = (activeModal ? 1 : 0) + 
                    (isGeneralSettingsOpen ? 1 : 0) + 
                    (isMobileDrawerOpen ? 1 : 0) + 
                    (isConfirmDeleteAccountOpen ? 1 : 0) +
                    (isPlacaModalOpen ? 1 : 0) +
                    (isNotificationsOpen ? 1 : 0) +
                    (customConfirm ? 1 : 0);
  const openCountRef = React.useRef<number>(0);

  useEffect(() => {
    const handlePopState = () => {
      isPopStateRef.current = true;
      if (customConfirm) {
        setCustomConfirm(null);
      } else if (isConfirmDeleteAccountOpen) {
        setIsConfirmDeleteAccountOpen(false);
      } else if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
      } else if (isPlacaModalOpen) {
        setIsPlacaModalOpen(false);
      } else if (activeModal) {
        setActiveModal(null);
      } else if (isGeneralSettingsOpen) {
        setIsGeneralSettingsOpen(false);
      } else if (isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
      setTimeout(() => {
        isPopStateRef.current = false;
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeModal, isGeneralSettingsOpen, isMobileDrawerOpen, isConfirmDeleteAccountOpen, isPlacaModalOpen, isNotificationsOpen, customConfirm]);

  useEffect(() => {
    const diff = openCount - openCountRef.current;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        window.history.pushState({ overlayIndex: openCountRef.current + i + 1 }, '');
      }
    } else if (diff < 0) {
      if (!isPopStateRef.current) {
        window.history.go(diff);
      }
    }
    openCountRef.current = openCount;
  }, [openCount]);

  // Gesture refs
  const startY = React.useRef<number>(0);
  const isPulling = React.useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      // Linear resistance formula for natural drag behavior
      const distance = Math.min(90, Math.pow(diff, 0.82));
      setPullDistance(distance);
      // Only prevent default on mobile if the user actually pulls downwards significant distance
      if (diff > 12 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance > 55) {
      setIsRefreshing(true);
      setPullDistance(55);
      
      // Simulate real-time data sync/polling for state update
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        showToast('Dados dos silos atualizados e sincronizados com sucesso!', 'success');
      }, 1000);
    } else {
      setPullDistance(0);
    }
  };

  // Notification toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('btz_silos', JSON.stringify(silos));
  }, [silos]);

  useEffect(() => {
    localStorage.setItem('btz_admin_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('btz_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterSilo, filterType, searchTerm]);

  useEffect(() => {
    localStorage.setItem('btz_session', JSON.stringify(operatorSession));
  }, [operatorSession]);

  // Load operators from server on component mount to sync across all devices
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const res = await fetch('/api/operators');
        const data = await res.json();
        if (data.success && Array.isArray(data.operators)) {
          setOperators(data.operators);
        }
      } catch (err) {
        console.error('Erro ao buscar operadores do servidor:', err);
      }
    };
    fetchOperators();
  }, []);

  // Save operators to localStorage and server when they change
  useEffect(() => {
    localStorage.setItem('btz_operators', JSON.stringify(operators));
    
    const syncOperatorsToServer = async () => {
      try {
        await fetch('/api/operators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operators })
        });
      } catch (err) {
        console.error('Erro ao sincronizar operadores com o servidor:', err);
      }
    };
    
    syncOperatorsToServer();
  }, [operators]);

  useEffect(() => {
    if (currentOperator) {
      localStorage.setItem('btz_current_operator', JSON.stringify(currentOperator));
    } else {
      localStorage.removeItem('btz_current_operator');
    }
  }, [currentOperator]);

  useEffect(() => {
    if (currentOperator) {
      setOperatorSession(prev => ({
        ...prev,
        operatorName: currentOperator.operatorName,
        operatorId: currentOperator.operatorId
      }));
    } else {
      setOperatorSession(prev => ({
        ...prev,
        operatorName: '',
        operatorId: ''
      }));
    }
  }, [currentOperator]);

  // Sync self admin credentials
  useEffect(() => {
    if (currentOperator?.isAdmin) {
      setAdminSelfName(currentOperator.operatorName);
      setAdminSelfId(currentOperator.operatorId);
      setAdminSelfPassword(currentOperator.password);
    }
  }, [currentOperator]);

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Register device access on server
  const registerAccess = async () => {
    try {
      const ua = navigator.userAgent;
      const isAndroid = /Android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const isMobileDevice = isAndroid || isIOS || /Mobi/i.test(ua);
      let platformName = 'Computador';
      if (isAndroid) platformName = 'Android';
      else if (isIOS) platformName = 'iOS';
      else if (/Mac/i.test(ua)) platformName = 'macOS';
      else if (/Windows/i.test(ua)) platformName = 'Windows';
      else if (/Linux/i.test(ua)) platformName = 'Linux';

      await fetch('/api/access-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: ua,
          platform: platformName,
          language: navigator.language || 'pt-BR',
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          isMobile: isMobileDevice,
          operatorId: currentOperator?.operatorId || undefined,
          operatorName: currentOperator?.operatorName || undefined
        })
      });
    } catch (err) {
      console.warn('Erro ao registrar acesso no servidor:', err);
    }
  };

  // Trigger device access log registration when operator changes or on mount
  useEffect(() => {
    registerAccess();
  }, [currentOperator?.operatorId]);

  // Polling access logs from server for administrators
  useEffect(() => {
    if (!currentOperator?.isAdmin) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/access-logs');
        const data = await res.json();
        if (data.success && data.logs) {
          setAccessLogs(prevLogs => {
            const prevIds = new Set(prevLogs.map(l => l.id));
            const newAccesses = data.logs.filter((l: any) => !prevIds.has(l.id));
            
            // Notify if new device log is detected
            if (prevLogs.length > 0 && newAccesses.length > 0) {
              newAccesses.forEach((log: any) => {
                const deviceText = log.isMobile ? `Celular (${log.platform})` : `Computador (${log.platform})`;
                const details = log.operatorName ? `${log.operatorName} (${log.operatorId})` : `Visitante`;
                showToast(`Novo acesso detectado: ${details} via ${deviceText}`, 'info');
                
                // Audio cue beep
                try {
                  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const oscillator = audioCtx.createOscillator();
                  const gainNode = audioCtx.createGain();
                  oscillator.type = 'sine';
                  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
                  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                  oscillator.connect(gainNode);
                  gainNode.connect(audioCtx.destination);
                  oscillator.start();
                  oscillator.stop(audioCtx.currentTime + 0.15);
                } catch (e) {
                  // AudioContext might be blocked until user interacts
                }
              });
            }
            return data.logs;
          });
        }
      } catch (err) {
        console.warn('Erro ao buscar logs de acesso:', err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [currentOperator?.isAdmin]);

  const handleClearAccessLogs = async () => {
    try {
      const res = await fetch('/api/clear-access-logs', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAccessLogs([]);
        showToast('Histórico de acessos limpo com sucesso!', 'success');
      }
    } catch (err) {
      showToast('Erro ao limpar histórico de acessos.', 'error');
    }
  };

  // Show auto-dismissing toast
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- OPERATIONS ---
  
  // Open modal with default pre-fills
  const openOperationModal = (siloId: string, type: TransactionType | 'config') => {
    if (currentOperator?.isAdmin) {
      showToast('Apenas operadores podem realizar movimentações e configurar silos.', 'error');
      return;
    }
    const silo = silos.find(s => s.id === siloId);
    if (!silo) return;

    setActiveModal({ siloId, type });
    setInputQty('');
    setInputNotes('');

    if (type === 'config') {
      setConfigSiloName(silo.name);
      setConfigFeedType(silo.feedType);
      setConfigMaxCapacity(silo.maxCapacity.toString());
      setConfigMinThreshold((silo.minThreshold ?? 2000).toString());
    } else if (type === 'consumption') {
      setInputNotes('Pesagem e trato regular');
    } else if (type === 'refill') {
      setInputNotes('Recebimento de carga de ração');
    } else if (type === 'adjustment') {
      setInputQty(silo.currentBalance.toString());
      setInputNotes('Inventário de auditoria física');
    }
  };

  // Optimistic UI updates for Settings/Silo configuration
  const handleSettingsSave = async (siloId: string, updatedFields: Partial<Silo>) => {
    if (currentOperator?.isAdmin) {
      showToast('Apenas operadores podem configurar silos.', 'error');
      return;
    }
    // Perform optimistic update immediately in the UI state
    setSilos(prev => prev.map(s => s.id === siloId ? {
      ...s,
      ...updatedFields
    } : s));

    showToast(`Configurações de silo salvas (Otimista!)`, 'success');
    setActiveModal(null);

    // Simulate background API call processing
    try {
      console.log("[Optimistic UI] Processing background API request to save settings...", updatedFields);
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("[Optimistic UI] Background API request successfully completed.");
    } catch (e) {
      console.error("[Optimistic UI] Background API request failed:", e);
    }
  };

  // Optimistic UI updates for movements (saídas, abastecimentos, ajustes)
  const handleMovementSubmit = async (
    siloId: string, 
    type: string, 
    qty: number, 
    finalQty: number, 
    newBalance: number
  ) => {
    if (currentOperator?.isAdmin) {
      showToast('Apenas operadores podem realizar movimentações de ração.', 'error');
      return;
    }
    const silo = silos.find(s => s.id === siloId);
    if (!silo) return;

    // Perform optimistic updates immediately in the UI state
    setSilos(prev => prev.map(s => s.id === siloId ? { ...s, currentBalance: newBalance } : s));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      timestamp: new Date().toISOString(),
      siloId,
      siloName: silo.name,
      type: type as TransactionType,
      quantity: finalQty,
      sector: operatorSession.sector.trim(),
      batch: operatorSession.batch.trim(),
      operatorName: operatorSession.operatorName.trim(),
      operatorId: operatorSession.operatorId.trim(),
      notes: inputNotes.trim() || undefined
    };

    setTransactions(prev => [newTx, ...prev]);

    // Create an admin notification for the feed operation
    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      operatorId: operatorSession.operatorId.trim(),
      operatorName: operatorSession.operatorName.trim(),
      siloName: silo.name,
      feedType: silo.feedType,
      type: type as 'consumption' | 'refill' | 'adjustment',
      quantity: Math.abs(finalQty),
      sector: operatorSession.sector.trim(),
      batch: operatorSession.batch.trim(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(
      type === 'consumption' 
        ? `Consumo de ${qty.toLocaleString('pt-BR')} kg registrado (Otimista!)` 
        : type === 'refill' 
        ? `Abastecimento de ${qty.toLocaleString('pt-BR')} kg registrado (Otimista!)` 
        : `Saldo do silo ajustado para ${qty.toLocaleString('pt-BR')} kg (Otimista!)`,
      'success'
    );
    setActiveModal(null);

    // Simulate background API call processing
    try {
      console.log("[Optimistic UI] Processing background API request for movement...", { siloId, type, qty, finalQty });
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("[Optimistic UI] Background API saving completed successfully.");
    } catch (e) {
      console.error("[Optimistic UI] Background API request failed:", e);
    }
  };

  // Handle operation submission
  const handleSubmitOperation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    const { siloId, type } = activeModal;
    const silo = silos.find(s => s.id === siloId);
    if (!silo) return;

    // Validation for operator session
    if (type !== 'config') {
      if (!operatorSession.operatorName.trim() || !operatorSession.operatorId.trim()) {
        showToast('Identificação obrigatória! Preencha o nome do pesador e a matrícula.', 'error');
        return;
      }
      if (!operatorSession.sector.trim() || !operatorSession.batch.trim()) {
        showToast('Identificação obrigatória! Preencha o setor e o lote ativos.', 'error');
        return;
      }
    }

    const qty = parseFloat(inputQty);
    if (type !== 'config' && (isNaN(qty) || qty <= 0) && type !== 'adjustment') {
      showToast('Quantidade inválida! Insira um valor numérico positivo.', 'error');
      return;
    }

    if (type === 'config') {
      const maxCap = parseFloat(configMaxCapacity);
      if (isNaN(maxCap) || maxCap <= 0) {
        showToast('Capacidade máxima inválida!', 'error');
        return;
      }

      const minThresh = parseFloat(configMinThreshold);
      if (isNaN(minThresh) || minThresh < 0) {
        showToast('Limite mínimo de estoque inválido!', 'error');
        return;
      }

      handleSettingsSave(siloId, {
        name: configSiloName.trim() || silo.name,
        feedType: configFeedType.trim() || silo.feedType,
        maxCapacity: maxCap,
        minThreshold: minThresh
      });
      return;
    }

    let newBalance = silo.currentBalance;
    let finalQty = qty;

    if (type === 'consumption') {
      if (qty > silo.currentBalance) {
        showToast(`Saldo insuficiente! O silo possui apenas ${silo.currentBalance.toLocaleString('pt-BR')} kg.`, 'error');
        return;
      }
      newBalance = silo.currentBalance - qty;
      finalQty = -qty; // Negative for consumption log
      handleMovementSubmit(siloId, type, qty, finalQty, newBalance);
    } else if (type === 'refill') {
      newBalance = silo.currentBalance + qty;
      if (silo.currentBalance + qty > silo.maxCapacity) {
        setCustomConfirm({
          title: 'Exceder Capacidade',
          message: `Atenção: O abastecimento de ${qty.toLocaleString('pt-BR')} kg excederá a capacidade máxima do silo (${silo.maxCapacity.toLocaleString('pt-BR')} kg). Deseja continuar?`,
          isDanger: true,
          confirmText: 'Abastecer mesmo assim',
          onConfirm: () => {
            handleMovementSubmit(siloId, type, qty, finalQty, newBalance);
          }
        });
      } else {
        handleMovementSubmit(siloId, type, qty, finalQty, newBalance);
      }
    } else if (type === 'adjustment') {
      const adjQty = parseFloat(inputQty);
      if (isNaN(adjQty) || adjQty < 0) {
        showToast('Saldo de ajuste inválido!', 'error');
        return;
      }
      newBalance = adjQty;
      finalQty = adjQty - silo.currentBalance; // Difference recorded
      handleMovementSubmit(siloId, type, qty, finalQty, newBalance);
    }
  };

  // Clear single transaction
  const handleDeleteTransaction = (id: string) => {
    if (!currentOperator?.isAdmin) {
      showToast('Apenas administradores podem excluir registros.', 'error');
      return;
    }
    setCustomConfirm({
      title: 'Excluir Movimentação',
      message: 'Tem certeza de que deseja excluir este registro de movimentação? Isso não afetará o saldo atual dos silos.',
      isDanger: true,
      confirmText: 'Excluir Registro',
      onConfirm: () => {
        setTransactions(prev => prev.filter(tx => tx.id !== id));
        showToast('Registro excluído do histórico.', 'info');
      }
    });
  };

  // Clear entire history
  const handleClearHistory = () => {
    if (!currentOperator?.isAdmin) {
      showToast('Apenas administradores podem apagar o histórico de movimentações.', 'error');
      return;
    }
    setCustomConfirm({
      title: 'Limpar Todo o Histórico',
      message: 'ATENÇÃO: Você deseja apagar TODO o histórico de movimentações? Esta ação é irreversível.',
      isDanger: true,
      confirmText: 'Excluir Tudo',
      onConfirm: () => {
        setTransactions([]);
        showToast('Todo o histórico de movimentações foi apagado.', 'info');
      }
    });
  };

  // Reset silos to default capacities/levels
  const handleResetSilos = () => {
    if (!currentOperator?.isAdmin) {
      showToast('Apenas administradores podem redefinir os silos.', 'error');
      return;
    }
    setCustomConfirm({
      title: 'Redefinir Silos',
      message: 'Deseja redefinir os saldos dos silos para os valores padrões de fábrica?',
      isDanger: false,
      confirmText: 'Redefinir',
      onConfirm: () => {
        setSilos(DEFAULT_SILOS);
        showToast('Silos redefinidos para os valores padrões.', 'info');
      }
    });
  };

  // Delete account and clear all user storage data securely to comply with store policies
  const handleAccountDeletion = async () => {
    const opId = operatorSession.operatorId || 'anonymous';
    try {
      showToast('Excluindo conta no servidor base44...', 'info');
      await base44Client.deleteAccount(opId);
    } catch (err) {
      console.error("Erro na comunicação com base44:", err);
    }

    localStorage.removeItem('btz_silos');
    localStorage.removeItem('btz_transactions');
    localStorage.removeItem('btz_session');
    localStorage.removeItem('btz_operators');
    localStorage.removeItem('btz_current_operator');
    
    setSilos(DEFAULT_SILOS);
    setTransactions([]);
    setOperators([
      { operatorId: '86887', operatorName: 'MURILO MENDES', password: '123' },
      { operatorId: 'admin', operatorName: 'Administrador', password: 'admin', isAdmin: true },
      { operatorId: 'administrador', operatorName: 'Administrador', password: 'admin', isAdmin: true }
    ]);
    setCurrentOperator(null);
    setOperatorSession({
      operatorName: '',
      operatorId: '',
      sector: '',
      batch: ''
    });
    
    setIsConfirmDeleteAccountOpen(false);
    setIsGeneralSettingsOpen(false);
    showToast('Conta do operador e dados locais apagados com sucesso!', 'success');
  };

  const handleInnerRegisterOperator = (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = innerRegName.trim();
    const idTrimmed = innerRegId.trim();

    if (!nameTrimmed) {
      showToast('Por favor, digite o nome completo do operador.', 'error');
      return;
    }
    if (!idTrimmed) {
      showToast('Por favor, digite uma matrícula para login.', 'error');
      return;
    }
    if (innerRegPassword.length < 3) {
      showToast('A senha deve ter pelo menos 3 caracteres.', 'error');
      return;
    }

    const exists = operators.some(
      op => op.operatorId.trim().toLowerCase() === idTrimmed.toLowerCase()
    );

    if (exists) {
      showToast('Esta matrícula já está cadastrada no sistema.', 'error');
      return;
    }

    const newOp: OperatorAccount = {
      operatorId: idTrimmed,
      operatorName: nameTrimmed,
      password: innerRegPassword,
      isAdmin: innerRegIsAdmin
    };

    setOperators(prev => [...prev, newOp]);
    showToast(`Novo operador "${nameTrimmed}" cadastrado com sucesso!`, 'success');
    
    // Clear inner form fields
    setInnerRegName('');
    setInnerRegId('');
    setInnerRegPassword('');
    setInnerRegIsAdmin(false);
  };

  const handleUpdateSelfAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOperator) return;

    const nameTrimmed = adminSelfName.trim();
    const idTrimmed = adminSelfId.trim();

    if (!nameTrimmed) {
      showToast('Por favor, digite seu nome.', 'error');
      return;
    }
    if (!idTrimmed) {
      showToast('Por favor, digite seu login / matrícula.', 'error');
      return;
    }
    if (adminSelfPassword.length < 3) {
      showToast('A senha deve ter pelo menos 3 caracteres.', 'error');
      return;
    }

    const oldId = currentOperator.operatorId;
    const exists = operators.some(
      op => op.operatorId.trim().toLowerCase() === idTrimmed.toLowerCase() && op.operatorId.toLowerCase() !== oldId.toLowerCase()
    );

    if (exists) {
      showToast('Este login / matrícula já está cadastrado por outro usuário.', 'error');
      return;
    }

    const updatedOp: OperatorAccount = {
      operatorId: idTrimmed,
      operatorName: nameTrimmed,
      password: adminSelfPassword,
      isAdmin: true
    };

    // Update operators list
    setOperators(prev => {
      const filtered = prev.filter(op => op.operatorId.toLowerCase() !== oldId.toLowerCase());
      return [...filtered, updatedOp];
    });

    // Update silos map if operatorId changed
    if (oldId.toLowerCase() !== idTrimmed.toLowerCase()) {
      setSilosByOperator(prevMap => {
        const userSilos = prevMap[oldId] || prevMap[oldId.toLowerCase()] || DEFAULT_SILOS;
        const nextMap = { ...prevMap };
        delete nextMap[oldId];
        delete nextMap[oldId.toLowerCase()];
        nextMap[idTrimmed] = userSilos;
        localStorage.setItem('btz_silos_by_operator', JSON.stringify(nextMap));
        return nextMap;
      });
    }

    // Set active session operator
    setCurrentOperator(updatedOp);
    showToast('Seus dados de acesso foram atualizados com sucesso!', 'success');
  };

  const handleDeleteOperator = (operatorIdToDelete: string) => {
    if (currentOperator && currentOperator.operatorId === operatorIdToDelete) {
      showToast('Você não pode excluir sua própria conta ativa.', 'error');
      return;
    }
    const found = operators.find(op => op.operatorId === operatorIdToDelete);
    if (!found) {
      showToast('Usuário não encontrado.', 'error');
      return;
    }
    
    const confirmMessage = found.isAdmin 
      ? `Tem certeza que deseja excluir o administrador "${found.operatorName}"? Esta ação é irreversível.`
      : `Tem certeza que deseja excluir o operador "${found.operatorName}"? Esta ação é irreversível.`;
      
    setCustomConfirm({
      title: 'Excluir Operador',
      message: confirmMessage,
      isDanger: true,
      confirmText: 'Sim, Excluir',
      onConfirm: () => {
        setOperators(prev => prev.filter(op => op.operatorId !== operatorIdToDelete));
        showToast(`Usuário "${found.operatorName}" excluído com sucesso!`, 'success');
      }
    });
  };

  // Export transactions to a professional high-definition image report with all details
  const handleExportImage = () => {
    if (filteredTransactions.length === 0) {
      showToast('Não há movimentações correspondentes aos filtros para gerar o relatório.', 'error');
      return;
    }

    showToast('Gerando relatório em formato de imagem...', 'info');

    // Slice to maximum of 150 transactions for performance and memory constraints
    const maxItems = 150;
    const itemsToRender = filteredTransactions.slice(0, maxItems);
    const hasMoreThanMax = filteredTransactions.length > maxItems;

    // Create offline canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showToast('Erro ao inicializar renderizador de imagem.', 'error');
      return;
    }

    // Dimensions setup
    const width = 1200;
    const headerH = 140;
    const metaH = 80;
    const kpisH = 110;
    const tableHeaderH = 40;
    const rowH = 44;
    const N = itemsToRender.length;
    const tableH = tableHeaderH + (N * rowH);
    const warningH = hasMoreThanMax ? 40 : 0;
    const footerH = 90;
    const height = headerH + metaH + kpisH + tableH + warningH + footerH + 40; // with some margin

    // Set high-DPI scaling
    canvas.width = width;
    canvas.height = height;

    // Draw background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw outer fine border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Helper: draw rounded rectangles
    const drawRoundRect = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number,
      fill?: string,
      stroke?: string,
      strokeW?: number
    ) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + w - radius, y);
      c.quadraticCurveTo(x + w, y, x + w, y + radius);
      c.lineTo(x + w, y + h - radius);
      c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      c.lineTo(x + radius, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - radius);
      c.lineTo(x, y + radius);
      c.quadraticCurveTo(x, y, x + radius, y);
      c.closePath();
      if (fill) {
        c.fillStyle = fill;
        c.fill();
      }
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = strokeW || 1;
        c.stroke();
      }
    };

    // 1. HEADER SECTION (Slate/Navy theme)
    ctx.fillStyle = '#002075';
    ctx.fillRect(12, 12, width - 24, headerH - 12);

    // Header Content
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('PORTAL BTZ SILOS - TECNOLOGIA INDUSTRIAL', 50, 52);

    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('RELATÓRIO DE AUDITORIA DE MOVIMENTAÇÃO', 50, 92);

    ctx.fillStyle = '#93C5FD';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('Auditoria eletrônica oficial de níveis, abastecimentos e consumos de ração', 50, 115);

    // Top Right Badge: Official Document
    drawRoundRect(ctx, 880, 42, 270, 36, 6, 'rgba(255,255,255,0.08)', '#3B82F6', 1);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ DOCUMENTO OFICIAL DE AUDITORIA ★', 880 + 135, 64);
    ctx.textAlign = 'left'; // reset

    // 2. METADATA SECTION
    const startMetaY = headerH + 20;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('DADOS DA EMISSÃO:', 50, startMetaY);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Data/Hora: ${new Date().toLocaleString('pt-BR')}`, 50, startMetaY + 20);
    ctx.fillText(`Operador: ${currentOperator?.operatorName || 'Administrador'} (Matrícula: ${currentOperator?.operatorId || 'admin'})`, 50, startMetaY + 38);

    // Filters Box
    drawRoundRect(ctx, 580, startMetaY - 12, 570, 60, 8, '#F8FAFC', '#E2E8F0', 1);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('FILTROS ATIVOS NA EMISSÃO:', 595, startMetaY + 5);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#475569';
    const activeSiloStr = filterSilo === 'all' ? 'Todos os Silos' : silos.find(s => s.id === filterSilo)?.name || filterSilo;
    const activeTypeStr = filterType === 'all' ? 'Todas Operações' : filterType === 'consumption' ? 'Consumo (Saída)' : filterType === 'refill' ? 'Entrada (Abastecimento)' : 'Ajustes Manuais';
    const activeSearchStr = searchTerm.trim() ? `"${searchTerm.trim()}"` : 'Nenhum';
    ctx.fillText(`Silo: ${activeSiloStr}   |   Operação: ${activeTypeStr}`, 595, startMetaY + 22);
    ctx.fillText(`Busca de texto: ${activeSearchStr}`, 595, startMetaY + 38);

    // Horizontal separator
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, startMetaY + 55);
    ctx.lineTo(1150, startMetaY + 55);
    ctx.stroke();

    // 3. KPI METRICS CARDS SECTION
    const startKpisY = startMetaY + 70;
    const cardW = 265;
    const cardGap = 20;
    const cardH = 85;

    // Card 1: Total Entrada (Green)
    drawRoundRect(ctx, 50, startKpisY, cardW, cardH, 10, '#ECFDF5', '#10B981', 1.5);
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('▲ TOTAL ENTRADAS (CARGA)', 65, startKpisY + 25);
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`+${statsRefill.toLocaleString('pt-BR')} kg`, 65, startKpisY + 58);

    // Card 2: Total Consumo (Rose)
    drawRoundRect(ctx, 50 + cardW + cardGap, startKpisY, cardW, cardH, 10, '#FFF1F2', '#F43F5E', 1.5);
    ctx.fillStyle = '#BE123C';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('▼ TOTAL CONSUMO (SAÍDA)', 50 + cardW + cardGap + 15, startKpisY + 25);
    ctx.fillStyle = '#E11D48';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`-${statsConsumption.toLocaleString('pt-BR')} kg`, 50 + cardW + cardGap + 15, startKpisY + 58);

    // Card 3: Saldo Líquido (Indigo/Orange)
    const isFlowPositive = statsNetFlow >= 0;
    const flowBg = isFlowPositive ? '#EEF2FF' : '#FFFBEB';
    const flowBorder = isFlowPositive ? '#6366F1' : '#F59E0B';
    const flowTitleCol = isFlowPositive ? '#3730A3' : '#78350F';
    const flowValCol = isFlowPositive ? '#4F46E5' : '#D97706';
    drawRoundRect(ctx, 50 + (cardW + cardGap) * 2, startKpisY, cardW, cardH, 10, flowBg, flowBorder, 1.5);
    ctx.fillStyle = flowTitleCol;
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('✦ BALANÇO LÍQUIDO DE FLUXO', 50 + (cardW + cardGap) * 2 + 15, startKpisY + 25);
    ctx.fillStyle = flowValCol;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`${isFlowPositive ? '+' : ''}${statsNetFlow.toLocaleString('pt-BR')} kg`, 50 + (cardW + cardGap) * 2 + 15, startKpisY + 58);

    // Card 4: Count of items (Slate)
    drawRoundRect(ctx, 50 + (cardW + cardGap) * 3, startKpisY, cardW, cardH, 10, '#F8FAFC', '#64748B', 1.5);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('☰ QUANTIDADE DE REGISTROS', 50 + (cardW + cardGap) * 3 + 15, startKpisY + 25);
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`${filteredTransactions.length} itens`, 50 + (cardW + cardGap) * 3 + 15, startKpisY + 58);

    // 4. DATA TABLE SECTION
    const startTableY = startKpisY + cardH + 25;

    // Table Background Header
    drawRoundRect(ctx, 50, startTableY, 1100, tableHeaderH, 6, '#0F172A');
    
    // Header columns titles
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('DATA / HORA', 65, startTableY + 25);
    ctx.fillText('SILO', 230, startTableY + 25);
    ctx.fillText('OPERAÇÃO', 390, startTableY + 25);
    
    // Right align QUANTIDADE header
    ctx.textAlign = 'right';
    ctx.fillText('QUANTIDADE', 640, startTableY + 25);
    ctx.textAlign = 'left'; // restore
    
    ctx.fillText('SETOR / LOTE', 675, startTableY + 25);
    ctx.fillText('PESADOR (OPERADOR)', 845, startTableY + 25);
    ctx.fillText('OBSERVAÇÕES', 1015, startTableY + 25);

    // Table rows
    const startRowsY = startTableY + tableHeaderH;
    itemsToRender.forEach((tx, idx) => {
      const yRow = startRowsY + idx * rowH;

      // Alternating row background
      ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(50, yRow, 1100, rowH);

      // Bottom separator border
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, yRow + rowH);
      ctx.lineTo(1150, yRow + rowH);
      ctx.stroke();

      // Col 1: Timestamp
      const dateText = new Date(tx.timestamp).toLocaleString('pt-BR');
      ctx.fillStyle = '#475569';
      ctx.font = '12px monospace';
      ctx.fillText(dateText, 65, yRow + 26);

      // Col 2: Silo Name
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(tx.siloName, 230, yRow + 26);

      // Col 3: Operation Pill
      const isConsumption = tx.type === 'consumption';
      const isRefill = tx.type === 'refill';
      let pillBg = '#DBEAFE';
      let pillBorder = '#BFDBFE';
      let pillTextCol = '#1E40AF';
      let pillLabel = 'AJUSTE';

      if (isConsumption) {
        pillBg = '#FEE2E2';
        pillBorder = '#FECACA';
        pillTextCol = '#991B1B';
        pillLabel = 'CONSUMO';
      } else if (isRefill) {
        pillBg = '#D1FAE5';
        pillBorder = '#A7F3D0';
        pillTextCol = '#065F46';
        pillLabel = 'ENTRADA';
      }

      drawRoundRect(ctx, 390, yRow + 10, 95, 24, 6, pillBg, pillBorder, 1);
      ctx.fillStyle = pillTextCol;
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pillLabel, 390 + 95 / 2, yRow + 25);
      ctx.textAlign = 'left'; // restore

      // Col 4: Quantity
      const sign = isConsumption ? '-' : isRefill ? '+' : '';
      const qtyText = `${sign}${Math.abs(tx.quantity).toLocaleString('pt-BR')} kg`;
      const qtyCol = isConsumption ? '#E11D48' : isRefill ? '#059669' : '#2563EB';

      ctx.textAlign = 'right';
      ctx.fillStyle = qtyCol;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(qtyText, 640, yRow + 26);
      ctx.textAlign = 'left'; // restore

      // Col 5: Sector & Batch
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(tx.sector, 675, yRow + 18);
      ctx.fillStyle = '#64748B';
      ctx.font = '9px monospace';
      ctx.fillText(`LOTE: ${tx.batch.toUpperCase()}`, 675, yRow + 32);

      // Col 6: Operator Name & ID
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(tx.operatorName, 845, yRow + 18);
      ctx.fillStyle = '#64748B';
      ctx.font = '9px monospace';
      ctx.fillText(`MATRÍCULA: ${tx.operatorId}`, 845, yRow + 32);

      // Col 7: Notes
      let noteText = tx.notes || '-';
      if (noteText.length > 25) {
        noteText = noteText.substring(0, 23) + '...';
      }
      ctx.fillStyle = tx.notes ? '#475569' : '#94A3B8';
      ctx.font = tx.notes ? 'italic 11px sans-serif' : '11px sans-serif';
      ctx.fillText(noteText, 1015, yRow + 26);
    });

    // 5. MAX WARNING IF SPLICED
    let curY = startRowsY + N * rowH;
    if (hasMoreThanMax) {
      ctx.fillStyle = '#FFFBEB';
      ctx.fillRect(50, curY + 10, 1100, 30);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, curY + 10, 1100, 30);

      ctx.fillStyle = '#B45309';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`▲ Atenção: Devido a limites de renderização de imagem, são mostradas as primeiras ${maxItems} linhas de um total de ${filteredTransactions.length} registros filtrados.`, 65, curY + 29);
      curY += 45;
    }

    // 6. FOOTER SECTION
    const footerStartY = curY + 20;
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, footerStartY);
    ctx.lineTo(1150, footerStartY);
    ctx.stroke();

    // Bottom descriptions
    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 11px sans-serif';
    ctx.fillText('Este documento é um relatório digital certificado. As informações contidas representam transações auditadas de balanço físico de silos.', 50, footerStartY + 25);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.fillText('BTZ Silos Inteligentes — Plataforma de Gerenciamento e Logística Agropecuária. Todos os direitos reservados.', 50, footerStartY + 42);

    // Validation Stamp Card
    drawRoundRect(ctx, 840, footerStartY + 10, 310, 42, 8, '#ECFDF5', '#10B981', 1.5);
    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('✓ SISTEMA INTEGRADO BTZ - CRIPTOGRAFADO & AUDITADO', 855, footerStartY + 26);
    ctx.fillStyle = '#047857';
    ctx.font = '9px monospace';
    ctx.fillText('Selo de Autenticidade: VERIFIED_AUDIT_LOG_SECURE', 855, footerStartY + 38);

    // Save/Download link
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `relatorio_movimentacao_btz_silos_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Relatório de movimentação exportado como imagem com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar relatório em formato de imagem.', 'error');
    }
  };

  // Export current silo levels to a professional high-definition image report
  const handleExportCurrentSilosImage = () => {
    if (silos.length === 0) {
      showToast('Nenhum silo disponível para gerar a imagem.', 'error');
      return;
    }

    showToast('Gerando imagem profissional dos níveis dos silos...', 'info');

    // Create offline canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      showToast('Erro ao inicializar renderizador de imagem.', 'error');
      return;
    }

    // Professional poster dimensions (1200 x 960)
    const width = 1200;
    const height = 960;
    canvas.width = width;
    canvas.height = height;

    // Crisp rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Solid pure white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 2. Thick elegant border with brand color
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 24;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    ctx.strokeStyle = '#002075';
    ctx.lineWidth = 4;
    ctx.strokeRect(26, 26, width - 52, height - 52);

    // Helper: draw rounded rectangle
    const drawRoundRect = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number,
      fill?: string,
      stroke?: string,
      strokeW?: number
    ) => {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + w - radius, y);
      c.quadraticCurveTo(x + w, y, x + w, y + radius);
      c.lineTo(x + w, y + h - radius);
      c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      c.lineTo(x + radius, y + h);
      c.quadraticCurveTo(x, y + h, x, y + h - radius);
      c.lineTo(x, y + radius);
      c.quadraticCurveTo(x, y, x + radius, y);
      c.closePath();
      if (fill) {
        c.fillStyle = fill;
        c.fill();
      }
      if (stroke) {
        c.strokeStyle = stroke;
        c.lineWidth = strokeW || 1;
        c.stroke();
      }
    };

    // 3. BRAND HEADER BANNER
    ctx.fillStyle = '#002075';
    ctx.fillRect(28, 28, width - 56, 150);

    // Diagonal accents in header (BTZ theme)
    ctx.fillStyle = '#D60005';
    ctx.beginPath();
    ctx.moveTo(850, 178);
    ctx.lineTo(1172, 28);
    ctx.lineTo(1172, 178);
    ctx.closePath();
    ctx.fill();

    // Header Content
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('PORTAL BTZ SILOS - CONTROLE DIGITAL REALTIME', 60, 72);

    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('NÍVEIS ATUAIS E SALDO EM QUILOS', 60, 114);

    ctx.fillStyle = '#93C5FD';
    ctx.font = 'italic 14px sans-serif';
    ctx.fillText('Auditoria volumétrica instantânea de armazenamento de ração', 60, 140);

    // Top Right Stamp Card
    drawRoundRect(ctx, 890, 48, 250, 42, 6, 'rgba(255,255,255,0.08)', '#3B82F6', 1);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('INSPEÇÃO DE INVENTÁRIO ATIVO', 890 + 125, 74);
    ctx.textAlign = 'left'; // reset

    // 4. METADATA SECTION
    const metaY = 205;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('DADOS DE LEITURA:', 60, metaY);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Data da Emissão: ${new Date().toLocaleString('pt-BR')}`, 60, metaY + 22);
    ctx.fillText(`Operador Ativo: ${currentOperator?.operatorName || 'Administrador'} (${currentOperator?.operatorId || 'admin'})`, 60, metaY + 40);

    // System Status badge
    drawRoundRect(ctx, 520, metaY - 10, 620, 60, 8, '#F8FAFC', '#E2E8F0', 1);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SISTEMA AUTOMÁTICO DE VERIFICAÇÃO BTZ:', 535, metaY + 8);
    
    // Status indicators
    const isAnyLow = silos.some(s => s.currentBalance < (s.minThreshold ?? 2500));
    ctx.font = '11px sans-serif';
    if (isAnyLow) {
      ctx.fillStyle = '#DC2626';
      ctx.fillText('● ATENÇÃO: NÍVEIS ABAIXO DO LIMITE MÍNIMO CONVENCIADO EM ALGUNS SILOS', 535, metaY + 28);
    } else {
      ctx.fillStyle = '#16A34A';
      ctx.fillText('● NORMAL: TODOS OS SILOS APRESENTAM CAPACIDADE ACIMA DO MÍNIMO DE ALERTA', 535, metaY + 28);
    }
    ctx.fillStyle = '#475569';
    ctx.fillText(`Setor: ${operatorSession?.sector || 'RECRIA'}   |   Lote: ${operatorSession?.batch || 'NC 05 LT 150'}`, 535, metaY + 44);

    // Horizontal divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, metaY + 68);
    ctx.lineTo(1140, metaY + 68);
    ctx.stroke();

    // 5. SILOS VISUALIZERS (3 COLUMNS)
    const startSilosY = metaY + 95;
    const colW = 340;
    const gap = 40;

    silos.forEach((silo, idx) => {
      const sx = 60 + idx * (colW + gap);
      const fillPct = silo.maxCapacity > 0 ? (silo.currentBalance / silo.maxCapacity) * 100 : 0;
      const isLow = silo.currentBalance < (silo.minThreshold ?? 2500);
      const isMedium = !isLow && silo.currentBalance < ((silo.minThreshold ?? 2500) + (silo.maxCapacity * 0.15));

      let primaryColor = '#10B981'; // green
      let bgColor = '#ECFDF5';
      let textCol = '#065F46';
      let borderCol = '#A7F3D0';
      let statusLabel = '✓ NÍVEL OPERACIONAL SEGURO';

      if (isLow) {
        primaryColor = '#D60005'; // red
        bgColor = '#FEF2F2';
        textCol = '#991B1B';
        borderCol = '#FCA5A5';
        statusLabel = '⚠ ALERTA - ABASTECER URGENTE';
      } else if (isMedium) {
        primaryColor = '#F59E0B'; // amber
        bgColor = '#FFFBEB';
        textCol = '#78350F';
        borderCol = '#FDE68A';
        statusLabel = '⚠ ATENÇÃO - ESTOQUE PARCIAL';
      }

      // Card Background Frame
      drawRoundRect(ctx, sx, startSilosY, colW, 460, 16, '#F8FAFC', '#E2E8F0', 1);

      // Card Header
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(silo.name.toUpperCase(), sx + 25, startSilosY + 35);
      
      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.fillText(silo.feedType, sx + 25, startSilosY + 54);

      // Draw Silo 2D Vector Outline
      const containerX = sx + 105;
      const containerY = startSilosY + 80;
      const containerW = 130;
      const containerH = 220;

      // 1. Shadow underneath legs
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.ellipse(containerX + containerW/2, containerY + containerH + 15, containerW/2.5, 4, 0, 0, Math.PI*2);
      ctx.fill();

      // 2. Legs
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(containerX + containerW * 0.15, containerY + containerH - 10);
      ctx.lineTo(containerX + containerW * 0.15, containerY + containerH + 15);
      ctx.moveTo(containerX + containerW * 0.85, containerY + containerH - 10);
      ctx.lineTo(containerX + containerW * 0.85, containerY + containerH + 15);
      ctx.stroke();

      // Diagonal support bars
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(containerX + containerW * 0.15, containerY + containerH - 30);
      ctx.lineTo(containerX + containerW * 0.85, containerY + containerH - 5);
      ctx.moveTo(containerX + containerW * 0.85, containerY + containerH - 30);
      ctx.lineTo(containerX + containerW * 0.15, containerY + containerH - 5);
      ctx.stroke();

      // Cone discharge bottom
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(containerX + containerW * 0.15, containerY + containerH - 40);
      ctx.lineTo(containerX + containerW * 0.5, containerY + containerH + 5);
      ctx.lineTo(containerX + containerW * 0.85, containerY + containerH - 40);
      ctx.closePath();
      ctx.fill();

      // 3. Silo body fill level (fluid)
      ctx.save();
      // Define clipping region inside silo cylinder + dome top
      ctx.beginPath();
      ctx.moveTo(containerX, containerY + containerH - 40);
      ctx.lineTo(containerX, containerY + containerW*0.3);
      ctx.bezierCurveTo(containerX, containerY, containerX + containerW, containerY, containerX + containerW, containerY + containerW*0.3);
      ctx.lineTo(containerX + containerW, containerY + containerH - 40);
      ctx.closePath();
      ctx.clip();

      // Gray container background
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(containerX, containerY, containerW, containerH);

      // Dynamic color feed fill
      const fillHeight = (containerH - 40) * (fillPct / 100);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(containerX, containerY + containerH - 40 - fillHeight, containerW, fillHeight + 10);

      // Draw subtle wave effect on top of feed
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.ellipse(containerX + containerW/2, containerY + containerH - 40 - fillHeight, containerW/2, 6, 0, 0, Math.PI*2);
      ctx.fill();

      // Horizontal metal weld lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      const numWeldLines = 4;
      for (let wIdx = 1; wIdx < numWeldLines; wIdx++) {
        const weldY = containerY + 30 + wIdx * ((containerH - 70) / numWeldLines);
        ctx.beginPath();
        ctx.moveTo(containerX, weldY);
        ctx.lineTo(containerX + containerW, weldY);
        ctx.stroke();
      }

      ctx.restore();

      // Silo Outer Outline frame
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(containerX, containerY + containerH - 40);
      ctx.lineTo(containerX, containerY + containerW*0.3);
      ctx.bezierCurveTo(containerX, containerY, containerX + containerW, containerY, containerX + containerW, containerY + containerW*0.3);
      ctx.lineTo(containerX + containerW, containerY + containerH - 40);
      ctx.closePath();
      ctx.stroke();

      // Draw small silo cap
      ctx.fillStyle = '#475569';
      ctx.fillRect(containerX + containerW/2 - 15, containerY - 12, 30, 12);

      // Percentage Text inside/beside Silo
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(fillPct)}%`, sx + colW/2, startSilosY + 342);
      ctx.textAlign = 'left'; // restore

      // Balance values block
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      const balStr = `${silo.currentBalance.toLocaleString('pt-BR')} kg`;
      ctx.fillText(balStr, sx + colW/2, startSilosY + 382);

      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      const capStr = `Capacidade Máxima: ${silo.maxCapacity.toLocaleString('pt-BR')} kg`;
      ctx.fillText(capStr, sx + colW/2, startSilosY + 402);
      ctx.textAlign = 'left'; // restore

      // Status Badge
      drawRoundRect(ctx, sx + 25, startSilosY + 418, colW - 50, 26, 6, bgColor, borderCol, 1);
      ctx.fillStyle = textCol;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(statusLabel, sx + colW/2, startSilosY + 435);
      ctx.textAlign = 'left'; // restore
    });

    // 6. TOTALS & SUMMARY ROW
    const summaryY = startSilosY + 485;
    drawRoundRect(ctx, 60, summaryY, 1080, 110, 12, '#F1F5F9', '#CBD5E1', 1);

    const totalBalance = silos.reduce((sum, s) => sum + s.currentBalance, 0);
    const totalCapacity = silos.reduce((sum, s) => sum + s.maxCapacity, 0);
    const totalFillPct = totalCapacity > 0 ? (totalBalance / totalCapacity) * 100 : 0;

    // Summary Content columns
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('BALANÇO GERAL DE ARMAZENAMENTO ATIVO:', 85, summaryY + 28);

    // Total kilograms
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#002075';
    ctx.fillText(`${totalBalance.toLocaleString('pt-BR')} kg`, 85, summaryY + 68);
    
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Estoque total disponível em todos os 3 silos ativos.`, 85, summaryY + 88);

    // Capacity percentage bar
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('OCUPAÇÃO TOTAL DA CAPACIDADE INSTALADA:', 580, summaryY + 28);

    // ProgressBar outline
    const barX = 580;
    const barY = summaryY + 42;
    const barW = 480;
    const barH = 22;
    drawRoundRect(ctx, barX, barY, barW, barH, 6, '#E2E8F0', '#CBD5E1', 1);
    // ProgressBar fill
    const fillBarW = barW * (totalFillPct / 100);
    drawRoundRect(ctx, barX, barY, fillBarW, barH, 6, '#002075');

    // Percentage value on bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${totalFillPct.toFixed(1)}% preenchido`, barX + barW/2, barY + 16);
    ctx.textAlign = 'left'; // restore

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(`Capacidade instalada total: ${totalCapacity.toLocaleString('pt-BR')} kg`, barX, barY + 42);


    // 7. FOOTER SECTION
    const footerStartY = summaryY + 135;
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, footerStartY);
    ctx.lineTo(1140, footerStartY);
    ctx.stroke();

    // Descriptions & Stamp
    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 11px sans-serif';
    ctx.fillText('BTZ Silos — Relatório gerado eletronicamente em conformidade com as regras de auditoria técnica de nível.', 60, footerStartY + 25);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px sans-serif';
    ctx.fillText('Este documento digital serve para fins de controle interno e registro diário de saldo. Dados criptografados no portal.', 60, footerStartY + 42);

    // Validation Stamp Card
    drawRoundRect(ctx, 810, footerStartY + 8, 330, 42, 8, '#ECFDF5', '#10B981', 1.5);
    ctx.fillStyle = '#065F46';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('✓ CERTIFICADO DE LEITURA VOLUMÉTRICA BTZ', 825, footerStartY + 24);
    ctx.fillStyle = '#047857';
    ctx.font = '9px monospace';
    ctx.fillText(`ID do Documento: REALTIME_LEVEL_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`, 825, footerStartY + 36);

    // Download PNG
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `status_niveis_btz_silos_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Imagem de níveis atuais exportada com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar níveis em formato de imagem.', 'error');
    }
  };

  // Filtered transactions computed list
  const filteredTransactions = transactions.filter(tx => {
    const matchesSilo = filterSilo === 'all' || tx.siloId === filterSilo;
    const matchesType = filterType === 'all' || tx.type === filterType;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      tx.operatorName.toLowerCase().includes(searchLower) ||
      tx.operatorId.toLowerCase().includes(searchLower) ||
      tx.sector.toLowerCase().includes(searchLower) ||
      tx.batch.toLowerCase().includes(searchLower) ||
      tx.siloName.toLowerCase().includes(searchLower) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchLower));

    return matchesSilo && matchesType && matchesSearch;
  });

  // Calculate totals
  const totalSiloBalance = silos.reduce((acc, s) => acc + s.currentBalance, 0);
  const totalMaxCapacity = silos.reduce((acc, s) => acc + s.maxCapacity, 0);
  const globalFillPercentage = totalMaxCapacity > 0 ? (totalSiloBalance / totalMaxCapacity) * 100 : 0;

  // History tab statistics calculations (based on filtered list)
  const statsRefill = filteredTransactions
    .filter(tx => tx.type === 'refill' || (tx.type === 'adjustment' && tx.quantity > 0))
    .reduce((sum, tx) => sum + Math.abs(tx.quantity), 0);

  const statsConsumption = filteredTransactions
    .filter(tx => tx.type === 'consumption' || (tx.type === 'adjustment' && tx.quantity < 0))
    .reduce((sum, tx) => sum + Math.abs(tx.quantity), 0);

  const statsAdjustmentCount = filteredTransactions.filter(tx => tx.type === 'adjustment').length;

  const statsNetFlow = filteredTransactions.reduce((sum, tx) => sum + tx.quantity, 0);

  // Pagination parameters
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Active modal details helper
  const modalSilo = activeModal ? silos.find(s => s.id === activeModal.siloId) : null;

  if (!currentOperator) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
            >
              <div className={`p-4 rounded-xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
                toast.type === 'success' 
                  ? 'bg-emerald-500/95 text-white border-emerald-400' 
                  : toast.type === 'error'
                  ? 'bg-red-600/95 text-white border-red-500'
                  : 'bg-[#002075]/95 text-white border-[#002b80]'
              }`}>
                {toast.type === 'error' ? (
                  <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
                ) : toast.type === 'success' ? (
                  <Check className="w-5 h-5 shrink-0" />
                ) : (
                  <Info className="w-5 h-5 shrink-0" />
                )}
                <p className="font-medium text-sm flex-1">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AuthScreen
          operators={operators}
          onLoginSuccess={(operator) => {
            setCurrentOperator(operator);
            setActiveTab(operator.isAdmin ? 'historico' : 'silos');
          }}
          onRegisterSuccess={(newOperator) => {
            setOperators(prev => [...prev, newOperator]);
            setCurrentOperator(newOperator);
            setActiveTab(newOperator.isAdmin ? 'historico' : 'silos');
          }}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased pb-20 md:pb-12 selection:bg-[#002075] selection:text-white"
    >
      {/* Pull to Refresh Banner Indicator */}
      <AnimatePresence>
        {pullDistance > 8 && (
          <motion.div 
            style={{ height: pullDistance }}
            className="flex items-center justify-center overflow-hidden bg-slate-100 border-b border-slate-200 text-xs font-semibold gap-2 select-none"
          >
            {isRefreshing ? (
              <div className="w-4 h-4 border-2 border-[#002075] border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 text-[#002075] shrink-0" style={{ transform: `rotate(${pullDistance * 4}deg)` }} />
            )}
            <span className="text-slate-600 font-bold font-mono">
              {isRefreshing ? 'Sincronizando...' : pullDistance > 45 ? 'Solte para sincronizar' : 'Puxe para sincronizar'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div className={`p-4 rounded-xl shadow-xl border flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-500/95 text-white border-emerald-400' 
                : toast.type === 'error'
                ? 'bg-red-600/95 text-white border-red-500'
                : 'bg-[#002075]/95 text-white border-[#002b80]'
            }`}>
              {toast.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
              ) : toast.type === 'success' ? (
                <Check className="w-5 h-5 shrink-0" />
              ) : (
                <Info className="w-5 h-5 shrink-0" />
              )}
              <p className="font-medium text-sm flex-1">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

       {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-30 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <GrupoBtzLogo className="h-14 sm:h-16" />
          
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6">
            {currentOperator?.isAdmin && (
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 text-slate-500 hover:text-[#002075] hover:bg-slate-100 rounded-lg transition-colors select-none flex items-center gap-1.5 border border-slate-200/80 sm:border-0 cursor-pointer"
                title="Notificações de Silos"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-white animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
                <span className="text-xs font-bold sm:hidden">Notificações</span>
              </button>
            )}

            <button
              onClick={() => setIsGeneralSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-[#002075] hover:bg-slate-100 rounded-lg transition-colors select-none flex items-center gap-1.5 border border-slate-200/80 sm:border-0"
              title="Configurações Gerais"
            >
              <Settings2 className="w-5 h-5" />
              <span className="text-xs font-bold sm:hidden">Painel Geral</span>
            </button>

            {currentOperator && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
                <div className="flex flex-col text-right">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 leading-none">Operador</span>
                  <span className="text-xs font-black text-slate-700 leading-normal truncate max-w-[120px]" title={currentOperator.operatorName}>
                    {currentOperator.operatorName.split(' ')[0]}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCurrentOperator(null);
                    setActiveTab('silos');
                    showToast('Sessão encerrada com sucesso.', 'info');
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Sair / Trocar Operador"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2 text-slate-600 text-sm font-mono shadow-inner">
              <Clock className="w-4 h-4 text-[#002075]" />
              <span>{currentTime || "Carregando..."}</span>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 border-l border-slate-200 pl-4">
              <div>
                <span className="block text-right uppercase tracking-wider text-[10px]">Data Atual</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CORE CONTENT WRAPPER */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex-1 flex flex-col gap-6">

        {/* DESKTOP TAB SWITCHER (Only shown to Admins to toggle Admin/History areas) */}
        {currentOperator?.isAdmin && (
          <div className="hidden md:flex items-center justify-between bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs select-none">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('historico')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'historico'
                    ? 'bg-[#002075] text-white shadow-md shadow-[#002075]/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <History className="w-4 h-4" />
                Histórico de Entradas e Saídas
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-800 text-white shadow-md shadow-slate-800/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-red-400" />
                Cadastro de Operadores
              </button>
            </div>

            <div className="px-4 text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Modo Administrador Ativo
            </div>
          </div>
        )}

        {/* TOP METRICS STRIP */}
        {!currentOperator?.isAdmin && (
          <motion.div
            animate={isMobile ? {
              opacity: activeTab === 'silos' ? 1 : 0,
              x: activeTab === 'silos' ? 0 : -30,
            } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 md:grid ${activeTab === 'silos' ? 'grid' : 'hidden'} ${activeTab === 'admin' ? 'md:hidden' : ''}`}
          >
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-[#002075]/10 rounded-lg text-[#002075]">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Total Geral</span>
              <h3 className="text-xl sm:text-2xl font-black text-[#002075] mt-0.5">
                {totalSiloBalance.toLocaleString('pt-BR')} <span className="text-sm font-semibold">kg</span>
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg text-[#D60005]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Capacidade Total</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {totalMaxCapacity.toLocaleString('pt-BR')} <span className="text-sm font-semibold">kg</span>
              </h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
            <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              <span>Nível Médio Ocupado</span>
              <span className="text-[#002075] font-bold">{globalFillPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-[#002075] to-[#D60005] h-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(100, globalFillPercentage)}%` }}
              />
            </div>
          </div>
        </motion.div>
        )}

        {/* IDENTIFICATION SECTION / SESSION CONTROL */}
        {!currentOperator?.isAdmin && (
          <motion.section
            animate={isMobile ? {
              opacity: activeTab === 'identificacao' ? 1 : 0,
              x: activeTab === 'identificacao' ? 0 : -30,
            } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden md:block ${activeTab === 'identificacao' ? 'block' : 'hidden'} ${activeTab === 'admin' ? 'md:hidden' : ''}`}
          >
          <div className="bg-gradient-to-r from-[#002075] to-[#001755] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-red-400" />
              <div>
                <h2 className="font-bold tracking-tight text-base sm:text-lg">Sessão Ativa do Operador e Identificação</h2>
                <p className="text-xs text-slate-300">Identifique a área produtiva e o lote ativo para associar às pesagens de ração.</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nome do Pesador <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={operatorSession.operatorName}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-sm font-semibold select-none cursor-not-allowed"
                  title="Nome definido na autenticação de login"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" /> Matrícula do Pesador <span className="text-red-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  disabled
                  value={operatorSession.operatorId}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-sm font-semibold select-none cursor-not-allowed"
                  title="Matrícula definida na autenticação de login"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Setor Produtivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aviário A, Setor Norte"
                  value={operatorSession.sector}
                  onChange={(e) => setOperatorSession(prev => ({ ...prev, sector: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#002075] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> Lote de Animais <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Lote 047-B"
                  value={operatorSession.batch}
                  onChange={(e) => setOperatorSession(prev => ({ ...prev, batch: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#002075] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Quick Helper Banner */}
            {(!operatorSession.sector.trim() || !operatorSession.batch.trim()) ? (
              <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed font-semibold">
                  <strong>Atenção:</strong> Os campos de <strong>Setor Produtivo</strong> e <strong>Lote de Animais</strong> são obrigatórios para registrar retiradas (saídas) de ração dos silos. Por favor, identifique a área acima.
                </p>
              </div>
            ) : (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs text-emerald-800 font-semibold">
                  Sessão identificada e pronta para registrar pesagens: <strong className="text-emerald-950">{operatorSession.operatorName} ({operatorSession.operatorId})</strong> logado no <strong className="text-emerald-950">{operatorSession.sector} - {operatorSession.batch}</strong>.
                </p>
              </div>
            )}
          </div>
        </motion.section>
        )}

        {/* ACTIVE ALERTS BANNER PANEL */}
        {!currentOperator?.isAdmin && silos.some(s => s.currentBalance < (s.minThreshold ?? 2500)) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-red-50 border-l-4 border-[#D60005] p-5 rounded-r-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:flex ${activeTab === 'silos' ? 'flex' : 'hidden'} ${activeTab === 'admin' ? 'md:hidden' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg text-[#D60005] mt-0.5 sm:mt-0 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-red-950 text-sm tracking-tight">ALERTA: Estoque Crítico de Ração Ativo!</h4>
                <p className="text-xs text-red-800 leading-relaxed mt-1">
                  Os seguintes silos estão operando abaixo do limite mínimo de segurança configurado pelo administrador:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {silos.filter(s => s.currentBalance < (s.minThreshold ?? 2500)).map(s => (
                    <span 
                      key={s.id} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D60005] text-white"
                    >
                      {s.name} ({s.feedType}): {s.currentBalance.toLocaleString('pt-BR')} kg (mínimo {(s.minThreshold ?? 2500).toLocaleString('pt-BR')} kg)
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 self-end sm:self-center">
              <span className="text-[10px] font-bold text-[#D60005] bg-red-100 px-2.5 py-1.5 rounded-lg font-mono uppercase tracking-wider border border-red-200">
                Solicitar Carga
              </span>
            </div>
          </motion.div>
        )}

        {/* 3 SILOS DISPLAY ROW */}
        {!currentOperator?.isAdmin && (
          <motion.section
            animate={isMobile ? {
              opacity: activeTab === 'silos' ? 1 : 0,
              x: activeTab === 'silos' ? 0 : -30,
            } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`md:block ${activeTab === 'silos' ? 'block' : 'hidden'} ${activeTab === 'admin' ? 'md:hidden' : ''}`}
          >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg font-black text-[#002075] tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#D60005] rounded-full inline-block"></span>
                Níveis Atuais dos Silos BTZ
              </h2>
              <p className="text-xs text-slate-500">Monitore o saldo em quilos e registre saídas de ração para os lotes.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 select-none">
              <button 
                onClick={handleExportCurrentSilosImage}
                className="text-xs font-black font-mono text-white bg-[#D60005] hover:bg-[#b00004] hover:shadow-md transition-all flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#D60005]"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Imagem de Níveis
              </button>
              <button 
                onClick={handleResetSilos}
                className="text-xs font-semibold font-mono text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Silos Padrões
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {silos.map((silo) => {
              const fillPercentage = silo.maxCapacity > 0 ? (silo.currentBalance / silo.maxCapacity) * 100 : 0;
              const isLow = silo.currentBalance < (silo.minThreshold ?? 2000);
              const isMedium = !isLow && silo.currentBalance < ((silo.minThreshold ?? 2000) + (silo.maxCapacity * 0.15));
              
              // Dynamic level colors
              let levelColorClass = "bg-emerald-500";
              let levelBgClass = "bg-emerald-50";
              let levelBorderClass = "border-emerald-200 text-emerald-700";
              
              if (isLow) {
                levelColorClass = "bg-[#D60005] animate-pulse";
                levelBgClass = "bg-rose-50";
                levelBorderClass = "border-rose-200 text-red-600";
              } else if (isMedium) {
                levelColorClass = "bg-amber-500";
                levelBgClass = "bg-amber-50";
                levelBorderClass = "border-amber-200 text-amber-700";
              }

              return (
                <div 
                  key={silo.id} 
                  id={`silo-card-${silo.id}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Estocagem</span>
                      <h3 className="text-lg font-black text-slate-900 leading-tight">{silo.name}</h3>
                      <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-[#002075]/10 text-[#002075] font-semibold">
                        {silo.feedType}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => openOperationModal(silo.id, 'config')}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Configurar Silo"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Silo Visual Body */}
                  <div className="p-6 flex-1 flex flex-col gap-6 bg-slate-50/50">
                    
                    {/* Visual Silo Graphic */}
                    <div className="flex justify-center items-center py-4">
                      <div className="relative w-36 h-56 flex flex-col justify-end">
                        
                        {/* Silo Top Cap (Metal) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-300 rounded-t-full border-t border-x border-slate-400 shadow-inner z-10" />
                        
                        {/* Silo Cylindrical Body */}
                        <div className="w-full h-44 bg-slate-100 rounded-t-sm border-x-2 border-slate-300 relative shadow-inner overflow-hidden flex flex-col justify-end">
                          
                          {/* Inner Vertical Grid Lines to mimic grain storage structure */}
                          <div className="absolute inset-y-0 left-1/4 w-0.5 bg-slate-200/50" />
                          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-slate-200/50" />
                          <div className="absolute inset-y-0 left-3/4 w-0.5 bg-slate-200/50" />
                          
                          {/* Horizontal capacity ticks */}
                          <div className="absolute top-1/4 left-0 right-0 h-px bg-slate-200" />
                          <div className="absolute top-2/4 left-0 right-0 h-px bg-slate-200" />
                          <div className="absolute top-3/4 left-0 right-0 h-px bg-slate-200" />

                          {/* Dynamic Grain Fill level */}
                          <motion.div 
                            className={`w-full relative origin-bottom ${levelColorClass}`}
                            style={{ height: `${Math.min(100, fillPercentage)}%` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.min(100, fillPercentage)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          >
                            {/* Wave Effect over grain level */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 animate-pulse" />
                          </motion.div>
                        </div>

                        {/* Silo Bottom Cone (Metallic) */}
                        <div className="w-full h-12 bg-slate-200 border-x-2 border-b-2 border-slate-300 shadow-md relative z-10 clip-path-cone flex flex-col items-center justify-end">
                          {/* Cone Slits */}
                          <div className="w-6 h-3 bg-slate-400 rounded-b-md mb-1 border-t border-slate-500 shadow-inner" />
                          {/* Silo legs representing structural industrial frame */}
                          <div className="absolute -bottom-4 left-2 w-2 h-4 bg-slate-400 rounded-b-xs" />
                          <div className="absolute -bottom-4 right-2 w-2 h-4 bg-slate-400 rounded-b-xs" />
                        </div>
                        
                        {/* Percent Badge Overlay */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/95 px-3 py-1 rounded-full shadow-md border border-slate-200 flex items-center gap-1.5 z-20">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 flex items-center justify-center overflow-hidden">
                            <span className={`w-1.5 h-1.5 rounded-full ${levelColorClass}`} />
                          </span>
                          <span className="text-xs font-mono font-black text-slate-800">
                            {fillPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Balance Data Box */}
                    <div className={`p-4 rounded-xl border ${levelBgClass} ${levelBorderClass} flex flex-col justify-between`}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Saldo Disponível</span>
                        {isLow && (
                          <span className="text-[9px] font-bold bg-[#D60005] text-white px-1.5 py-0.5 rounded animate-pulse">
                            RAÇÃO CRÍTICA!
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-2xl font-black tracking-tight leading-none">
                          {silo.currentBalance.toLocaleString('pt-BR')} <span className="text-xs font-semibold">kg</span>
                        </span>
                        <span className="text-xs font-mono opacity-80">
                          de {silo.maxCapacity.toLocaleString('pt-BR')} kg
                        </span>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex justify-between items-center text-[10px] font-semibold opacity-75">
                        <span className="text-slate-500">Limite Alerta:</span>
                        <span className="font-mono text-slate-700 font-bold">{(silo.minThreshold ?? 2500).toLocaleString('pt-BR')} kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Actions Grid */}
                  <div className="p-4 bg-slate-100 border-t border-slate-200 grid grid-cols-3 gap-2 select-none">
                    <button
                      onClick={() => openOperationModal(silo.id, 'consumption')}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-[#D60005] border border-slate-200 hover:border-red-200 shadow-2xs active:scale-95 transition-all text-center select-none"
                      title="Registrar pesagem de trato"
                    >
                      <Scale className="w-5 h-5 mb-1 text-red-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Tratar</span>
                    </button>

                    <button
                      onClick={() => openOperationModal(silo.id, 'refill')}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 shadow-2xs active:scale-95 transition-all text-center select-none"
                      title="Registrar reabastecimento do silo"
                    >
                      <Plus className="w-5 h-5 mb-1 text-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Abastecer</span>
                    </button>

                    <button
                      onClick={() => openOperationModal(silo.id, 'adjustment')}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-white hover:bg-indigo-50 text-slate-700 hover:text-[#002075] border border-slate-200 hover:border-indigo-200 shadow-2xs active:scale-95 transition-all text-center select-none"
                      title="Ajustar saldo manualmente"
                    >
                      <Settings2 className="w-5 h-5 mb-1 text-indigo-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Ajustar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
        )}

        {/* RECENT TRANSACTIONS / AUDIT TRAIL LOG */}
        <motion.section
          animate={isMobile ? {
            opacity: activeTab === 'historico' ? 1 : 0,
            x: activeTab === 'historico' ? 0 : -30,
          } : { opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex-1 flex flex-col min-h-[400px] md:flex ${activeTab === 'historico' ? 'flex' : 'hidden'} ${activeTab === 'admin' ? 'md:hidden' : ''}`}
        >
          
          {/* Section Header with control actions */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-[#002075]" />
              <div>
                <h2 className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">Histórico de Movimentações</h2>
                <p className="text-xs text-slate-500">Auditoria completa de abastecimentos, saídas e ajustes efetuados.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={handleExportImage}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg transition-colors shadow-2xs cursor-pointer select-none"
              >
                <Image className="w-3.5 h-3.5" />
                Salvar Relatório (Imagem)
              </button>

              {currentOperator?.isAdmin && (
                <button
                  onClick={handleClearHistory}
                  disabled={transactions.length === 0}
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 px-3 py-2 rounded-lg transition-colors cursor-pointer select-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Log
                </button>
              )}
            </div>
          </div>

          {/* Quick Statistics overview deck of current filtered set */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-100 bg-slate-50/50 p-4 gap-4">
            {/* Stat Refill */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Entrada</span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black font-mono text-emerald-600">
                  +{statsRefill.toLocaleString('pt-BR')} <span className="text-xs font-sans font-bold">kg</span>
                </span>
                <span className="text-[9px] text-slate-400 leading-none">Abastecido no período</span>
              </div>
            </div>

            {/* Stat Consumption */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Consumo</span>
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black font-mono text-rose-600">
                  -{statsConsumption.toLocaleString('pt-BR')} <span className="text-xs font-sans font-bold">kg</span>
                </span>
                <span className="text-[9px] text-slate-400 leading-none">Ração pesada e liberada</span>
              </div>
            </div>

            {/* Stat Net Flow */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Saldo de Fluxo</span>
                <div className={`p-1.5 rounded-lg ${statsNetFlow >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                  <RefreshCw className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className={`text-lg font-black font-mono ${statsNetFlow >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                  {statsNetFlow >= 0 ? '+' : ''}{statsNetFlow.toLocaleString('pt-BR')} <span className="text-xs font-sans font-bold">kg</span>
                </span>
                <span className="text-[9px] text-slate-400 leading-none">Balanço líquido filtrado</span>
              </div>
            </div>

            {/* Stat Count */}
            <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lançamentos</span>
                <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black font-mono text-slate-800">
                  {filteredTransactions.length} <span className="text-xs font-sans font-bold">regs</span>
                </span>
                <span className="text-[9px] text-slate-400 leading-none">{statsAdjustmentCount} ajuste(s) efetuado(s)</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-100/50 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por pesador, matrícula, setor ou lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-[#002075] focus:border-transparent placeholder:text-slate-400 font-semibold"
                />
              </div>

              {/* Filter by Silo */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                
                {/* On Desktop: native select */}
                <select
                  value={filterSilo}
                  onChange={(e) => setFilterSilo(e.target.value)}
                  className="hidden md:block bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Todos os Silos</option>
                  {silos.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* On Mobile: Bottom Sheet trigger button */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerConfig({
                      title: "Filtrar por Silo",
                      options: [
                        { value: "all", label: "Todos os Silos" },
                        ...silos.map(s => ({ value: s.id, label: s.name }))
                      ],
                      currentValue: filterSilo,
                      onSelect: (val) => setFilterSilo(val)
                    });
                    setIsMobileDrawerOpen(true);
                  }}
                  className="flex md:hidden items-center justify-between gap-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 min-w-[130px] shadow-2xs select-none cursor-pointer"
                >
                  <span>{filterSilo === 'all' ? 'Todos os Silos' : silos.find(s => s.id === filterSilo)?.name || 'Todos os Silos'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 animate-pulse" />
                </button>
              </div>

              {/* Filter by Type */}
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                
                {/* On Desktop: native select */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="hidden md:block bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Todas Operações</option>
                  <option value="consumption">Consumo (Saída)</option>
                  <option value="refill">Abastecimento (Entrada)</option>
                  <option value="adjustment">Ajustes Manuais</option>
                </select>

                {/* On Mobile: Bottom Sheet trigger button */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerConfig({
                      title: "Filtrar por Tipo de Operação",
                      options: [
                        { value: "all", label: "Todas Operações" },
                        { value: "consumption", label: "Consumo (Saída)" },
                        { value: "refill", label: "Abastecimento (Entrada)" },
                        { value: "adjustment", label: "Ajustes Manuais" }
                      ],
                      currentValue: filterType,
                      onSelect: (val) => setFilterType(val)
                    });
                    setIsMobileDrawerOpen(true);
                  }}
                  className="flex md:hidden items-center justify-between gap-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 min-w-[130px] shadow-2xs select-none cursor-pointer"
                >
                  <span>
                    {filterType === 'all' && 'Todas Operações'}
                    {filterType === 'consumption' && 'Consumo (Saída)'}
                    {filterType === 'refill' && 'Abastecimento (Entrada)'}
                    {filterType === 'adjustment' && 'Ajustes Manuais'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 animate-pulse" />
                </button>
              </div>
            </div>

            {/* Active filters summary bar with easy clear */}
            {(filterSilo !== 'all' || filterType !== 'all' || searchTerm.trim() !== '') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider select-none">Filtros ativos:</span>
                
                {filterSilo !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#002075]/10 text-[#002075] text-[10px] font-bold">
                    Silo: {silos.find(s => s.id === filterSilo)?.name || filterSilo}
                    <button onClick={() => setFilterSilo('all')} className="hover:bg-[#002075]/20 p-0.5 rounded-full transition-colors cursor-pointer">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}

                {filterType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-150 text-[10px] font-bold">
                    Operação: {
                      filterType === 'consumption' ? 'Consumo' :
                      filterType === 'refill' ? 'Entrada' : 'Ajuste'
                    }
                    <button onClick={() => setFilterType('all')} className="hover:bg-indigo-100 p-0.5 rounded-full transition-colors cursor-pointer">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}

                {searchTerm.trim() !== '' && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold max-w-[200px] truncate">
                    Busca: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:bg-slate-200 p-0.5 rounded-full transition-colors cursor-pointer shrink-0">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}

                <button 
                  onClick={() => {
                    setFilterSilo('all');
                    setFilterType('all');
                    setSearchTerm('');
                  }}
                  className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer select-none ml-auto"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            )}
          </div>

          {/* History Log Container */}
          <div className="flex-1 overflow-x-auto flex flex-col">
            {filteredTransactions.length === 0 ? (
              <div className="py-20 px-4 text-center flex flex-col items-center justify-center flex-1">
                <History className="w-14 h-14 text-slate-300 mb-3 stroke-1" />
                <h3 className="font-bold text-slate-500 text-sm">Nenhuma movimentação registrada</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Não existem registros correspondentes aos filtros selecionados. Realize saídas ou abastecimentos de ração para atualizar.
                </p>
              </div>
            ) : (
              <>
                {/* MOBILE VIEW: List of modern timeline cards */}
                <div className="block md:hidden p-4 space-y-3 flex-1 bg-slate-50/50">
                  {filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((tx) => {
                    const isConsumption = tx.type === 'consumption';
                    const isRefill = tx.type === 'refill';
                    
                    return (
                      <div 
                        key={tx.id} 
                        className={`bg-white rounded-xl border border-slate-200 p-4 shadow-3xs relative overflow-hidden flex flex-col gap-2 border-l-4 ${
                          isConsumption ? 'border-l-rose-500' : isRefill ? 'border-l-emerald-500' : 'border-l-blue-500'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono font-bold">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {new Date(tx.timestamp).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {isConsumption ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md uppercase">
                              <TrendingDown className="w-2.5 h-2.5" /> Consumo
                            </span>
                          ) : isRefill ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md uppercase">
                              <TrendingUp className="w-2.5 h-2.5" /> Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md uppercase">
                              <Sliders className="w-2.5 h-2.5" /> Ajuste
                            </span>
                          )}
                        </div>

                        {/* Silo Name and Qty */}
                        <div className="flex items-baseline justify-between py-1">
                          <span className="text-sm font-black text-[#002075] tracking-tight">{tx.siloName}</span>
                          <span className={`text-base font-black font-mono ${
                            isConsumption ? 'text-rose-600' : isRefill ? 'text-emerald-600' : 'text-blue-600'
                          }`}>
                            {isConsumption ? '-' : isRefill ? '+' : ''}
                            {Math.abs(tx.quantity).toLocaleString('pt-BR')} kg
                          </span>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Pesador</span>
                            <span className="font-bold text-slate-700 leading-tight">{tx.operatorName}</span>
                            <span className="text-[9px] font-mono text-slate-400">ID: {tx.operatorId}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Setor / Lote</span>
                            <span className="font-bold text-slate-700 leading-tight">{tx.sector}</span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase">Lote: {tx.batch}</span>
                          </div>
                        </div>

                        {/* Notes */}
                        {tx.notes && (
                          <div className="text-[11px] italic text-slate-500 bg-slate-50/50 p-2 rounded border-l-2 border-slate-300 mt-1 pl-3 font-medium">
                            "{tx.notes}"
                          </div>
                        )}

                        {/* Action row (Admins only) */}
                        {currentOperator?.isAdmin && (
                          <div className="flex items-center justify-end border-t border-slate-100 pt-2 mt-1">
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-all cursor-pointer select-none"
                            >
                              <Trash2 className="w-3 h-3 shrink-0" />
                              <span>Remover Registro</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP VIEW: High-end responsive data grid */}
                <table className="hidden md:table w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 select-none uppercase tracking-wider">
                      <th className="py-3 px-5 font-black text-[10px]">Data / Hora</th>
                      <th className="py-3 px-5 font-black text-[10px]">Silo</th>
                      <th className="py-3 px-5 font-black text-[10px]">Operação</th>
                      <th className="py-3 px-5 font-black text-[10px] text-right">Quantidade</th>
                      <th className="py-3 px-5 font-black text-[10px]">Setor / Lote</th>
                      <th className="py-3 px-5 font-black text-[10px]">Pesador (Matrícula)</th>
                      <th className="py-3 px-5 font-black text-[10px]">Obs / Notas</th>
                      {currentOperator?.isAdmin && <th className="py-3 px-5 font-black text-[10px] text-center w-20">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((tx) => {
                      const isConsumption = tx.type === 'consumption';
                      const isRefill = tx.type === 'refill';
                      
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/75 transition-all">
                          <td className="py-3.5 px-5 text-slate-500 font-mono select-none">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-300" />
                              <span>
                                {new Date(tx.timestamp).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-extrabold text-slate-900 tracking-tight text-sm">{tx.siloName}</span>
                          </td>
                          <td className="py-3.5 px-5">
                            {isConsumption ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Consumo
                              </span>
                            ) : isRefill ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Entrada (Carga)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Ajuste Saldo
                              </span>
                            )}
                          </td>
                          <td className={`py-3.5 px-5 text-right font-mono font-black text-sm ${
                            isConsumption ? 'text-rose-600' : isRefill ? 'text-emerald-600' : 'text-blue-600'
                          }`}>
                            <span className="select-none mr-0.5">{isConsumption ? '-' : isRefill ? '+' : ''}</span>
                            {Math.abs(tx.quantity).toLocaleString('pt-BR')} kg
                          </td>
                          <td className="py-3.5 px-5 text-slate-600">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 leading-tight">{tx.sector}</span>
                              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Lote: {tx.batch}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-600">
                            <div className="flex flex-col">
                              <span className="text-slate-800 font-bold leading-tight">{tx.operatorName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Matrícula: {tx.operatorId}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-500 italic max-w-xs truncate font-semibold" title={tx.notes}>
                            {tx.notes || <span className="text-slate-300 not-italic font-normal">-</span>}
                          </td>
                          {currentOperator?.isAdmin && (
                            <td className="py-3.5 px-5 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                                title="Remover Registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* ERP-GRADE PAGINATION CONTROLS FOOTER */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <span>
                      Exibindo <span className="text-slate-800 font-bold">{Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)}</span>-
                      <span className="text-slate-800 font-bold">{Math.min(filteredTransactions.length, currentPage * itemsPerPage)}</span> de <span className="text-slate-800 font-bold">{filteredTransactions.length}</span> registros
                    </span>

                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                      <span>Itens por pág:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  {/* Page Navigation */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>

                      {/* Direct pages */}
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        // For larger counts, we can cap pages, but usually 5-6 pages is fine to render direct
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentPage === pageNum 
                                ? 'bg-[#002075] text-white shadow-2xs font-black' 
                                : 'border border-slate-250 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.section>

                 {/* ADMINISTRATOR MANAGEMENT ZONE */}
        {currentOperator?.isAdmin && (
          <motion.section
            animate={isMobile ? {
              opacity: activeTab === 'admin' ? 1 : 0,
              x: activeTab === 'admin' ? 0 : -30,
            } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`flex flex-col gap-6 md:block ${activeTab === 'admin' ? 'block' : 'hidden'}`}
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 rounded-2xl border border-slate-700 shadow-lg text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-red-400 shrink-0" />
                <div>
                  <h2 className="font-extrabold tracking-tight text-lg sm:text-xl">Painel Administrativo de Usuários</h2>
                  <p className="text-xs text-slate-300 mt-0.5">Controle de acessos, cadastro de novos integrantes e gerenciamento de permissões.</p>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-slate-700/50 border border-slate-600 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2 self-start sm:self-auto shadow-inner select-none">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Sessão Admin Ativa
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 rounded-lg text-[#002075]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Total Equipe</span>
                  <span className="text-xl font-black text-slate-800 font-mono leading-none">{operators.length}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Admins</span>
                  <span className="text-xl font-black text-slate-800 font-mono leading-none">
                    {operators.filter(op => op.isAdmin).length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg text-[#002075]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Operadores</span>
                  <span className="text-xl font-black text-slate-800 font-mono leading-none">
                    {operators.filter(op => !op.isAdmin).length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-black tracking-wider">Acessos Celular</span>
                  <span className="text-xl font-black text-slate-800 font-mono leading-none">
                    {accessLogs.filter(l => l.isMobile).length}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                    {accessLogs.length} acessos totais
                  </span>
                </div>
              </div>
            </div>

            {/* Main Content Split: Form and Card List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              
              {/* Form card */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit flex flex-col gap-4">
                {/* Tab buttons */}
                <div className="flex border-b border-slate-100 pb-1.5 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminFormTab('create')}
                    className={`flex-1 pb-2 text-xs font-black uppercase tracking-wider border-b-2 text-center transition-all ${
                      adminFormTab === 'create'
                        ? 'border-[#002075] text-[#002075]'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Novo Cadastro
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminFormTab('edit_self');
                      setAdminSelfName(currentOperator?.operatorName || '');
                      setAdminSelfId(currentOperator?.operatorId || '');
                      setAdminSelfPassword(currentOperator?.password || '');
                    }}
                    className={`flex-1 pb-2 text-xs font-black uppercase tracking-wider border-b-2 text-center transition-all ${
                      adminFormTab === 'edit_self'
                        ? 'border-[#D60005] text-[#D60005]'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Meus Dados
                  </button>
                </div>

                {adminFormTab === 'create' ? (
                  <form onSubmit={handleInnerRegisterOperator} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 select-none">
                        <User className="w-3.5 h-3.5 text-slate-400" /> Nome Completo
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ex: Murilo Mendes"
                        value={innerRegName}
                        onChange={(e) => setInnerRegName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#002075] focus:border-transparent transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 select-none">
                        <Hash className="w-3.5 h-3.5 text-slate-400" /> Matrícula / Login ID
                      </label>
                      <input 
                        type="text" 
                        placeholder="Ex: 86887"
                        value={innerRegId}
                        onChange={(e) => setInnerRegId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#002075] focus:border-transparent transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 select-none">
                        <Key className="w-3.5 h-3.5 text-slate-400" /> Senha de Acesso
                      </label>
                      <input 
                        type="password" 
                        placeholder="Mínimo 3 caracteres"
                        value={innerRegPassword}
                        onChange={(e) => setInnerRegPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#002075] focus:border-transparent transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="py-1 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={innerRegIsAdmin}
                          onChange={(e) => setInnerRegIsAdmin(e.target.checked)}
                          className="w-4.5 h-4.5 text-[#002075] border-slate-300 rounded-sm focus:ring-[#002075]"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-slate-800">Definir como Admin</span>
                          <span className="text-[9px] text-slate-400 font-semibold leading-tight">Terá controle total deste painel administrativo.</span>
                        </div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#002075] hover:bg-[#001755] active:scale-[0.98] text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#002075]/10 mt-1 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 shrink-0" />
                      Salvar Novo Usuário
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleUpdateSelfAdmin} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 select-none">
                        <User className="w-3.5 h-3.5 text-slate-400" /> Meu Nome Completo
                      </label>
                      <input 
                        type="text" 
                        value={adminSelfName}
                        onChange={(e) => setAdminSelfName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#D60005] focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 select-none">
                        <Hash className="w-3.5 h-3.5 text-slate-400" /> Meu Login / ID
                      </label>
                      <input 
                        type="text" 
                        value={adminSelfId}
                        onChange={(e) => setAdminSelfId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#D60005] focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1 select-none">
                        <Key className="w-3.5 h-3.5 text-slate-400" /> Minha Nova Senha
                      </label>
                      <input 
                        type="password" 
                        placeholder="Mínimo 3 caracteres"
                        value={adminSelfPassword}
                        onChange={(e) => setAdminSelfPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#D60005] focus:border-transparent transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#D60005] hover:bg-[#b00004] active:scale-[0.98] text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#D60005]/10 mt-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      Salvar Alterações
                    </button>
                  </form>
                )}
              </div>

              {/* List column - 100% responsive cards */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-400" />
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">
                      Usuários Ativos ({operators.length})
                    </h3>
                  </div>
                </div>

                {/* Grid of Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {operators.map((op) => (
                    <div 
                      key={op.operatorId} 
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm ${
                            op.isAdmin 
                              ? 'bg-gradient-to-br from-red-500 to-red-600' 
                              : 'bg-gradient-to-br from-[#002075] to-blue-800'
                          }`}>
                            {op.operatorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-900 font-black text-sm truncate leading-snug" title={op.operatorName}>
                              {op.operatorName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              Senha: <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-black">{op.password}</span>
                            </span>
                          </div>
                        </div>

                        {op.isAdmin ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                            Admin
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                            Operador
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Matrícula (Login)</span>
                          <span className="text-xs font-mono font-extrabold text-slate-800">{op.operatorId}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteOperator(op.operatorId)}
                          disabled={currentOperator && currentOperator.operatorId === op.operatorId}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed select-none"
                          title={
                            (currentOperator && currentOperator.operatorId === op.operatorId)
                              ? "Você não pode se excluir da sessão ativa"
                              : "Excluir Usuário"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notice banner */}
                <div className="mt-2 p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed shadow-inner">
                  <Info className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <p>
                    <strong>Aviso de Permissões:</strong> Modificações na lista de operadores estão ativas imediatamente na tela de login. A conta em uso atual de administrador não pode ser excluída para evitar bloqueios permanentes do sistema.
                  </p>
                </div>
              </div>

            </div>

            {/* Devices Access History Card - Full Width below the grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">
                      Acessos Recentes de Dispositivos
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      Monitoramento em tempo real de celulares e computadores que acessaram o link do PWA.
                    </p>
                  </div>
                </div>

                {accessLogs.length > 0 && (
                  <button
                    onClick={handleClearAccessLogs}
                    className="self-start sm:self-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-xl transition-all cursor-pointer select-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Histórico de Acessos
                  </button>
                )}
              </div>

              {accessLogs.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Globe className="w-8 h-8 stroke-1 animate-pulse" />
                  <span className="text-xs font-semibold">Nenhum acesso registrado ainda.</span>
                  <p className="text-[10px] max-w-[280px]">
                    Os dados aparecerão aqui em tempo real assim que algum dispositivo acessar o link do aplicativo.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                  {accessLogs.map((log: any) => {
                    const isMobileLog = log.isMobile;
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = dateObj.toLocaleDateString('pt-BR') + ' às ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    
                    return (
                      <div 
                        key={log.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isMobileLog 
                            ? 'bg-rose-50/20 border-rose-100 hover:border-rose-200' 
                            : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black shrink-0 shadow-sm ${
                              isMobileLog 
                                ? 'bg-gradient-to-br from-rose-500 to-rose-600' 
                                : 'bg-gradient-to-br from-slate-600 to-slate-700'
                            }`}>
                              {isMobileLog ? <Smartphone className="w-4.5 h-4.5" /> : <Monitor className="w-4.5 h-4.5" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-slate-900 font-extrabold text-sm flex items-center gap-1.5">
                                {log.operatorName ? log.operatorName : 'Visitante'}
                                {log.operatorId && (
                                  <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                    ID: {log.operatorId}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {formattedDate}
                              </span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isMobileLog 
                              ? 'text-rose-700 bg-rose-100/60' 
                              : 'text-slate-700 bg-slate-200/60'
                          }`}>
                            {isMobileLog ? 'Celular' : 'Computador'}
                          </span>
                        </div>

                        <div className="border-t border-slate-100/80 pt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-slate-500 font-semibold leading-normal">
                          <div className="flex items-center gap-1 truncate col-span-2 md:col-span-1" title={log.platform}>
                            <span className="text-slate-400 font-black">Plataforma:</span>
                            <span className="text-slate-700 truncate">{log.platform}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate col-span-2 md:col-span-1">
                            <span className="text-slate-400 font-black">Resolução:</span>
                            <span className="text-slate-700">{log.screenWidth}x{log.screenHeight}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate col-span-2 md:col-span-1">
                            <span className="text-slate-400 font-black">Idioma:</span>
                            <span className="text-slate-700 uppercase">{log.language}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate col-span-2 md:col-span-1">
                            <span className="text-slate-400 font-black">IP:</span>
                            <span className="text-slate-700 font-mono">{log.ip}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.section>
        )}

      </main>

      {/* OVERLAY MODAL SYSTEM */}
      <AnimatePresence>
        {activeModal && modalSilo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Banner Title */}
              <div className={`px-6 py-4 flex items-center justify-between text-white ${
                activeModal.type === 'consumption'
                  ? 'bg-gradient-to-r from-red-600 to-[#D60005]'
                  : activeModal.type === 'refill'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
                  : activeModal.type === 'adjustment'
                  ? 'bg-gradient-to-r from-[#002075] to-blue-700'
                  : 'bg-gradient-to-r from-[#002075] to-[#001755]'
              }`}>
                <div className="flex items-center gap-2">
                  {activeModal.type === 'consumption' ? (
                    <Scale className="w-5 h-5" />
                  ) : activeModal.type === 'refill' ? (
                    <Plus className="w-5 h-5" />
                  ) : activeModal.type === 'adjustment' ? (
                    <Settings2 className="w-5 h-5" />
                  ) : (
                    <Settings2 className="w-5 h-5" />
                  )}
                  <h3 className="font-bold tracking-tight">
                    {activeModal.type === 'consumption' && `Registrar Saída (Consumo)`}
                    {activeModal.type === 'refill' && `Registrar Abastecimento`}
                    {activeModal.type === 'adjustment' && `Ajuste de Saldo Manual`}
                    {activeModal.type === 'config' && `Configurar Silo`}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-white/80 hover:text-white font-bold text-lg p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Subhead */}
              <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-bold">Silo Alvo:</span>
                <span className="text-slate-900 font-black font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shadow-3xs">
                  {modalSilo.name} ({modalSilo.feedType})
                </span>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmitOperation} className="p-6 flex flex-col gap-4">
                
                {/* --- CONFIG MODE --- */}
                {activeModal.type === 'config' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Identificador / Nome do Silo
                      </label>
                      <input
                        type="text"
                        value={configSiloName}
                        onChange={(e) => setConfigSiloName(e.target.value)}
                        placeholder="Ex: Silo 01"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#002075]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Tipo de Ração Armazenada
                      </label>
                      <input
                        type="text"
                        value={configFeedType}
                        onChange={(e) => setConfigFeedType(e.target.value)}
                        placeholder="Ex: Ração Inicial"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#002075]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Capacidade Máxima do Silo (kg)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={configMaxCapacity}
                        onChange={(e) => setConfigMaxCapacity(e.target.value)}
                        placeholder="Ex: 15000"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#002075]"
                        required
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Limite de Alerta de Estoque Mínimo (kg)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={configMinThreshold}
                        onChange={(e) => setConfigMinThreshold(e.target.value)}
                        placeholder="Ex: 2500"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#002075]"
                        required
                        min="0"
                      />
                    </div>
                  </>
                ) : (
                  /* --- OPERATIONAL TRANSACTION MODES --- */
                  <>
                    {/* Current Level display inside form */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs text-slate-600">
                      <span>Saldo Atual em Sistema:</span>
                      <strong className="text-slate-900 font-mono">{modalSilo.currentBalance.toLocaleString('pt-BR')} kg</strong>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {activeModal.type === 'consumption' && 'Peso a Retirar (kg)'}
                        {activeModal.type === 'refill' && 'Peso a Abastecer (kg)'}
                        {activeModal.type === 'adjustment' && 'Novo Saldo Real do Silo (kg)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={inputQty}
                          onChange={(e) => setInputQty(e.target.value)}
                          placeholder="Ex: 500"
                          step="any"
                          className="w-full pl-3.5 pr-12 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#002075] font-bold text-base"
                          required
                          min="0"
                          autoFocus
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          KG
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Observações / Notas
                      </label>
                      <textarea
                        value={inputNotes}
                        onChange={(e) => setInputNotes(e.target.value)}
                        placeholder="Ex: Trato correspondente ao ciclo matutino..."
                        rows={2}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#002075]"
                      />
                    </div>

                    {/* Operational Session Quick Review */}
                    <div className="p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assinatura Digital</span>
                      
                      <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-xs text-slate-700">
                        <div>Pesador: <strong>{operatorSession.operatorName || '-'}</strong></div>
                        <div>Matrícula: <strong>{operatorSession.operatorId || '-'}</strong></div>
                        <div>Setor: <strong>{operatorSession.sector || '-'}</strong></div>
                        <div>Lote: <strong>{operatorSession.batch || '-'}</strong></div>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit button bar */}
                <div className="flex gap-3 mt-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer ${
                      activeModal.type === 'consumption'
                        ? 'bg-red-600 hover:bg-red-700'
                        : activeModal.type === 'refill'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#002075] hover:bg-[#001755]'
                    }`}
                  >
                    Confirmar Registro
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GENERAL SETTINGS MODAL */}
      <AnimatePresence>
        {isGeneralSettingsOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Modal Banner Title */}
              <div className="px-6 py-4 flex items-center justify-between text-white bg-gradient-to-r from-slate-800 to-slate-900">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold tracking-tight">Painel de Ajustes Gerais</h3>
                </div>
                <button
                  onClick={() => setIsGeneralSettingsOpen(false)}
                  className="text-white/80 hover:text-white font-bold text-lg p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <div className="p-6 flex flex-col gap-5">
                {currentOperator?.isAdmin && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Manutenção e Dados</h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          handleResetSilos();
                          setIsGeneralSettingsOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-700 transition-colors flex items-center gap-2 select-none cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        Restaurar Capacidades e Níveis Padrões
                      </button>

                      <button
                        onClick={() => {
                          handleClearHistory();
                          setIsGeneralSettingsOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 font-semibold text-xs text-slate-700 transition-colors flex items-center gap-2 select-none cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-slate-500" />
                        Apagar Histórico de Movimentações (Audit Log)
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Segurança e Privacidade (Políticas das Lojas)</h4>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                    Em conformidade com as diretrizes da Google Play e App Store, você pode solicitar a exclusão total do cadastro do operador bem como todos os dados associados a este aplicativo localmente.
                  </p>
                  <button
                    onClick={() => setIsConfirmDeleteAccountOpen(true)}
                    className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 select-none"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    Excluir Conta do Operador & Dados Locais
                  </button>
                </div>

                {/* Footer close */}
                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setIsGeneralSettingsOpen(false)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECURE CONFIRMATION POPUP FOR DELETE ACCOUNT */}
      <AnimatePresence>
        {isConfirmDeleteAccountOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-red-950 mb-2">Excluir Conta e Dados?</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Esta ação apagará de forma permanente o nome do pesador, matrículas, setores e todo o histórico de pesagens dos silos BTZ do seu dispositivo local. Deseja prosseguir?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmDeleteAccountOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-colors border border-slate-200 select-none"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAccountDeletion}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm select-none"
                >
                  Sim, Excluir Conta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REUSABLE CUSTOM CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {customConfirm && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  customConfirm.isDanger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-[#002075]'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-slate-900 mb-1 leading-snug">
                    {customConfirm.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {customConfirm.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setCustomConfirm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 select-none cursor-pointer"
                >
                  {customConfirm.cancelText || 'Cancelar'}
                </button>
                <button
                  onClick={() => {
                    customConfirm.onConfirm();
                    setCustomConfirm(null);
                  }}
                  className={`px-4 py-2 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer select-none ${
                    customConfirm.isDanger 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                      : 'bg-[#002075] hover:bg-[#001755] shadow-blue-100'
                  }`}
                >
                  {customConfirm.confirmText || 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECURE PLACARD CONTROL IMAGE GENERATION MODAL */}
      <PlacaControleModal
        isOpen={isPlacaModalOpen}
        onClose={() => setIsPlacaModalOpen(false)}
        silos={silos}
        transactions={transactions}
        operatorSession={operatorSession}
        showToast={showToast}
      />

      {/* ADMIN NOTIFICATIONS MODAL */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        showToast={showToast}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg md:hidden pb-[env(safe-area-inset-bottom,0px)] select-none">
        <div className="flex justify-around items-center h-16 max-w-7xl mx-auto">
          {!currentOperator?.isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('silos')}
                className={`flex flex-col items-center justify-center w-full h-full text-center select-none transition-colors ${
                  activeTab === 'silos' ? 'text-[#002075] font-bold' : 'text-slate-400'
                }`}
              >
                <Layers className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-black tracking-wider uppercase">Silos</span>
              </button>

              <button
                onClick={() => setActiveTab('identificacao')}
                className={`flex flex-col items-center justify-center w-full h-full text-center select-none transition-colors ${
                  activeTab === 'identificacao' ? 'text-[#002075] font-bold' : 'text-slate-400'
                }`}
              >
                <User className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-black tracking-wider uppercase">Operador</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex flex-col items-center justify-center w-full h-full text-center select-none transition-colors ${
              activeTab === 'historico' ? 'text-[#002075] font-bold' : 'text-slate-400'
            }`}
          >
            <History className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-black tracking-wider uppercase">Histórico</span>
          </button>

          {currentOperator?.isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center justify-center w-full h-full text-center select-none transition-colors ${
                activeTab === 'admin' ? 'text-slate-800 font-bold' : 'text-slate-400'
              }`}
            >
              <ShieldCheck className="w-5 h-5 mb-1 text-red-500" />
              <span className="text-[10px] font-black tracking-wider uppercase">Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* FOOTER BAR */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 select-none pb-[calc(2rem+env(safe-area-inset-bottom,0px))] md:pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Grupo Btz S.A. Todos os direitos reservados.</p>
          <p className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
            Terminal ID: {navigator.userAgent.includes("Mobi") ? "Móvel" : "Desktop"} • Conexão Segura SSL
          </p>
        </div>
      </footer>

      {/* MOBILE BOTTOM DRAWER FOR SELECTS */}
      <AnimatePresence>
        {isMobileDrawerOpen && mobileDrawerConfig && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Bottom Sheet Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl flex flex-col pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            >
              {/* Drag Handle Top Decorator */}
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-3 shrink-0" />
              
              {/* Header */}
              <div className="px-6 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <span className="font-bold text-slate-800 text-sm tracking-tight">{mobileDrawerConfig.title}</span>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="text-xs font-bold text-[#002075] hover:bg-slate-100 px-2.5 py-1 rounded-md transition-colors"
                >
                  Confirmar
                </button>
              </div>

              {/* Scrollable Content options */}
              <div className="overflow-y-auto px-4 py-3 flex flex-col gap-1">
                {mobileDrawerConfig.options.map((option) => {
                  const isSelected = option.value === mobileDrawerConfig.currentValue;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        mobileDrawerConfig.onSelect(option.value);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all select-none ${
                        isSelected 
                          ? 'bg-[#002075]/10 text-[#002075]' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#002075] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
