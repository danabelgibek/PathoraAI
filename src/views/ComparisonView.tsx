import { ReactNode } from 'react';
import { ArrowRight, ExternalLink, FileSpreadsheet, Plus, Sparkles, X } from 'lucide-react';
import { University, UserProfile } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { checkLanguage, normalizeGpaTo5 } from '../lib/scoring';
import {
  formatDateRu,
  formatTuition,
  formatUSD,
  relativeDeadline,
  scoreTone,
} from '../lib/ui';

interface Props {
  comparedUniversities: University[];
  profile: UserProfile;
  onRemoveFromComparison: (uniId: string) => void;
  onSelectForRoadmap: (uni: University) => void;
  onGoToUniversities: () => void;
}

interface Row {
  label: string;
  render: (uni: University) => ReactNode;
}

export function ComparisonView({
  comparedUniversities,
  profile,
  onRemoveFromComparison,
  onSelectForRoadmap,
  onGoToUniversities,
}: Props) {
  const gpa5 = normalizeGpaTo5(profile.gpa, profile.gpaScale);

  if (comparedUniversities.length < 2) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm space-y-5">
          <span className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8" aria-hidden="true" />
          </span>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Сравнение программ
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              {comparedUniversities.length === 0
                ? 'Добавьте минимум две программы из подбора — Pathora сопоставит стоимость, требования, дедлайны и стипендии в одной таблице.'
                : 'Выбрана одна программа. Добавьте ещё хотя бы одну, чтобы увидеть сравнение.'}
            </p>
          </div>

          {comparedUniversities.length === 1 && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-700">
              Уже в сравнении: <strong>{comparedUniversities[0].name}</strong>
            </div>
          )}

          <button
            onClick={onGoToUniversities}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Выбрать программы для сравнения
          </button>
        </div>
      </div>
    );
  }

  const rows: Row[] = [
    {
      label: 'Программа',
      render: uni => <span className="font-semibold text-slate-900">{uni.programName}</span>,
    },
    {
      label: 'Язык преподавания',
      render: uni => uni.languageOfInstruction,
    },
    {
      label: 'Стоимость обучения',
      render: uni => {
        const fits = uni.tuitionAnnualUSD <= profile.annualBudgetUSD;
        const diff = uni.tuitionAnnualUSD - profile.annualBudgetUSD;
        return (
          <>
            <span className="block font-bold text-slate-900">
              {formatTuition(uni.tuitionAnnualUSD)}
            </span>
            <span
              className={`block text-[11px] mt-0.5 font-medium ${
                fits ? 'text-emerald-600' : 'text-amber-700'
              }`}
            >
              {fits
                ? `Укладывается в бюджет ${formatUSD(profile.annualBudgetUSD)}`
                : `Выше бюджета на ${formatUSD(diff)}`}
            </span>
          </>
        );
      },
    },
    {
      label: 'Проживание',
      render: uni => `≈ ${formatUSD(uni.livingCostAnnualUSD)} / год`,
    },
    {
      label: 'Полная стоимость года',
      render: uni => {
        const total = uni.tuitionAnnualUSD + uni.livingCostAnnualUSD;
        const covered = total <= profile.annualBudgetUSD;
        return (
          <>
            <span className="block font-bold text-slate-900">{formatUSD(total)}</span>
            <span
              className={`block text-[11px] mt-0.5 ${
                covered ? 'text-emerald-600' : 'text-amber-700'
              }`}
            >
              {covered
                ? 'Полностью покрывается бюджетом'
                : `Не хватает ${formatUSD(total - profile.annualBudgetUSD)}`}
            </span>
          </>
        );
      },
    },
    {
      label: 'Стипендии',
      render: uni => {
        const schol = uni.scholarshipOpportunities.find(s => s.available);
        if (!schol) return <span className="text-slate-400">Не заявлены</span>;
        return (
          <>
            <span className="block font-bold text-emerald-800">{schol.name}</span>
            <span className="block text-xs text-slate-600 mt-0.5">{schol.coverage}</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              Дедлайн: {schol.applicationDeadline}
            </span>
          </>
        );
      },
    },
    {
      label: 'Языковой порог',
      render: uni => {
        const lang = checkLanguage(profile, uni.requirements);
        const verdict = {
          not_taken: {
            text: 'Экзамен не сдан — сравнить не с чем',
            className: 'text-amber-700',
          },
          below: {
            text: `Твой результат ${lang.userScore} ниже порога`,
            className: 'text-rose-600',
          },
          meets: { text: `Твой результат ${lang.userScore} проходит`, className: 'text-emerald-600' },
          exceeds: {
            text: `Твой результат ${lang.userScore} выше порога`,
            className: 'text-emerald-600',
          },
        }[lang.verdict];

        return (
          <>
            <span className="block font-bold text-slate-900">
              {lang.examLabel} от {lang.required}
            </span>
            <span className={`block text-[11px] mt-0.5 font-medium ${verdict.className}`}>
              {verdict.text}
            </span>
          </>
        );
      },
    },
    {
      label: 'Порог по среднему баллу',
      render: uni => {
        const min = uni.requirements.gpaMin5;
        const passes = gpa5 >= min;
        return (
          <>
            <span className="block font-bold text-slate-900">от {min} из 5</span>
            <span
              className={`block text-[11px] mt-0.5 font-medium ${
                passes ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              У тебя {gpa5.toFixed(2)} из 5 — {passes ? 'проходит' : 'ниже порога'}
            </span>
          </>
        );
      },
    },
    {
      label: 'Ближайший дедлайн',
      render: uni => {
        const dl = uni.deadlines[0];
        if (!dl) return <span className="text-slate-400">Уточняется</span>;
        return (
          <>
            <span className="block font-bold text-indigo-700">{formatDateRu(dl.date)}</span>
            <span className="block text-xs text-slate-500 mt-0.5">{dl.roundName}</span>
            <span className="block text-[11px] text-slate-400">
              {relativeDeadline(dl.date)}
            </span>
          </>
        );
      },
    },
    {
      label: 'Платформа подачи',
      render: uni => uni.applicationPlatform,
    },
    {
      label: 'Главный компромисс',
      render: uni => (
        <span className="text-xs text-slate-600">
          {uni.potentialConcerns[0] ?? 'Существенных рисков в данных не отмечено'}
        </span>
      ),
    },
    {
      label: 'Источник данных',
      render: uni => (
        <a
          href={uni.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          Официальная страница
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              Этап 4 из 5 · Сравнение
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Сравнение выбранных программ
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Все параметры сопоставлены с твоей анкетой: бюджет{' '}
              {formatUSD(profile.annualBudgetUSD)}, средний балл {gpa5.toFixed(2)} из 5.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <DemoDataNotice compact />
            <button
              onClick={onGoToUniversities}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить ещё программу
            </button>
          </div>
        </div>

        <p className="sm:hidden text-[11px] text-slate-400">
          Таблица прокручивается по горизонтали →
        </p>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th
                    scope="col"
                    className="p-4 w-40 text-xs font-bold uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50/95 z-10"
                  >
                    Параметр
                  </th>
                  {comparedUniversities.map(uni => {
                    const tone = scoreTone(uni.matchScore);
                    return (
                      <th key={uni.id} scope="col" className="p-4 text-left align-top min-w-[220px]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="block text-sm font-bold text-slate-900 leading-tight">
                              {uni.flag} {uni.name}
                            </span>
                            <span className="block text-[11px] text-slate-500">
                              {uni.city}, {uni.countryLabel}
                            </span>
                          </div>

                          <button
                            onClick={() => onRemoveFromComparison(uni.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-200 transition-colors shrink-0"
                            aria-label={`Убрать ${uni.name} из сравнения`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${tone.badge}`}
                          >
                            {uni.matchScore}%
                          </span>

                          <button
                            onClick={() => onSelectForRoadmap(uni)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                          >
                            Выбрать
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {rows.map(row => (
                  <tr key={row.label} className="hover:bg-slate-50/50">
                    <th
                      scope="row"
                      className="p-4 text-left font-bold text-slate-700 bg-slate-50/40 sticky left-0 z-10"
                    >
                      {row.label}
                    </th>
                    {comparedUniversities.map(uni => (
                      <td key={uni.id} className="p-4 align-top text-slate-800">
                        {row.render(uni)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DemoDataNotice />

        <div className="p-5 bg-indigo-50/70 rounded-3xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-indigo-950">Выбери целевой университет</h2>
            <p className="text-xs text-indigo-900/80 mt-0.5">
              Кнопка «Выбрать» в шапке колонки построит персональный маршрут именно под эту
              программу: её дедлайны, платформу подачи и требования.
            </p>
          </div>

          <button
            onClick={() => onSelectForRoadmap(comparedUniversities[0])}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shrink-0"
          >
            Маршрут для «{comparedUniversities[0].name}»
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
