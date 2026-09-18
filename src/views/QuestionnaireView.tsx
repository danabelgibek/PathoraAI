import { useState } from 'react';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, Info } from 'lucide-react';
import {
  EducationLevel,
  EnglishExamType,
  IntakeId,
  TargetDegree,
  UserProfile,
} from '../types';
import { PROFILE_PRESETS } from '../data/demoProfile';
import { COUNTRY_OPTIONS, countryLabel } from '../data/countries';
import { EXAM_LABELS, EXAM_RANGES, normalizeGpaTo5, toIeltsEquivalent } from '../lib/scoring';
import { INTAKE_OPTIONS } from '../lib/intake';
import { formatUSD } from '../lib/ui';

interface Props {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
  onCancel: () => void;
}

const STEPS = [
  { num: 1, title: 'О себе', desc: 'Возраст и текущий статус обучения' },
  { num: 2, title: 'Успеваемость', desc: 'Средний балл и достижения' },
  { num: 3, title: 'Цель', desc: 'Направление и желаемая ступень' },
  { num: 4, title: 'Страны и бюджет', desc: 'География и финансовый лимит' },
  { num: 5, title: 'Язык и сроки', desc: 'Экзамен и целевой семестр' },
  { num: 6, title: 'Проверка', desc: 'Обзор анкеты перед диагностикой' },
];

const EDUCATION_OPTIONS: { value: EducationLevel; label: string }[] = [
  { value: 'high_school_11', label: '11 класс (выпускной год)' },
  { value: 'high_school_10', label: '10 класс' },
  { value: 'high_school_graduated', label: 'Выпускник школы / gap year' },
  { value: 'college_student', label: 'Студент колледжа' },
];

const EXAM_OPTIONS: { id: EnglishExamType; desc: string }[] = [
  { id: 'ielts', desc: 'Шкала 4.0 – 9.0' },
  { id: 'toefl', desc: 'Шкала 30 – 120' },
  { id: 'duolingo', desc: 'Шкала 40 – 160' },
  { id: 'none_planning', desc: 'Добавим подготовку в маршрут' },
];

const FIELD_SUGGESTIONS = [
  'Computer Science / Data Science',
  'Artificial Intelligence & Robotics',
  'Software Engineering',
  'Business & Data Analytics',
  'Cybersecurity',
];

export function QuestionnaireView({ initialProfile, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<UserProfile>(initialProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [achievementInput, setAchievementInput] = useState('');

  const totalSteps = STEPS.length;

  const patch = (changes: Partial<UserProfile>, clearErrors: string[] = []) => {
    setForm(prev => ({ ...prev, ...changes }));
    if (clearErrors.length > 0) {
      setErrors(prev => {
        const next = { ...prev };
        clearErrors.forEach(key => delete next[key]);
        return next;
      });
    }
  };

  const validate = (target: number): boolean => {
    const errs: Record<string, string> = {};

    if (target === 1) {
      if (!form.name.trim()) errs.name = 'Укажите имя — оно используется в диагностике и эссе';
      if (!form.age || form.age < 14 || form.age > 30) {
        errs.age = 'Возраст должен быть от 14 до 30 лет';
      }
    }

    if (target === 2) {
      if (!form.gpa || form.gpa <= 0 || form.gpa > form.gpaScale) {
        errs.gpa = `Средний балл должен быть больше 0 и не выше ${form.gpaScale}`;
      }
    }

    if (target === 3 && !form.targetField.trim()) {
      errs.targetField = 'Укажите направление обучения';
    }

    if (target === 4) {
      if (form.preferredCountries.length === 0) {
        errs.countries = 'Выберите хотя бы одну страну';
      }
      if (form.annualBudgetUSD < 0) errs.budget = 'Бюджет не может быть отрицательным';
    }

    if (target === 5 && form.englishExam !== 'none_planning') {
      const range = EXAM_RANGES[form.englishExam];
      const score = form.englishScore;
      if (score === null || Number.isNaN(score) || score < range.min || score > range.max) {
        errs.englishScore = `Балл ${EXAM_LABELS[form.englishExam]} должен быть от ${range.min} до ${range.max}`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validate(step)) return;
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete(form);
    }
  };

  const goPrev = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onCancel();
    }
  };

  const toggleCountry = (name: string) => {
    const exists = form.preferredCountries.includes(name);
    patch(
      {
        preferredCountries: exists
          ? form.preferredCountries.filter(c => c !== name)
          : [...form.preferredCountries, name],
      },
      ['countries'],
    );
  };

  const addAchievement = () => {
    const value = achievementInput.trim();
    if (!value) return;
    patch({ academicAchievements: [...form.academicAchievements, value] });
    setAchievementInput('');
  };

  const selectExam = (id: EnglishExamType) => {
    if (id === 'none_planning') {
      patch({ englishExam: id, englishScore: null }, ['englishScore']);
      return;
    }
    const range = EXAM_RANGES[id];
    const current = form.englishScore;
    // При смене экзамена балл пересчитывать нельзя — шкалы разные.
    // Ставим середину диапазона нового экзамена, если текущий в него не попадает.
    const fits = current !== null && current >= range.min && current <= range.max;
    const fallback = id === 'ielts' ? 6.5 : id === 'toefl' ? 90 : 115;
    patch({ englishExam: id, englishScore: fits ? current : fallback }, ['englishScore']);
  };

  const gpa5 = normalizeGpaTo5(form.gpa, form.gpaScale);
  const band = toIeltsEquivalent(form.englishExam, form.englishScore);
  const selectedRange =
    form.englishExam === 'none_planning' ? null : EXAM_RANGES[form.englishExam];

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm';
  const labelClass =
    'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Шаги */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Шаг {step} из {totalSteps}
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1.5">
                {STEPS[step - 1].title}
              </h1>
              <p className="text-xs text-slate-500">{STEPS[step - 1].desc}</p>
            </div>

            <div className="sm:text-right">
              <label className="block text-[11px] text-slate-400 mb-1">
                Готовый сценарий для быстрой проверки
              </label>
              <select
                value=""
                onChange={e => {
                  const preset = PROFILE_PRESETS.find(p => p.id === e.target.value);
                  if (preset) {
                    setForm(preset.profile);
                    setErrors({});
                  }
                }}
                className="w-full sm:w-auto max-w-full px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-800 text-xs font-semibold"
              >
                <option value="">Выбрать сценарий…</option>
                {PROFILE_PRESETS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
          >
            <div
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>

          <div className="hidden sm:grid grid-cols-6 gap-2 mt-4 pt-3 border-t border-slate-100">
            {STEPS.map(s => {
              const isPast = s.num < step;
              const isCurrent = s.num === step;
              return (
                <button
                  key={s.num}
                  onClick={() => {
                    if (s.num < step || validate(step)) setStep(s.num);
                  }}
                  className={`text-left p-1.5 rounded-lg text-xs transition-colors ${
                    isCurrent
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : isPast
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {isPast ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[10px]">{s.num}.</span>
                    )}
                    <span className="truncate">{s.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200">
          {/* Шаг 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={labelClass} htmlFor="q-name">
                  Имя и фамилия *
                </label>
                <input
                  id="q-name"
                  type="text"
                  value={form.name}
                  onChange={e => patch({ name: e.target.value }, ['name'])}
                  placeholder="Например, Данияр Ибраев"
                  className={inputClass}
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="q-age">
                    Возраст *
                  </label>
                  <input
                    id="q-age"
                    type="number"
                    min={14}
                    max={30}
                    value={form.age}
                    onChange={e => patch({ age: parseInt(e.target.value, 10) || 0 }, ['age'])}
                    className={inputClass}
                  />
                  {errors.age && <p className="text-xs text-rose-600 mt-1">{errors.age}</p>}
                </div>

                <div>
                  <label className={labelClass} htmlFor="q-level">
                    Текущий статус обучения *
                  </label>
                  <select
                    id="q-level"
                    value={form.educationLevel}
                    onChange={e => patch({ educationLevel: e.target.value as EducationLevel })}
                    className={`${inputClass} bg-white`}
                  >
                    {EDUCATION_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    От этого зависит, какие выписки и справки попадут в маршрут.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="q-school">
                  Учебное заведение и специфика
                </label>
                <input
                  id="q-school"
                  type="text"
                  value={form.currentGradeDescription}
                  onChange={e => patch({ currentGradeDescription: e.target.value })}
                  placeholder="Лицей с физико-математическим уклоном"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Шаг 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="q-gpa">
                    Средний балл *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="q-gpa"
                      type="number"
                      step="0.05"
                      min={0}
                      max={form.gpaScale}
                      value={form.gpa}
                      onChange={e => patch({ gpa: parseFloat(e.target.value) || 0 }, ['gpa'])}
                      className={`${inputClass} font-bold text-indigo-700`}
                    />
                    <span className="text-slate-400 text-sm shrink-0">из</span>
                    <select
                      value={form.gpaScale}
                      onChange={e =>
                        patch({ gpaScale: parseFloat(e.target.value) || 5 }, ['gpa'])
                      }
                      aria-label="Шкала оценивания"
                      className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white shrink-0"
                    >
                      <option value={5}>5.0</option>
                      <option value={4}>4.0</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  {errors.gpa && <p className="text-xs text-rose-600 mt-1">{errors.gpa}</p>}
                </div>

                <div className="flex flex-col justify-end">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 block">
                      Пересчёт для сравнения с вузами:
                    </span>
                    {form.gpa > 0 ? (
                      <>
                        {form.gpa} из {form.gpaScale} ={' '}
                        <strong className="text-indigo-700">{gpa5.toFixed(2)} из 5</strong>.
                        Пороги программ в базе заданы в пятибалльной шкале.
                      </>
                    ) : (
                      'Укажите балл, чтобы увидеть пересчёт.'
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="q-achievement">
                  Олимпиады, проекты, сертификаты
                </label>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    id="q-achievement"
                    type="text"
                    value={achievementInput}
                    onChange={e => setAchievementInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAchievement();
                      }
                    }}
                    placeholder="Например, призёр олимпиады по информатике"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addAchievement}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shrink-0"
                  >
                    Добавить
                  </button>
                </div>

                {form.academicAchievements.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Пока пусто. Достижения не обязательны, но заметно усиливают заявку при
                    пограничном среднем балле.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {form.academicAchievements.map((ach, idx) => (
                      <li
                        key={`${ach}-${idx}`}
                        className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{ach}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            patch({
                              academicAchievements: form.academicAchievements.filter(
                                (_, i) => i !== idx,
                              ),
                            })
                          }
                          aria-label={`Удалить: ${ach}`}
                          className="text-slate-400 hover:text-rose-600 font-bold px-1.5 shrink-0"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Шаг 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className={labelClass}>Желаемая ступень *</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      {
                        value: 'bachelor' as TargetDegree,
                        title: 'Бакалавриат',
                        desc: '3–4 года первого высшего образования',
                      },
                      {
                        value: 'foundation' as TargetDegree,
                        title: 'Подготовительный год',
                        desc: 'Foundation или Studienkolleg для компенсации 11-летки',
                      },
                    ] as const
                  ).map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => patch({ targetDegree: option.value })}
                      aria-pressed={form.targetDegree === option.value}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        form.targetDegree === option.value
                          ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-bold text-sm text-slate-900">
                        {option.title}
                      </span>
                      <span className="block text-slate-500 mt-0.5">{option.desc}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Подготовительный год добавляет в маршрут отдельный шаг по выбору программы
                  Foundation или Studienkolleg.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="q-field">
                  Направление обучения *
                </label>
                <input
                  id="q-field"
                  type="text"
                  value={form.targetField}
                  onChange={e => patch({ targetField: e.target.value }, ['targetField'])}
                  placeholder="Computer Science / Data Science"
                  className={`${inputClass} font-semibold`}
                />
                {errors.targetField && (
                  <p className="text-xs text-rose-600 mt-1">{errors.targetField}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2.5">
                  {FIELD_SUGGESTIONS.map(field => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => patch({ targetField: field }, ['targetField'])}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                        form.targetField === field
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {field}
                    </button>
                  ))}
                </div>

                <p className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-2.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-px" aria-hidden="true" />
                  В демо-базе Pathora пока собраны только инженерные и IT-программы. Другое
                  направление указать можно — сервис честно сообщит, что подходящих программ
                  в базе нет, и покажет ближайшие альтернативы.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="q-sub">
                  Узкая специализация или карьерная цель
                </label>
                <input
                  id="q-sub"
                  type="text"
                  value={form.subSpecialty}
                  onChange={e => patch({ subSpecialty: e.target.value })}
                  placeholder="Machine Learning, веб-разработка, FinTech"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Шаг 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`${labelClass} mb-0`}>Страны поступления *</span>
                  <span className="text-xs text-indigo-600 font-medium shrink-0">
                    Выбрано: {form.preferredCountries.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COUNTRY_OPTIONS.map(country => {
                    const isSelected = form.preferredCountries.includes(country.name);
                    const hasData = country.programCount > 0;
                    return (
                      <button
                        key={country.name}
                        type="button"
                        onClick={() => toggleCountry(country.name)}
                        aria-pressed={isSelected}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xl shrink-0" aria-hidden="true">
                          {country.flag}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-900 truncate">
                            {country.label}
                          </span>
                          <span
                            className={`block text-[10px] ${hasData ? 'text-emerald-700' : 'text-amber-700'}`}
                          >
                            {hasData
                              ? `${country.programCount} ${country.programCount === 1 ? 'программа' : 'программы'} в базе`
                              : 'данных в базе пока нет'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.countries && (
                  <p className="text-xs text-rose-600 mt-1">{errors.countries}</p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className={`${labelClass} mb-0`} htmlFor="q-budget">
                    Годовой бюджет на обучение
                  </label>
                  <span className="text-base font-extrabold text-indigo-700">
                    до {formatUSD(form.annualBudgetUSD)} / год
                  </span>
                </div>

                <input
                  id="q-budget"
                  type="range"
                  min={2000}
                  max={40000}
                  step={1000}
                  value={form.annualBudgetUSD}
                  onChange={e =>
                    patch({ annualBudgetUSD: parseInt(e.target.value, 10) || 0 }, ['budget'])
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>$2 000</span>
                  <span>$20 000</span>
                  <span>$40 000</span>
                </div>

                <label className="mt-3 pt-3 border-t border-slate-200/80 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.needsScholarship}
                    onChange={e => patch({ needsScholarship: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 shrink-0"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Стипендия обязательна — усилить блок грантов в маршруте
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Шаг 5 */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <span className={labelClass}>Языковой экзамен *</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EXAM_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectExam(option.id)}
                      aria-pressed={form.englishExam === option.id}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        form.englishExam === option.id
                          ? 'border-indigo-600 bg-indigo-50/80 ring-1 ring-indigo-600'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900">
                        {EXAM_LABELS[option.id]}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {option.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedRange && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label
                      className="text-xs font-bold text-indigo-950 uppercase tracking-wider"
                      htmlFor="q-score"
                    >
                      Балл {EXAM_LABELS[form.englishExam]}
                    </label>
                    <span className="text-base font-extrabold text-indigo-700">
                      {form.englishScore ?? '—'}
                    </span>
                  </div>

                  <input
                    id="q-score"
                    type="range"
                    min={selectedRange.min}
                    max={selectedRange.max}
                    step={selectedRange.step}
                    value={form.englishScore ?? selectedRange.min}
                    onChange={e =>
                      patch({ englishScore: parseFloat(e.target.value) }, ['englishScore'])
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{selectedRange.min}</span>
                    <span>{selectedRange.max}</span>
                  </div>

                  {band !== null && form.englishExam !== 'ielts' && (
                    <p className="text-[11px] text-indigo-900 mt-2">
                      Эквивалент IELTS ≈ <strong>{band.toFixed(1)}</strong> — в этой шкале
                      заданы пороги вузов в базе.
                    </p>
                  )}
                  {errors.englishScore && (
                    <p className="text-xs text-rose-600 mt-1">{errors.englishScore}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="q-lang2">
                    Второй иностранный язык
                  </label>
                  <input
                    id="q-lang2"
                    type="text"
                    value={form.secondLanguage}
                    onChange={e => patch({ secondLanguage: e.target.value })}
                    placeholder="Немецкий A1 / корейский начальный"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="q-intake">
                    Целевой семестр начала учёбы
                  </label>
                  <select
                    id="q-intake"
                    value={form.targetIntake}
                    onChange={e => patch({ targetIntake: e.target.value as IntakeId })}
                    className={`${inputClass} bg-white`}
                  >
                    {INTAKE_OPTIONS.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.label} — {o.hint}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    От этой даты считаются все дедлайны маршрута.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Шаг 6 */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h2 className="text-sm font-bold text-slate-900 mb-3">Обзор анкеты</h2>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {[
                    ['Абитуриент', `${form.name}, ${form.age} лет`],
                    [
                      'Статус',
                      EDUCATION_OPTIONS.find(o => o.value === form.educationLevel)?.label ?? '—',
                    ],
                    [
                      'Успеваемость',
                      `${form.gpa} из ${form.gpaScale}${form.gpaScale !== 5 ? ` (≈ ${gpa5.toFixed(2)} из 5)` : ''}`,
                    ],
                    [
                      'Ступень и направление',
                      `${form.targetDegree === 'foundation' ? 'Подготовительный год' : 'Бакалавриат'} · ${form.targetField}`,
                    ],
                    [
                      'Язык',
                      form.englishExam === 'none_planning' || form.englishScore === null
                        ? 'Экзамен не сдан'
                        : `${EXAM_LABELS[form.englishExam]} ${form.englishScore}`,
                    ],
                    [
                      'Страны',
                      form.preferredCountries.map(countryLabel).join(', ') || 'не выбраны',
                    ],
                    ['Бюджет', `до ${formatUSD(form.annualBudgetUSD)} / год`],
                    [
                      'Старт обучения',
                      INTAKE_OPTIONS.find(o => o.id === form.targetIntake)?.label ?? '—',
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="p-2.5 bg-white rounded-xl border border-slate-100">
                      <dt className="text-slate-400">{label}:</dt>
                      <dd className="font-semibold text-slate-800 break-words">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                  <span className="text-slate-400">
                    Достижения ({form.academicAchievements.length}):{' '}
                  </span>
                  <span className="text-slate-700 font-medium">
                    {form.academicAchievements.join('; ') || 'не указаны'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="block">Анкета готова</strong>
                  На следующем шаге Pathora рассчитает индекс готовности, покажет сильные
                  стороны и ограничения и подберёт программы под эти ответы.
                </span>
              </div>
            </div>
          )}

          {/* Навигация */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {step === 1 ? 'На главную' : 'Назад'}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {step === totalSteps ? 'Построить диагностику' : 'Дальше'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
