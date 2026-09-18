import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Clock,
  Compass,
  FileSpreadsheet,
  GraduationCap,
  Layers,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { AppView, SmartNotification, UserProfile } from '../types';
import { countryLabel } from '../data/countries';
import { formatExamScoreShort } from '../lib/scoring';
import { formatUSD } from '../lib/ui';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  profile: UserProfile;
  notifications: SmartNotification[];
  onNotificationClick: (notif: SmartNotification) => void;
  onMarkAllNotificationsRead: () => void;
  comparisonCount: number;
  progressPercent: number;
}

const NOTIFICATION_ICON: Record<SmartNotification['type'], ReactNode> = {
  deadline: <Clock className="w-3.5 h-3.5" />,
  scholarship: <Sparkles className="w-3.5 h-3.5" />,
  insight: <Activity className="w-3.5 h-3.5" />,
  achievement: <CheckCircle2 className="w-3.5 h-3.5" />,
};

const NOTIFICATION_TONE: Record<SmartNotification['type'], string> = {
  deadline: 'bg-rose-100 text-rose-600',
  scholarship: 'bg-emerald-100 text-emerald-600',
  insight: 'bg-indigo-100 text-indigo-600',
  achievement: 'bg-teal-100 text-teal-600',
};

export function Header({
  currentView,
  onNavigate,
  profile,
  notifications,
  onNotificationClick,
  onMarkAllNotificationsRead,
  comparisonCount,
  progressPercent,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Закрытие выпадающего списка кликом вне и клавишей Escape.
  useEffect(() => {
    if (!notifOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notifOpen]);

  const navItems: { view: AppView; label: string; icon: ReactNode; badge?: string | number }[] = [
    { view: 'dashboard', label: 'Обзор', icon: <Layers className="w-4 h-4" /> },
    { view: 'questionnaire', label: 'Анкета', icon: <GraduationCap className="w-4 h-4" /> },
    { view: 'diagnosis', label: 'Диагностика', icon: <Activity className="w-4 h-4" /> },
    { view: 'universities', label: 'Университеты', icon: <Compass className="w-4 h-4" /> },
    {
      view: 'comparison',
      label: 'Сравнение',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      badge: comparisonCount > 0 ? comparisonCount : undefined,
    },
    {
      view: 'roadmap',
      label: 'Маршрут',
      icon: <CheckSquare className="w-4 h-4" />,
      badge: `${progressPercent}%`,
    },
  ];

  const profileSummary = [
    profile.name,
    `${profile.age} лет`,
    profile.preferredCountries.map(countryLabel).join(' / ') || 'страны не выбраны',
    formatExamScoreShort(profile),
    `${formatUSD(profile.annualBudgetUSD)}/год`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Контекстная строка: с каким профилем сейчас работает сервис */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline text-slate-500 shrink-0">Профиль:</span>
          <span className="truncate text-slate-200 font-medium">{profileSummary}</span>
        </div>

        <button
          onClick={() => onNavigate('questionnaire')}
          className="shrink-0 px-2.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-100 text-[11px] font-medium transition-colors"
        >
          Изменить
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Логотип */}
          <button
            className="flex items-center gap-2.5 min-w-0 shrink-0"
            onClick={() => onNavigate('landing')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="text-left min-w-0">
              <span className="block text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                Pathora
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 truncate">
                Персональный маршрут поступления
              </span>
            </div>
          </button>

          {/* Навигация (десктоп) */}
          <nav className="hidden xl:flex items-center gap-0.5 min-w-0">
            {navItems.map(item => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-full ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Уведомления и мобильное меню */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                aria-expanded={notifOpen}
                aria-haspopup="true"
                aria-label={`Уведомления${unreadCount > 0 ? `, непрочитанных: ${unreadCount}` : ''}`}
                className={`relative p-2 rounded-xl border transition-colors ${
                  notifOpen
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-slate-200 py-3 px-4 z-50">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-2">
                    <span className="text-sm font-bold text-slate-900">Уведомления</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Прочитать все
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-slate-400 text-xs">
                        Пока ничего не требует внимания
                      </p>
                    ) : (
                      notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => {
                            onNotificationClick(notif);
                            setNotifOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-xl transition-colors ${
                            notif.read ? 'hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${NOTIFICATION_TONE[notif.type]}`}
                            >
                              {NOTIFICATION_ICON[notif.type]}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span
                                className={`block text-xs truncate ${
                                  notif.read ? 'text-slate-800 font-semibold' : 'text-indigo-950 font-bold'
                                }`}
                              >
                                {notif.title}
                              </span>
                              <span className="block text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                                {notif.message}
                              </span>
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        onNavigate('roadmap');
                        setNotifOpen(false);
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-indigo-600 inline-flex items-center gap-1"
                    >
                      Все задачи и дедлайны
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="xl:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1.5 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
            Этапы маршрута
          </p>
          {navItems.map(item => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => {
                  onNavigate(item.view);
                  setMobileMenuOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
