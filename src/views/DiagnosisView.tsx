import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit3,
  Globe,
  GraduationCap,
  Info,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { ProfileDiagnosis, ScoreCategoryBreakdown, UserProfile } from '../types';
import { DemoDataNotice } from '../components/DemoDataNotice';
import { readinessTone, statusTone } from '../lib/ui';

interface Props {
  profile: UserProfile;
  diagnosis: ProfileDiagnosis;
  onProceedToMatches: () => void;
  onEditProfile: () => void;
}

export function DiagnosisView({
  profile,
  diagnosis,
  onProceedToMatches,
  onEditProfile,
}: Props) {
  const tierTone = readinessTone(diagnosis.readinessTierId);

  const categories: { key: string; icon: typeof Clock; data: ScoreCategoryBreakdown }[] = [
    { key: 'academic', icon: GraduationCap, data: diagnosis.breakdown.academic },
    { key: 'language', icon: Globe, data: diagnosis.breakdown.language },
    { key: 'financial', icon: DollarSign, data: diagnosis.breakdown.financial },
    { key: 'timeline', icon: Clock, data: diagnosis.breakdown.timeline },
  ];

  const lists = [
    {
      title: 'Сильные стороны',
      subtitle: 'На что опираться в заявке',
      items: diagnosis.strengths,
      icon: CheckCircle2,
      tint: 'bg-emerald-100 text-emerald-700',
      marker: '✓',
      markerClass: 'text-emerald-600',
      footer: 'Основа для мотивационного письма',
      footerClass: 'text-emerald-800',
    },
    {
      title: 'Ограничения и риски',
      subtitle: 'Узкие места, требующие внимания',
      items: diagnosis.constraints,
      icon: AlertTriangle,
      tint: 'bg-amber-100 text-amber-700',
      marker: '!',
      markerClass: 'text-amber-500',
      footer: 'Учитываются при подборе программ',
      footerClass: 'text-amber-800',
    },
    {
      title: 'Точки роста',
      subtitle: 'Что можно усилить до подачи',
      items: diagnosis.recommendedImprovements,
      icon: TrendingUp,
      tint: 'bg-indigo-100 text-indigo-700',
      marker: '→',
      markerClass: 'text-indigo-600',
      footer: 'Включены в маршрут поступления',
      footerClass: 'text-indigo-700',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              Этап 2 из 5 · Диагностика профиля
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Карта готовности к поступлению
            </h1>
            <p className="text-sm text-slate-600 mt-1">{diagnosis.goalStatement}</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              Изменить анкету
            </button>

            <button
              onClick={onProceedToMatches}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              Подобрать университеты
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Индекс готовности */}
        <section className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    className={tierTone.text}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - diagnosis.overallScore / 100)}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {diagnosis.overallScore}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    из 100
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex items-center mt-3 px-2.5 py-1 rounded-full border text-xs font-bold ${tierTone.badge}`}
              >
                {diagnosis.readinessTier}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">{diagnosis.readinessTierEn}</p>
            </div>

            <div className="lg:col-span-8 space-y-3">
              <h2 className="text-base font-bold text-slate-900">Из чего складывается оценка</h2>

              {categories.map(({ key, icon: Icon, data }) => {
                const tone = statusTone(data.status);
                return (
                  <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${tone.text}`} aria-hidden="true" />
                        <span className="truncate">{data.title}</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${tone.badge}`}
                        >
                          {tone.label}
                        </span>
                        <span className={`font-bold ${tone.text}`}>{data.score}/100</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
                        style={{ width: `${data.score}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">{data.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Резюме профиля */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1.5">
              Краткое резюме профиля
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{diagnosis.summary}</p>

            <div className="mt-4 p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                Образовательная цель
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {diagnosis.goalStatement}
              </p>
            </div>
          </div>
        </section>

        {/* Сильные стороны / риски / точки роста */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {lists.map(list => (
            <section
              key={list.title}
              className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${list.tint}`}
                >
                  <list.icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <h2 className="text-base font-bold text-slate-900">{list.title}</h2>
                <p className="text-xs text-slate-500 mt-0.5 mb-4">{list.subtitle}</p>

                <ul className="space-y-3 text-xs text-slate-700">
                  {list.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        className={`font-bold shrink-0 mt-0.5 ${list.markerClass}`}
                        aria-hidden="true"
                      >
                        {list.marker}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p
                className={`mt-6 pt-4 border-t border-slate-100 text-[11px] font-medium ${list.footerClass}`}
              >
                {list.footer}
              </p>
            </section>
          ))}
        </div>

        {/* Дисклеймер и переход дальше */}
        <section className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
          <DemoDataNotice />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <p className="flex items-start gap-2.5 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
              {diagnosis.disclaimer}
            </p>

            <button
              onClick={onProceedToMatches}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-colors shrink-0"
            >
              К подобранным программам для {profile.name.split(' ')[0]}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
