import { UNIVERSITIES } from './universities';

export interface CountryOption {
  name: string;
  label: string;
  flag: string;
  /** Сколько программ этой страны есть в демо-базе Pathora. */
  programCount: number;
}

/**
 * Страны, доступные для выбора в анкете.
 *
 * Список намеренно включает направления, по которым программ в демо-базе пока нет:
 * абитуриент должен видеть честную картину охвата, а не пустой выбор. Интерфейс
 * помечает такие страны отдельно, а подбор в этом случае прямо сообщает, что
 * показывает альтернативы.
 */
const CATALOG: Omit<CountryOption, 'programCount'>[] = [
  { name: 'Germany', label: 'Германия', flag: '🇩🇪' },
  { name: 'Netherlands', label: 'Нидерланды', flag: '🇳🇱' },
  { name: 'South Korea', label: 'Южная Корея', flag: '🇰🇷' },
  { name: 'Italy', label: 'Италия', flag: '🇮🇹' },
  { name: 'Poland', label: 'Польша', flag: '🇵🇱' },
  { name: 'Belgium', label: 'Бельгия', flag: '🇧🇪' },
  { name: 'Ireland', label: 'Ирландия', flag: '🇮🇪' },
  { name: 'Canada', label: 'Канада', flag: '🇨🇦' },
];

export const COUNTRY_OPTIONS: CountryOption[] = CATALOG.map(c => ({
  ...c,
  programCount: UNIVERSITIES.filter(u => u.country === c.name).length,
})).sort((a, b) => b.programCount - a.programCount || a.label.localeCompare(b.label, 'ru'));

export const COUNTRY_LABELS: Record<string, string> = Object.fromEntries(
  CATALOG.map(c => [c.name, c.label]),
);

export function countryLabel(name: string): string {
  return COUNTRY_LABELS[name] ?? name;
}

/** Страны из профиля, по которым в базе нет ни одной программы. */
export function countriesWithoutData(preferred: string[]): CountryOption[] {
  return COUNTRY_OPTIONS.filter(c => preferred.includes(c.name) && c.programCount === 0);
}
