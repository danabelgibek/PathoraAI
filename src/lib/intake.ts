import { IntakeId } from '../types';

export interface IntakeOption {
  id: IntakeId;
  label: string;
  hint: string;
  /** Дата начала занятий — точка отсчёта для всех дедлайнов маршрута. */
  startISO: string;
}

export const INTAKE_OPTIONS: IntakeOption[] = [
  {
    id: 'fall_2027',
    label: 'Осень 2027',
    hint: 'Основной набор — полный цикл подготовки',
    startISO: '2027-09-01',
  },
  {
    id: 'spring_2027',
    label: 'Весна 2027',
    hint: 'Срочная подача — сроки сжаты',
    startISO: '2027-02-01',
  },
  {
    id: 'fall_2028',
    label: 'Осень 2028',
    hint: 'С запасом — можно усилить профиль',
    startISO: '2028-09-01',
  },
];

export function intakeOption(id: IntakeId): IntakeOption {
  return INTAKE_OPTIONS.find(o => o.id === id) ?? INTAKE_OPTIONS[0];
}

export function intakeStartDate(id: IntakeId): Date {
  return new Date(`${intakeOption(id).startISO}T00:00:00Z`);
}

/** Сколько полных месяцев осталось до начала занятий. */
export function monthsUntilIntake(id: IntakeId, now: Date = new Date()): number {
  const diff = intakeStartDate(id).getTime() - now.getTime();
  return Math.round(diff / (30 * 86_400_000));
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Дедлайн за N месяцев до начала занятий.
 *
 * Если такая дата уже прошла, шаг не выбрасывается и не «подделывается» задним
 * числом: он получает ближайший реальный срок и помечается как просроченный,
 * чтобы абитуриент видел честную картину сжатых сроков.
 */
export function deadlineBeforeIntake(
  intake: IntakeId,
  monthsBefore: number,
  now: Date = new Date(),
): { iso: string; overdue: boolean } {
  const start = intakeStartDate(intake);
  const target = new Date(start);
  target.setUTCMonth(target.getUTCMonth() - monthsBefore);

  const minimum = new Date(now.getTime() + 14 * 86_400_000);
  if (target.getTime() < minimum.getTime()) {
    return { iso: toISODate(minimum), overdue: true };
  }
  return { iso: toISODate(target), overdue: false };
}
