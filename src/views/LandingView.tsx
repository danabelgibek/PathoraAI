import { ReactNode } from 'react';
import {
  ArrowRight,
  ChevronRight,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { University, UserProfile } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { countryLabel } from '../data/countries';
import { UNIVERSITIES } from '../data/universities';
import { formatExamScore } from '../lib/scoring';
import { intakeOption } from '../lib/intake';
import { formatTuition, formatUSD, reasonStyle, scoreTone } from '../lib/ui';

interface Props {
  profile: UserProfile;
  sampleUniversity?: University;
  onStartJourney: () => void;
  onOpenDiagnosis: () => void;
  onExploreUniversities: () => void;
}

const FEATURES: { icon: ReactNode; tint: string; title: string; desc: string }[] = [
  {
    icon: <Target className="w-3.5 h-3.5" />,
    tint: 'bg-indigo-100 text-indigo-600',
    title: 'Блок «почему подходит»',
    desc: 'Пять аргументов: программа, страна, бюджет, язык и успеваемость.',
  },
  {
    icon: <FileCheck className="w-3.5 h-3.5" />,
    tint: 'bg-teal-100 text-teal-600',
    title: 'Маршрут с отметками',
    desc: 'Прогресс пересчитывается сразу и сохраняется между сессиями.',
  },
  {
    icon: <Zap className="w-3.5 h-3.5" />,
    tint: 'bg-amber-100 text-amber-600',
    title: 'Следующий шаг',
    desc: 'Одна задача с дедлайном и объяснением, почему она важна сейчас.',
  },
];

const STEPS = [
  { num: '01', title: 'Анкета', desc: 'Успеваемость, языки, бюджет, страны и сроки' },
  { num: '02', title: 'Диагностика', desc: 'Индекс готовности, сильные стороны и риски' },
  { num: '03', title: 'Подбор программ', desc: 'Объяснимые рекомендации «почему подходит»' },
  { num: '04', title: 'Сравнение', desc: 'Матрица различий по важным параметрам' },
  { num: '05', title: 'Маршрут', desc: 'План от документов до визы с дедлайнами' },
  { num: '06', title: 'Следующий шаг', desc: 'Одно действие, которое нужно сделать сейчас' },
];

export function LandingView({
  profile,
  sampleUniversity,
  onStartJourney,
  onOpenDiagnosis,
  onExploreUniversities,
}: Props) {
  const intake = intakeOption(profile.targetIntake);
  const tone = sampleUniversity ? scoreTone(sampleUniversity.matchScore) : null;

  return (
    <div className="bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      {/* Герой */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 border-b border-slate-200/80">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              Навигатор поступления за рубеж
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
              Твой персональный маршрут поступления,{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-teal-600 bg-clip-text text-transparent">
                а не ещё один каталог вузов.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Pathora превращает анкету в понятный план: куда поступать, почему эти
              программы подходят именно твоему профилю и какое одно действие сделать
              прямо сейчас.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <button
                onClick={onStartJourney}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-600/20 transition-all text-base group"
              >
                Заполнить анкету
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={onOpenDiagnosis}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-800 font-semibold transition-all text-base"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                Посмотреть готовый пример
              </button>
            </div>

            <dl className="mt-10 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
              {[
                [`${UNIVERSITIES.length} программ`, 'в демо-базе с источниками'],
                ['6 этапов', 'маршрута от анкеты до визы'],
                ['1 шаг', 'выделен как ближайший'],
                ['Без AI-догадок', 'прозрачные правила подбора'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-xl sm:text-2xl font-bold text-slate-900">{value}</dt>
                  <dd className="text-xs text-slate-500 mt-0.5">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Путь */}
      <section className="py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Как устроен путь
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Один связный маршрут от анкеты до визы
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              На каждом экране видно, где ты находишься, что уже сделано и что будет дальше.
            </p>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {STEPS.map((step, idx) => (
              <li
                key={step.num}
                className="relative bg-slate-50 hover:bg-indigo-50/40 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-indigo-600 px-2 py-0.5 bg-indigo-100/70 rounded-md">
                    {step.num}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight
                      className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors hidden xl:block"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Живой пример подбора: карточка собирается из текущего профиля */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                Карточка ниже собрана из текущей анкеты
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Каждая рекомендация объяснена
              </h2>

              <p className="text-slate-600 text-sm leading-relaxed">
                Pathora сопоставляет твой средний балл, языковой экзамен, бюджет, страну и
                направление с требованиями программ и показывает, какой именно параметр
                сработал в плюс, а какой — в минус. Изменишь ответ в анкете — изменятся и
                аргументы.
              </p>

              <ul className="space-y-3 pt-1">
                {FEATURES.map(feature => (
                  <li key={feature.title} className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${feature.tint}`}
                    >
                      {feature.icon}
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-slate-900">
                        {feature.title}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">{feature.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onExploreUniversities}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Посмотреть все подобранные программы
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-7">
              {sampleUniversity && tone ? (
                <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/80">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {sampleUniversity.logoText}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {sampleUniversity.name} {sampleUniversity.flag}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {sampleUniversity.city}, {sampleUniversity.countryLabel}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold ${tone.badge}`}
                    >
                      {sampleUniversity.matchScore}%
                    </span>
                  </div>

                  <div className="py-4">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Рекомендованная программа
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                      {sampleUniversity.programName}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                      {[
                        ['Обучение / год', formatTuition(sampleUniversity.tuitionAnnualUSD)],
                        ['Твой бюджет', `${formatUSD(profile.annualBudgetUSD)} / год`],
                        ['Твой экзамен', formatExamScore(profile)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <span className="text-[11px] text-slate-500 block font-medium">
                            {label}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      Почему подходит {profile.name.split(' ')[0]}:
                    </p>
                    <ul className="space-y-1.5 text-xs text-indigo-950/90">
                      {sampleUniversity.matchReasons.slice(0, 3).map((reason, idx) => {
                        const style = reasonStyle(reason.status);
                        return (
                          <li key={idx} className="flex items-start gap-2">
                            <span className={`font-bold shrink-0 ${style.className}`} aria-hidden="true">
                              {style.symbol}
                            </span>
                            <span>{reason.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <DemoDataNotice compact />
                    <button
                      onClick={onOpenDiagnosis}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                    >
                      Открыть диагностику
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-sm text-slate-500">
                  Заполни анкету, чтобы увидеть первую подобранную программу.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Аудитория */}
      <section className="py-14 bg-white border-t border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-4">
                Для кого сделан сервис
              </span>

              <h3 className="text-xl sm:text-2xl font-bold">
                Школьники и выпускники, поступающие на бакалавриат за рубеж
              </h3>

              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Тем, кому за ограниченное время нужно признать документы, подтвердить язык,
                подать заявки и оформить визу — не потеряв ни одного дедлайна.
              </p>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
                {[
                  ['Сейчас в анкете', profile.name],
                  ['Направление', profile.targetField],
                  ['Страны', profile.preferredCountries.map(countryLabel).join(', ') || '—'],
                  ['Старт обучения', intake.label],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-slate-400">{label}:</dt>
                    <dd className="font-semibold text-white mt-0.5 break-words">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <span className="text-xs text-indigo-200">
                  Любой параметр можно изменить — подбор и маршрут перестроятся сразу.
                </span>
                <button
                  onClick={onStartJourney}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors shrink-0"
                >
                  Изменить анкету
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
