import { useMemo } from 'react';
import {
  ArrowRight,
  Bell,
  Bookmark,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileSpreadsheet,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  AdmissionRoadmap,
  AppView,
  ProfileDiagnosis,
  SmartNotification,
  University,
  UserProfile,
} from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { determineNextBestAction, upcomingDeadlines } from '../lib/roadmap';
import { intakeOption } from '../lib/intake';
import {
  formatDateRu,
  formatTuition,
  formatUSD,
  MATCH_TIER_LABELS,
  PRIORITY_META,
  readinessTone,
  relativeDeadline,
  scoreTone,
  statusTone,
} from '../lib/ui';

interface Props {
  profile: UserProfile;
  diagnosis: ProfileDiagnosis;
  targetUniversity: University;
  roadmap: AdmissionRoadmap;
  notifications: SmartNotification[];
  comparisonCount: number;
  savedCount: number;
  onNavigate: (view: AppView) => void;
  onToggleTask: (taskId: string) => void;
  onOpenNotification: (notif: SmartNotification) => void;
}

export function DashboardView({
  profile,
  diagnosis,
  targetUniversity,
  roadmap,
  notifications,
  comparisonCount,
  savedCount,
  onNavigate,
  onToggleTask,
  onOpenNotification,
}: Props) {
  const nextAction = useMemo(() => determineNextBestAction(roadmap.stages), [roadmap]);
  const deadlines = useMemo(() => upcomingDeadlines(roadmap.stages, 4), [roadmap]);

  const allTasks = roadmap.stages.flatMap(s => s.tasks);
  const completedCount = allTasks.filter(t => t.completed).length;

  const tierTone = readinessTone(diagnosis.readinessTierId);
  const matchTone = scoreTone(targetUniversity.matchScore);
  const intake = intakeOption(profile.targetIntake);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Приветствие */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              Обзор маршрута
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Маршрут поступления: {profile.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1">{diagnosis.goalStatement}</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('questionnaire')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              Изменить анкету
            </button>

            <button
              onClick={() => onNavigate('roadmap')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              Открыть маршрут
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Диагностика + целевой вуз */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <section className="md:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Готовность профиля
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${tierTone.badge}`}
                >
                  {diagnosis.readinessTier}
                </span>
              </div>

              <p className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900">
                  {diagnosis.overallScore}
                </span>
                <span className="text-xs text-slate-500">из 100</span>
              </p>

              <dl className="mt-4 space-y-1.5 text-xs">
                {Object.values(diagnosis.breakdown).map(item => {
                  const tone = statusTone(item.status);
                  return (
                    <div
                      key={item.title}
                      className="flex justify-between gap-2 py-1 border-b border-slate-100 last:border-0"
                    >
                      <dt className="text-slate-500 truncate">{item.title}</dt>
                      <dd className={`font-bold shrink-0 ${tone.text}`}>{item.score}/100</dd>
                    </div>
                  );
                })}
              </dl>
            </div>

            <button
              onClick={() => onNavigate('diagnosis')}
              className="mt-5 pt-3 border-t border-slate-100 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Подробный отчёт
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </section>

          <section className="md:col-span-8 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                    {targetUniversity.logoText}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {targetUniversity.name} <span aria-hidden="true">{targetUniversity.flag}</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Целевой вуз маршрута · {targetUniversity.city},{' '}
                      {targetUniversity.countryLabel}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-bold ${matchTone.badge}`}
                  >
                    {targetUniversity.matchScore}%
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {targetUniversity.matchTier}
                  </span>
                </div>
              </div>

              <dl className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                <div>
                  <dt className="sr-only">Программа</dt>
                  <dd className="font-semibold text-slate-800">
                    {targetUniversity.programName}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
                  <span>
                    Обучение:{' '}
                    <strong className="text-slate-800">
                      {formatTuition(targetUniversity.tuitionAnnualUSD)}
                    </strong>
                  </span>
                  <span>
                    Твой бюджет:{' '}
                    <strong className="text-slate-800">
                      {formatUSD(profile.annualBudgetUSD)} / год
                    </strong>
                  </span>
                  {targetUniversity.deadlines[0] && (
                    <span>
                      Дедлайн:{' '}
                      <strong className="text-indigo-700">
                        {formatDateRu(targetUniversity.deadlines[0].date)}
                      </strong>
                    </span>
                  )}
                </div>
              </dl>

              <p className="mt-3 text-xs text-slate-600">
                <strong className="text-slate-800">Почему подходит: </strong>
                {targetUniversity.matchReasons.find(r => r.status === 'positive')?.text ??
                  targetUniversity.matchReasons[0]?.text}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {MATCH_TIER_LABELS[targetUniversity.matchTier]}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => onNavigate('universities')}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
              >
                Выбрать другой университет →
              </button>

              <button
                onClick={() => onNavigate('roadmap')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                План для этого вуза
              </button>
            </div>
          </section>
        </div>

        {/* Следующий шаг + прогресс */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <section className="md:col-span-7 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col justify-between">
            {nextAction ? (
              <div>
                <span className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
                  Следующий шаг
                </span>

                <h2 className="text-base sm:text-lg font-bold">{nextAction.task.title}</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {nextAction.task.rationale}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-xs text-indigo-200">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                    {nextAction.task.estimatedTime}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
                    до {nextAction.task.deadlineFormatted}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md border font-semibold ${PRIORITY_META[nextAction.task.priority].badge}`}
                  >
                    {PRIORITY_META[nextAction.task.priority].label}
                  </span>
                </div>

                <button
                  onClick={() => onToggleTask(nextAction.task.id)}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  Отметить выполненным
                </button>
              </div>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" aria-hidden="true" />
                <h2 className="font-bold">Все шаги отмечены выполненными</h2>
              </div>
            )}
          </section>

          <section className="md:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Прогресс маршрута
                </h2>
                <span className="text-xs font-bold text-indigo-600">
                  {completedCount} / {allTasks.length}
                </span>
              </div>

              <p className="text-2xl font-extrabold text-slate-900">
                {roadmap.overallProgressPercent}%
              </p>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${roadmap.overallProgressPercent}%` }}
                />
              </div>

              <ul className="space-y-1 text-xs text-slate-600">
                {roadmap.stages.map(stage => (
                  <li key={stage.id} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="truncate">
                      {stage.stepNumber}. {stage.title}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {stage.tasks.filter(t => t.completed).length}/{stage.tasks.length}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => onNavigate('roadmap')}
              className="mt-4 pt-3 border-t border-slate-100 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              Открыть чек-лист
            </button>
          </section>
        </div>

        {/* Дедлайны, уведомления, быстрый доступ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
              <Calendar className="w-4 h-4 text-indigo-600" aria-hidden="true" />
              Ближайшие дедлайны
            </h2>

            {deadlines.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Все шаги выполнены — открытых дедлайнов нет.
              </p>
            ) : (
              <ul className="space-y-2">
                {deadlines.map(task => (
                  <li
                    key={task.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                      {task.title}
                    </p>
                    <p className="flex items-center justify-between gap-2 mt-1 text-[11px]">
                      <span className="text-indigo-700 font-bold">
                        {task.deadlineFormatted}
                      </span>
                      <span className="text-slate-400">
                        {relativeDeadline(task.deadlineISO)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Bell className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                Уведомления
              </h2>
              <span className="text-xs text-slate-400 shrink-0">
                {notifications.filter(n => !n.read).length} новых
              </span>
            </div>

            <ul className="space-y-2">
              {notifications.slice(0, 3).map(n => (
                <li key={n.id}>
                  <button
                    onClick={() => onOpenNotification(n)}
                    className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-100 transition-colors"
                  >
                    <span className="block text-xs font-bold text-slate-900">{n.title}</span>
                    <span className="block text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                      {n.message}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">Быстрый доступ</h2>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <button
                  onClick={() => onNavigate('comparison')}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600 mb-2" aria-hidden="true" />
                  <span className="block font-bold text-slate-900">В сравнении</span>
                  <span className="block text-slate-500 mt-0.5">{comparisonCount} программ</span>
                </button>

                <button
                  onClick={() => onNavigate('universities')}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition-colors"
                >
                  <Bookmark className="w-5 h-5 text-amber-500 mb-2" aria-hidden="true" />
                  <span className="block font-bold text-slate-900">Избранное</span>
                  <span className="block text-slate-500 mt-0.5">{savedCount} программ</span>
                </button>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                Старт обучения: <strong className="text-slate-700">{intake.label}</strong>.
                Прогресс и анкета сохраняются в браузере и переживают перезагрузку.
              </p>
            </div>

            <DemoDataNotice compact className="mt-4" />
          </section>
        </div>
      </div>
    </div>
  );
}
