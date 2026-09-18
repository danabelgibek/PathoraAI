import {
  BreakdownStatus,
  MatchReason,
  ReadinessTierId,
  TaskCategory,
  TaskPriority,
  University,
} from '../types';

/**
 * Единая графическая система Pathora.
 *
 * Все состояния интерфейса (оценка соответствия, готовность профиля, приоритет
 * задачи, тип аргумента) описаны здесь один раз, чтобы одинаковые смыслы всегда
 * выглядели одинаково на любом экране.
 */

export function formatUSD(value: number): string {
  return `$${value.toLocaleString('ru-RU')}`;
}

export function formatTuition(value: number): string {
  return value === 0 ? '0 € (бесплатно)' : `${formatUSD(value)} / год`;
}

export interface Tone {
  /** Бейдж: фон + текст + рамка. */
  badge: string;
  /** Заливка прогресс-бара. */
  bar: string;
  /** Только цвет текста. */
  text: string;
  label: string;
}

const TONE_POSITIVE: Omit<Tone, 'label'> = {
  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  bar: 'bg-emerald-500',
  text: 'text-emerald-700',
};

const TONE_NEUTRAL: Omit<Tone, 'label'> = {
  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  bar: 'bg-indigo-600',
  text: 'text-indigo-700',
};

const TONE_WARNING: Omit<Tone, 'label'> = {
  badge: 'bg-amber-50 text-amber-800 border-amber-200',
  bar: 'bg-amber-500',
  text: 'text-amber-700',
};

const TONE_CRITICAL: Omit<Tone, 'label'> = {
  badge: 'bg-rose-50 text-rose-700 border-rose-200',
  bar: 'bg-rose-500',
  text: 'text-rose-700',
};

/** Цвет любой оценки 0–100. Один источник правды для всех бейджей «% Match» и шкал. */
export function scoreTone(score: number): Tone {
  if (score >= 80) return { ...TONE_POSITIVE, label: 'Сильное соответствие' };
  if (score >= 65) return { ...TONE_NEUTRAL, label: 'Хорошее соответствие' };
  if (score >= 50) return { ...TONE_WARNING, label: 'Частичное соответствие' };
  return { ...TONE_CRITICAL, label: 'Слабое соответствие' };
}

export function statusTone(status: BreakdownStatus): Tone {
  switch (status) {
    case 'optimal':
      return { ...TONE_POSITIVE, label: 'Оптимально' };
    case 'good':
      return { ...TONE_NEUTRAL, label: 'Хорошо' };
    case 'needs_work':
      return { ...TONE_WARNING, label: 'Требует внимания' };
    case 'critical':
      return { ...TONE_CRITICAL, label: 'Критично' };
  }
}

export function readinessTone(tier: ReadinessTierId): Tone {
  switch (tier) {
    case 'high':
      return { ...TONE_POSITIVE, label: 'Высокая готовность' };
    case 'competitive':
      return { ...TONE_NEUTRAL, label: 'Хорошие шансы с доработкой' };
    case 'needs_prep':
      return { ...TONE_WARNING, label: 'Требуется усиление' };
  }
}

export interface ReasonStyle {
  symbol: string;
  className: string;
}

export function reasonStyle(status: MatchReason['status']): ReasonStyle {
  switch (status) {
    case 'positive':
      return { symbol: '✓', className: 'text-emerald-600' };
    case 'warning':
      return { symbol: '!', className: 'text-amber-500' };
    default:
      return { symbol: '•', className: 'text-slate-400' };
  }
}

export interface PriorityMeta {
  label: string;
  badge: string;
  /** Показывать ли бейдж в списке задач. */
  highlight: boolean;
}

export const PRIORITY_META: Record<TaskPriority, PriorityMeta> = {
  urgent: {
    label: 'Критично',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    highlight: true,
  },
  high: {
    label: 'Высокий',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    highlight: true,
  },
  medium: {
    label: 'Средний',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    highlight: false,
  },
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  academic: 'Учёба',
  exam: 'Экзамен',
  document: 'Документы',
  application: 'Подача',
  scholarship: 'Стипендия',
  visa: 'Виза',
  financial: 'Финансы',
};

export const MATCH_TIER_LABELS: Record<University['matchTier'], string> = {
  Target: 'Target — реалистичная цель',
  Safety: 'Safety — высокий шанс',
  Reach: 'Reach — амбициозный вариант',
};

export const REASON_CATEGORY_LABELS: Record<MatchReason['category'], string> = {
  program: 'Программа',
  country: 'Страна',
  budget: 'Бюджет',
  language: 'Язык',
  academic: 'Успеваемость',
};

/** Дата в формате «15 января 2027». */
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function formatDateRu(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS_GENITIVE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Короткое «через 3 месяца» / «просрочено» относительно текущей даты. */
export function relativeDeadline(iso: string, now: Date = new Date()): string {
  const target = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return '';
  const days = Math.round((target.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return 'дедлайн прошёл';
  if (days === 0) return 'сегодня';
  if (days < 31) return `через ${days} дн.`;
  const months = Math.round(days / 30);
  return `через ${months} мес.`;
}
