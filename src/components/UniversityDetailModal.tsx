import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CheckSquare,
  DollarSign,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';
import { University, UserProfile } from '../types';
import { checkLanguage, normalizeGpaTo5 } from '../lib/scoring';
import {
  formatDateRu,
  formatTuition,
  formatUSD,
  MATCH_TIER_LABELS,
  reasonStyle,
  relativeDeadline,
  scoreTone,
} from '../lib/ui';
import { DemoDataNotice } from './DemoDataNotice';

interface Props {
  university: University | null;
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSelectForRoadmap: (uni: University) => void;
  isCompared: boolean;
  onToggleComparison: (uniId: string) => void;
}

type TabId = 'overview' | 'requirements' | 'finances' | 'deadlines' | 'documents';

const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'overview', label: 'Обзор', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'requirements', label: 'Требования', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: 'finances', label: 'Стоимость', icon: <DollarSign className="w-3.5 h-3.5" /> },
  { id: 'deadlines', label: 'Дедлайны', icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'documents', label: 'Документы', icon: <FileText className="w-3.5 h-3.5" /> },
];

export function UniversityDetailModal({
  university,
  profile,
  isOpen,
  onClose,
  onSelectForRoadmap,
  isCompared,
  onToggleComparison,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const closeRef = useRef<HTMLButtonElement>(null);

  // Закрытие по Escape и блокировка прокрутки страницы под модальным окном.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) setActiveTab('overview');
  }, [isOpen, university?.id]);

  if (!isOpen || !university) return null;

  const lang = checkLanguage(profile, university.requirements);
  const gpa5 = normalizeGpaTo5(profile.gpa, profile.gpaScale);
  const gpaMin = university.requirements.gpaMin5;
  const tone = scoreTone(university.matchScore);

  const languageVerdict = {
    not_taken: { text: 'Сертификат не получен', className: 'text-amber-700' },
    below: { text: 'Ниже порога — нужна пересдача', className: 'text-rose-700' },
    meets: { text: 'Проходит порог', className: 'text-emerald-700' },
    exceeds: { text: 'Выше порога — преимущество', className: 'text-emerald-700' },
  }[lang.verdict];

  const academicVerdict =
    gpa5 >= gpaMin + 0.3
      ? { text: 'Уверенно выше порога', className: 'text-emerald-700' }
      : gpa5 >= gpaMin
        ? { text: 'Проходит порог', className: 'text-emerald-700' }
        : gpa5 >= gpaMin - 0.3
          ? { text: 'Чуть ниже порога', className: 'text-amber-700' }
          : { text: 'Заметно ниже порога', className: 'text-rose-700' };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Подробно: ${university.name}`}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
              {university.logoText}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="truncate">{university.name}</span>
                <span aria-hidden="true">{university.flag}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {university.city}, {university.countryLabel} · QS World #{university.rankingGlobal}
              </p>
              <span
                className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full border text-xs font-bold ${tone.badge}`}
              >
                {university.matchScore}% — {tone.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleComparison(university.id)}
              className={`p-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                isCompared
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">{isCompared ? 'В сравнении' : 'К сравнению'}</span>
            </button>

            <button
              ref={closeRef}
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-slate-200 px-3 sm:px-6 bg-white overflow-x-auto text-xs font-semibold">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {activeTab === 'overview' && (
            <>
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <p className="flex items-center gap-2 text-indigo-950 font-bold mb-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  Разбор соответствия для профиля {profile.name}
                </p>
                <ul className="space-y-2 text-xs">
                  {university.matchReasons.map((reason, idx) => {
                    const style = reasonStyle(reason.status);
                    return (
                      <li key={idx} className="flex items-start gap-2 text-slate-800">
                        <span className={`font-bold shrink-0 ${style.className}`} aria-hidden="true">
                          {style.symbol}
                        </span>
                        <span>{reason.text}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 pt-2.5 border-t border-indigo-200/60 text-[11px] text-indigo-900">
                  Итог: {MATCH_TIER_LABELS[university.matchTier]}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">О программе</h4>
                <p className="text-xs text-slate-600 mb-3">{university.programHighlight}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    ['Программа', university.programName],
                    ['Язык преподавания', university.languageOfInstruction],
                    ['Платформа подачи', university.applicationPlatform],
                    ['Рейтинг по направлению', `#${university.rankingSubject} в мире (QS)`],
                  ].map(([label, value]) => (
                    <div key={label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block">{label}:</span>
                      <span className="font-semibold text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {university.potentialConcerns.length > 0 && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200">
                  <p className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                    Сложности и риски
                  </p>
                  <ul className="space-y-1.5 text-xs text-amber-950">
                    {university.potentialConcerns.map((concern, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold shrink-0" aria-hidden="true">•</span>
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {activeTab === 'requirements' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                    Язык
                  </h4>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
                      <dt className="text-slate-500">Порог ({lang.examLabel}):</dt>
                      <dd className="font-bold text-slate-800">от {lang.required}</dd>
                    </div>
                    <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
                      <dt className="text-slate-500">Твой результат:</dt>
                      <dd className="font-bold text-slate-800">
                        {lang.userScore === null ? 'нет' : lang.userScore}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 py-1">
                      <dt className="text-slate-500">Статус:</dt>
                      <dd className={`font-bold ${languageVerdict.className}`}>
                        {languageVerdict.text}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                    Успеваемость
                  </h4>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
                      <dt className="text-slate-500">Порог вуза:</dt>
                      <dd className="font-bold text-slate-800">{gpaMin} из 5</dd>
                    </div>
                    <div className="flex justify-between gap-2 py-1 border-b border-slate-200/60">
                      <dt className="text-slate-500">Твой балл:</dt>
                      <dd className="font-bold text-slate-800">
                        {profile.gpa} из {profile.gpaScale}
                        {profile.gpaScale !== 5 && (
                          <span className="font-normal text-slate-500"> (≈ {gpa5.toFixed(2)} из 5)</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 py-1">
                      <dt className="text-slate-500">Статус:</dt>
                      <dd className={`font-bold ${academicVerdict.className}`}>
                        {academicVerdict.text}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Обязательные пререквизиты
                </h4>
                <ul className="space-y-2">
                  {university.requirements.prerequisites.map((prereq, idx) => (
                    <li
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 text-xs text-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                      {prereq}
                    </li>
                  ))}
                  {university.requirements.satRequired && (
                    <li className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                      SAT обязателен
                      {university.requirements.satRecommendedScore
                        ? ` (рекомендуемый балл от ${university.requirements.satRecommendedScore})`
                        : ''}
                    </li>
                  )}
                </ul>
              </div>

              <DemoDataNotice />
            </>
          )}

          {activeTab === 'finances' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  ['Обучение', formatTuition(university.tuitionAnnualUSD)],
                  ['Семестровый взнос', `${formatUSD(university.semesterFeeUSD)} / семестр`],
                  ['Проживание', `≈ ${formatUSD(university.livingCostAnnualUSD)} / год`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center"
                  >
                    <span className="text-[11px] text-slate-400 block font-medium">{label}</span>
                    <span className="text-base font-bold text-slate-900 mt-1 block">{value}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-700">
                Полная стоимость первого года —{' '}
                <strong>
                  {formatUSD(university.tuitionAnnualUSD + university.livingCostAnnualUSD)}
                </strong>
                . Твой бюджет: <strong>{formatUSD(profile.annualBudgetUSD)}</strong> в год
                {university.tuitionAnnualUSD + university.livingCostAnnualUSD >
                profile.annualBudgetUSD
                  ? ` — не хватает ${formatUSD(university.tuitionAnnualUSD + university.livingCostAnnualUSD - profile.annualBudgetUSD)}, разницу закрывают стипендия или подработка.`
                  : ' — полная стоимость укладывается в бюджет.'}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5">
                  Стипендиальные программы
                </h4>
                <div className="space-y-2.5">
                  {university.scholarshipOpportunities.map((schol, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h5 className="font-bold text-emerald-950 text-xs sm:text-sm">
                          {schol.name}
                        </h5>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200/70 text-emerald-800 rounded-full">
                          Дедлайн: {schol.applicationDeadline}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-emerald-700 mt-1">
                        {schol.coverage}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{schol.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <DemoDataNotice />
            </>
          )}

          {activeTab === 'deadlines' && (
            <>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Платформа подачи:
                </span>
                <span className="text-sm font-bold text-indigo-700">
                  {university.applicationPlatform}
                </span>
              </div>

              <div className="space-y-2.5">
                {university.deadlines.map((dl, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-2xl border border-slate-200 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {dl.roundName}
                        </span>
                        {dl.isUrgent && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-md">
                            Критично
                          </span>
                        )}
                      </div>
                      {dl.note && <p className="text-xs text-slate-500 mt-1">{dl.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs sm:text-sm font-extrabold text-indigo-700">
                        {formatDateRu(dl.date)}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {relativeDeadline(dl.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <DemoDataNotice />
            </>
          )}

          {activeTab === 'documents' && (
            <>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Пакет документов для подачи
              </h4>
              <ul className="space-y-2">
                {university.documentsRequired.map((doc, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-800"
                  >
                    <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" aria-hidden="true" />
                    {doc}
                  </li>
                ))}
              </ul>
              <DemoDataNotice />
            </>
          )}
        </div>

        {/* Подвал */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <a
            href={university.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Источник: официальная страница программы
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              Закрыть
            </button>
            <button
              onClick={() => {
                onSelectForRoadmap(university);
                onClose();
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              Построить маршрут
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
