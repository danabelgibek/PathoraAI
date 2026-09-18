import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  Info,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AdmissionRoadmap, RoadmapStage, University, UserProfile } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { determineNextBestAction } from '../lib/roadmap';
import { intakeOption } from '../lib/intake';
import { CATEGORY_LABELS, PRIORITY_META, relativeDeadline } from '../lib/ui';

interface Props {
  roadmap: AdmissionRoadmap;
  selectedUniversity: University;
  profile: UserProfile;
  allUniversities: University[];
  onToggleTask: (taskId: string) => void;
  onSelectUniversity: (uni: University) => void;
  onGoToUniversities: () => void;
}

type StatusFilter = 'all' | 'pending' | 'completed';

export function RoadmapView({
  roadmap,
  selectedUniversity,
  profile,
  allUniversities,
  onToggleTask,
  onSelectUniversity,
  onGoToUniversities,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeStageId, setActiveStageId] = useState<string>('all');
  const [collapsedStages, setCollapsedStages] = useState<string[]>([]);

  const intake = intakeOption(profile.targetIntake);
  const nextAction = useMemo(() => determineNextBestAction(roadmap.stages), [roadmap]);

  const allTasks = roadmap.stages.flatMap(s => s.tasks);
  const completedCount = allTasks.filter(t => t.completed).length;

  const visibleStages = useMemo(
    () =>
      roadmap.stages
        .filter(stage => activeStageId === 'all' || stage.id === activeStageId)
        .map(stage => ({
          ...stage,
          tasks: stage.tasks.filter(task => {
            if (statusFilter === 'pending') return !task.completed;
            if (statusFilter === 'completed') return task.completed;
            return true;
          }),
        })),
    [roadmap.stages, activeStageId, statusFilter],
  );

  const toggleStage = (stageId: string) =>
    setCollapsedStages(prev =>
      prev.includes(stageId) ? prev.filter(id => id !== stageId) : [...prev, stageId],
    );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Заголовок и выбор вуза */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              Этап 5 из 5 · Персональный маршрут
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              План поступления в {selectedUniversity.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {selectedUniversity.programName} · {selectedUniversity.countryLabel} · старт{' '}
              {intake.label.toLowerCase()}
            </p>
          </div>

          <div className="w-full lg:w-auto lg:max-w-xs shrink-0">
            <label
              htmlFor="roadmap-uni"
              className="block text-xs text-slate-500 font-medium mb-1"
            >
              Целевой университет
            </label>
            <select
              id="roadmap-uni"
              value={selectedUniversity.id}
              onChange={e => {
                const target = allUniversities.find(u => u.id === e.target.value);
                if (target) onSelectUniversity(target);
              }}
              className="w-full max-w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {allUniversities.map(u => (
                <option key={u.id} value={u.id}>
                  {u.flag} {u.name}
                </option>
              ))}
            </select>
            <button
              onClick={onGoToUniversities}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold mt-1"
            >
              Вернуться к подбору программ
            </button>
          </div>
        </div>

        {/* Следующее лучшее действие */}
        {nextAction ? (
          <section className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold tracking-wide uppercase">
                  <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  Следующий шаг
                </span>
                <span className="text-xs text-indigo-300">
                  Этап {nextAction.stage.stepNumber}: {nextAction.stage.title}
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-bold mt-2">{nextAction.task.title}</h2>

              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                {nextAction.task.description}
              </p>

              <p className="mt-3 p-3 rounded-xl bg-white/10 text-xs text-indigo-100 max-w-2xl leading-relaxed">
                <strong className="font-semibold text-white">Почему это важно сейчас: </strong>
                {nextAction.task.rationale}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 pt-4 border-t border-white/10 text-xs text-indigo-200">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                  {nextAction.task.estimatedTime}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
                  до {nextAction.task.deadlineFormatted} (
                  {relativeDeadline(nextAction.task.deadlineISO)})
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={`px-2 py-0.5 rounded-md border font-semibold ${PRIORITY_META[nextAction.task.priority].badge}`}
                >
                  {PRIORITY_META[nextAction.task.priority].label}
                </span>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => onToggleTask(nextAction.task.id)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs sm:text-sm transition-colors shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  Отметить выполненным
                </button>

                {nextAction.task.sourceUrl && (
                  <a
                    href={nextAction.task.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-white/20 text-indigo-100 hover:bg-white/10 text-xs font-semibold transition-colors"
                  >
                    {nextAction.task.sourceLabel ?? 'Источник'}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-emerald-900 rounded-3xl p-6 text-white text-center shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-300 mx-auto mb-2" aria-hidden="true" />
            <h2 className="text-lg font-bold">Все шаги маршрута отмечены выполненными</h2>
            <p className="text-xs text-emerald-200 mt-1">
              Проверьте статус заявки в личном кабинете {selectedUniversity.name} и следите за
              ответом приёмной комиссии.
            </p>
          </section>
        )}

        {/* Прогресс и фильтры */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Общий прогресс
              </span>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {roadmap.overallProgressPercent}%{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({completedCount} из {allTasks.length} шагов)
                </span>
              </p>
            </div>

            <div
              className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start"
              role="group"
              aria-label="Фильтр задач по статусу"
            >
              {(
                [
                  ['all', `Все (${allTasks.length})`],
                  ['pending', `Осталось (${allTasks.length - completedCount})`],
                  ['completed', `Готово (${completedCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  aria-pressed={statusFilter === key}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    statusFilter === key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${roadmap.overallProgressPercent}%` }}
            />
          </div>

          {/* Переключение этапов */}
          <div className="flex flex-wrap gap-1.5 pt-1" role="group" aria-label="Фильтр по этапу">
            <button
              onClick={() => setActiveStageId('all')}
              aria-pressed={activeStageId === 'all'}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                activeStageId === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Все этапы
            </button>
            {roadmap.stages.map(stage => {
              const done = stage.tasks.filter(t => t.completed).length;
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStageId(stage.id)}
                  aria-pressed={activeStageId === stage.id}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    activeStageId === stage.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {stage.stepNumber}. {stage.title} ({done}/{stage.tasks.length})
                </button>
              );
            })}
          </div>
        </section>

        {/* Этапы и задачи */}
        <div className="space-y-4">
          {visibleStages.map((stage: RoadmapStage) => {
            const isCollapsed = collapsedStages.includes(stage.id);
            const done = stage.tasks.filter(t => t.completed).length;
            const isDone = stage.tasks.length > 0 && done === stage.tasks.length;

            return (
              <section
                key={stage.id}
                className={`bg-white rounded-3xl border overflow-hidden ${
                  isDone ? 'border-emerald-200' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => toggleStage(stage.id)}
                  aria-expanded={!isCollapsed}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : stage.stepNumber}
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm sm:text-base font-bold text-slate-900">
                        {stage.title}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        {stage.subtitle}
                      </span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">
                        {stage.timeWindow}
                      </span>
                    </span>
                  </span>

                  <span className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {done}/{stage.tasks.length}
                    </span>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    )}
                  </span>
                </button>

                {!isCollapsed && (
                  <ul className="border-t border-slate-100 divide-y divide-slate-100 px-4 sm:px-5">
                    {stage.tasks.length === 0 ? (
                      <li className="py-4 text-center text-xs text-slate-400">
                        Нет задач под выбранным фильтром.
                      </li>
                    ) : (
                      stage.tasks.map(task => {
                        const priority = PRIORITY_META[task.priority];
                        return (
                          <li
                            key={task.id}
                            className={`py-3.5 flex items-start gap-3 ${task.completed ? 'opacity-60' : ''}`}
                          >
                            <button
                              onClick={() => onToggleTask(task.id)}
                              aria-pressed={task.completed}
                              aria-label={`${task.completed ? 'Снять отметку' : 'Отметить выполненным'}: ${task.title}`}
                              className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3
                                  className={`text-xs sm:text-sm font-bold ${
                                    task.completed ? 'line-through text-slate-500' : 'text-slate-900'
                                  }`}
                                >
                                  {task.title}
                                </h3>

                                {priority.highlight && !task.completed && (
                                  <span
                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md border ${priority.badge}`}
                                  >
                                    {priority.label}
                                  </span>
                                )}

                                <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md">
                                  {CATEGORY_LABELS[task.category]}
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {task.description}
                              </p>

                              <p className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-1.5 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                <Info
                                  className="w-3 h-3 text-slate-400 shrink-0 mt-0.5"
                                  aria-hidden="true"
                                />
                                <span>
                                  <strong className="font-semibold text-slate-700">
                                    Зачем:{' '}
                                  </strong>
                                  {task.rationale}
                                </span>
                              </p>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" aria-hidden="true" />
                                  {task.estimatedTime}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3" aria-hidden="true" />
                                  до {task.deadlineFormatted} ·{' '}
                                  {relativeDeadline(task.deadlineISO)}
                                </span>
                                {task.sourceUrl && (
                                  <a
                                    href={task.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                                  >
                                    {task.sourceLabel ?? 'Источник'}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </section>
            );
          })}
        </div>

        <DemoDataNotice />
      </div>
    </div>
  );
}
