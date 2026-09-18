import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  Search,
  Sparkles,
} from 'lucide-react';
import { University, UserProfile } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { catalogCoverage, splitByPreference } from '../lib/matching';
import { formatExamScore } from '../lib/scoring';
import {
  formatDateRu,
  formatTuition,
  formatUSD,
  MATCH_TIER_LABELS,
  reasonStyle,
  relativeDeadline,
  scoreTone,
} from '../lib/ui';

interface Props {
  universities: University[];
  profile: UserProfile;
  selectedUniId: string;
  onSelectForRoadmap: (uni: University) => void;
  onOpenDetails: (uni: University) => void;
  comparisonList: string[];
  onToggleComparison: (uniId: string) => void;
  savedList: string[];
  onToggleSave: (uniId: string) => void;
  onGoToComparison: () => void;
  onEditProfile: () => void;
}

type SortKey = 'match' | 'tuition' | 'deadline';

export function RecommendationsView({
  universities,
  profile,
  selectedUniId,
  onSelectForRoadmap,
  onOpenDetails,
  comparisonList,
  onToggleComparison,
  savedList,
  onToggleSave,
  onGoToComparison,
  onEditProfile,
}: Props) {
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [budgetOnly, setBudgetOnly] = useState(false);
  const [englishOnly, setEnglishOnly] = useState(false);
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('match');

  const coverage = useMemo(
    () => catalogCoverage(profile, universities),
    [profile, universities],
  );

  const countries = useMemo(
    () => Array.from(new Set(universities.map(u => u.countryLabel))).sort(),
    [universities],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return universities
      .filter(uni => {
        if (country !== 'all' && uni.countryLabel !== country) return false;
        if (budgetOnly && uni.tuitionAnnualUSD > profile.annualBudgetUSD) return false;
        if (englishOnly && !uni.englishOnly) return false;
        if (scholarshipOnly && !uni.scholarshipOpportunities.some(s => s.available)) return false;
        if (savedOnly && !savedList.includes(uni.id)) return false;
        if (query) {
          const haystack =
            `${uni.name} ${uni.programName} ${uni.city} ${uni.countryLabel}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'tuition') return a.tuitionAnnualUSD - b.tuitionAnnualUSD;
        if (sortBy === 'deadline') {
          const aDate = a.deadlines[0]?.date ?? '9999-12-31';
          const bDate = b.deadlines[0]?.date ?? '9999-12-31';
          return aDate.localeCompare(bDate);
        }
        return b.matchScore - a.matchScore;
      });
  }, [
    universities,
    search,
    country,
    budgetOnly,
    englishOnly,
    scholarshipOnly,
    savedOnly,
    sortBy,
    profile.annualBudgetUSD,
    savedList,
  ]);

  const { preferred, alternatives } = splitByPreference(filtered);

  const resetFilters = () => {
    setSearch('');
    setCountry('all');
    setBudgetOnly(false);
    setEnglishOnly(false);
    setScholarshipOnly(false);
    setSavedOnly(false);
  };

  const renderCard = (uni: University) => {
    const tone = scoreTone(uni.matchScore);
    const isCompared = comparisonList.includes(uni.id);
    const isSaved = savedList.includes(uni.id);
    const isTarget = selectedUniId === uni.id;
    const nearestDeadline = uni.deadlines[0];

    return (
      <article
        key={uni.id}
        className={`bg-white rounded-3xl border flex flex-col overflow-hidden transition-shadow hover:shadow-md ${
          isTarget ? 'border-indigo-600 ring-2 ring-indigo-600/25' : 'border-slate-200'
        }`}
      >
        {isTarget && (
          <p className="bg-indigo-600 text-white text-[11px] font-bold px-4 py-1 text-center flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Целевой вуз твоего маршрута
          </p>
        )}

        <div className="p-5 space-y-4 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {uni.logoText}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {uni.name} <span aria-hidden="true">{uni.flag}</span>
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {uni.city}, {uni.countryLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span
                className={`px-2.5 py-1 rounded-full border text-xs font-bold ${tone.badge}`}
              >
                {uni.matchScore}%
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">{uni.matchTier}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              {uni.degree === 'foundation' ? 'Подготовительная программа' : 'Программа бакалавриата'}
            </span>
            <h4 className="text-sm font-bold text-slate-900 mt-0.5">{uni.programName}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{uni.languageOfInstruction}</p>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <dt className="text-[10px] text-slate-400 font-medium">Обучение / год</dt>
              <dd className="font-bold text-slate-900 mt-0.5">
                {formatTuition(uni.tuitionAnnualUSD)}
              </dd>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <dt className="text-[10px] text-slate-400 font-medium">Языковой порог</dt>
              <dd className="font-bold text-slate-900 mt-0.5">
                IELTS {uni.requirements.ieltsMin} / TOEFL {uni.requirements.toeflMin}
              </dd>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <dt className="text-[10px] text-slate-400 font-medium">Ближайший дедлайн</dt>
              <dd className="font-bold text-indigo-700 mt-0.5">
                {nearestDeadline ? formatDateRu(nearestDeadline.date) : 'уточняется'}
                {nearestDeadline && (
                  <span className="block text-[10px] font-normal text-slate-400">
                    {relativeDeadline(nearestDeadline.date)}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
            <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              Почему подходит твоему профилю
            </p>
            <ul className="space-y-1.5 text-xs">
              {uni.matchReasons.map((reason, idx) => {
                const style = reasonStyle(reason.status);
                return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className={`font-bold shrink-0 mt-0.5 ${style.className}`} aria-hidden="true">
                      {style.symbol}
                    </span>
                    <span className="text-slate-700 leading-snug">{reason.text}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2.5 pt-2 border-t border-indigo-200/60 text-[11px] text-indigo-900">
              {MATCH_TIER_LABELS[uni.matchTier]}
            </p>
          </div>

          {uni.scholarshipOpportunities[0]?.available && (
            <p className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {uni.scholarshipOpportunities[0].name} —{' '}
                {uni.scholarshipOpportunities[0].coverage}
              </span>
            </p>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 space-y-2.5">
          <a
            href={uni.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            Источник: официальная страница программы
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleComparison(uni.id)}
                aria-pressed={isCompared}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  isCompared
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {isCompared ? 'В сравнении' : 'К сравнению'}
              </button>

              <button
                onClick={() => onToggleSave(uni.id)}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'Убрать из избранного' : 'Сохранить в избранное'}
                className={`p-1.5 rounded-xl border transition-colors ${
                  isSaved
                    ? 'bg-amber-50 border-amber-300 text-amber-600'
                    : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenDetails(uni)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-white transition-colors"
              >
                Подробнее
              </button>

              <button
                onClick={() => onSelectForRoadmap(uni)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors"
              >
                Построить маршрут
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-28">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Заголовок */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              Этап 3 из 5 · Подбор программ
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Рекомендованные программы
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Подобрано по профилю {profile.name}: средний балл {profile.gpa} из{' '}
              {profile.gpaScale}, {formatExamScore(profile)}, бюджет{' '}
              {formatUSD(profile.annualBudgetUSD)} в год.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <DemoDataNotice compact />
            <button
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Изменить ответы анкеты
            </button>
          </div>
        </div>

        {/* Честное предупреждение об охвате базы */}
        {(coverage.missingCountries.length > 0 || !coverage.fieldCovered) && (
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-bold">Демо-база покрывает не весь твой запрос</p>
              {coverage.missingCountries.length > 0 && (
                <p>
                  Программ в выбранных странах ({coverage.missingCountries.join(', ')}) в базе
                  нет. Ниже показаны ближайшие альтернативы в других странах — они помечены
                  отдельно.
                </p>
              )}
              {!coverage.fieldCovered && (
                <p>
                  Направление «{profile.targetField}» в базе не представлено: собраны только
                  инженерные и IT-программы. Подбор ниже показывает их честно, с пометкой о
                  несовпадении направления.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Фильтры */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Вуз, программа или город"
                aria-label="Поиск по программам"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              aria-label="Фильтр по стране"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="all">Все страны в базе ({countries.length})</option>
              {countries.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              aria-label="Сортировка"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-700"
            >
              <option value="match">Сортировка: по соответствию профилю</option>
              <option value="tuition">Сортировка: по стоимости обучения</option>
              <option value="deadline">Сортировка: по ближайшему дедлайну</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  [
                    budgetOnly,
                    setBudgetOnly,
                    `В рамках бюджета (${formatUSD(profile.annualBudgetUSD)})`,
                  ],
                  [englishOnly, setEnglishOnly, '100% на английском'],
                  [scholarshipOnly, setScholarshipOnly, 'Со стипендиями'],
                  [savedOnly, setSavedOnly, `Избранное (${savedList.length})`],
                ] as const
              ).map(([active, setter, label]) => (
                <button
                  key={label}
                  onClick={() => setter(!active)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="text-slate-500">
              Найдено: <strong className="text-slate-800">{filtered.length}</strong> из{' '}
              {universities.length}
            </span>
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 max-w-lg mx-auto space-y-4">
            <span className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Ни одна программа не подходит под фильтры
            </h2>
            <p className="text-xs text-slate-500">
              Попробуйте снять ограничение по бюджету или языку преподавания.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            {preferred.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold text-slate-900">
                  В выбранных странах
                  <span className="ml-2 font-normal text-slate-500">
                    {preferred.length}{' '}
                    {preferred.length === 1 ? 'программа' : 'программ'}
                  </span>
                </h2>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {preferred.map(renderCard)}
                </div>
              </section>
            )}

            {alternatives.length > 0 && (
              <section className="space-y-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Альтернативы в других странах
                    <span className="ml-2 font-normal text-slate-500">
                      {alternatives.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Эти страны не выбраны в анкете. Показываем их, чтобы выбор не сузился до
                    одного варианта — соответствие профилю посчитано по тем же правилам.
                  </p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {alternatives.map(renderCard)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Панель сравнения */}
      {comparisonList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs min-w-0">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
            <span className="truncate">
              К сравнению: <strong>{comparisonList.length}</strong>
            </span>
          </span>

          <button
            onClick={onGoToComparison}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            Открыть
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
