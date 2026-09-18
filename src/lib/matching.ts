import { MatchReason, University, UniversityRecord, UserProfile } from '../types';
import { UNIVERSITIES } from '../data/universities';
import { countriesWithoutData } from '../data/countries';
import { checkLanguage, normalizeGpaTo5 } from './scoring';
import { formatUSD } from './ui';

/**
 * Подбор университетов под профиль.
 *
 * Правила подбора прозрачны и детерминированы: каждый аргумент, который видит
 * абитуриент, порождается тем же кодом, который начисляет баллы. Никакой оценки
 * не выставляется без объяснения, и наоборот.
 */

export type FieldAffinity = 'strong' | 'partial' | 'none';

const FIELD_SYNONYMS: Record<string, string[]> = {
  'computer science': ['computer', 'информатик', 'программир', 'software', 'it', '컴퓨터'],
  'software engineering': ['software', 'разработк', 'программн'],
  ai: ['ai', 'artificial intelligence', 'искусственн', 'machine learning', 'нейросет', 'ml'],
  'data science': ['data', 'данн', 'аналитик', 'analytics', 'statistics'],
  engineering: ['engineering', 'инженер', 'технич'],
  robotics: ['robot', 'робот', 'мехатрон'],
  информатика: ['информатик', 'computer', 'программир'],
};

/** Насколько направление вуза совпадает с интересом абитуриента. */
export function fieldAffinity(profile: UserProfile, uni: UniversityRecord): FieldAffinity {
  const haystack = `${profile.targetField} ${profile.subSpecialty}`.toLowerCase();
  if (!haystack.trim()) return 'partial';

  let hits = 0;
  for (const tag of uni.fieldTags) {
    const needles = [tag, ...(FIELD_SYNONYMS[tag] ?? [])];
    if (needles.some(n => haystack.includes(n.toLowerCase()))) hits += 1;
  }

  if (hits >= 2) return 'strong';
  if (hits === 1) return 'partial';
  return 'none';
}

export interface CatalogCoverage {
  /** Направления абитуриента, по которым в демо-базе нет ни одной программы. */
  fieldCovered: boolean;
  /** Выбранные страны, по которым в базе нет программ. */
  missingCountries: string[];
  /** Сколько программ нашлось в выбранных странах. */
  inPreferredCount: number;
}

/**
 * Честная оценка того, что демо-база может и чего не может дать этому профилю.
 * Используется, чтобы прямо сказать абитуриенту об ограничениях, а не молча
 * подставить нерелевантные программы.
 */
export function catalogCoverage(
  profile: UserProfile,
  matched: University[],
): CatalogCoverage {
  return {
    fieldCovered: matched.some(u => fieldAffinity(profile, u) !== 'none'),
    missingCountries: countriesWithoutData(profile.preferredCountries).map(c => c.label),
    inPreferredCount: matched.filter(u => u.isPreferredCountry).length,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function matchUniversities(
  profile: UserProfile,
  source: UniversityRecord[] = UNIVERSITIES,
): University[] {
  const gpa5 = normalizeGpaTo5(profile.gpa, profile.gpaScale);

  return source
    .map((uni): University => {
      const reasons: MatchReason[] = [];
      let score = 50;

      // --- 1. Направление программы ---
      const affinity = fieldAffinity(profile, uni);
      if (affinity === 'strong') {
        score += 14;
        reasons.push({
          category: 'program',
          status: 'positive',
          text: `${uni.programHighlight} Это прямо совпадает с твоим направлением «${profile.targetField}».`,
        });
      } else if (affinity === 'partial') {
        score += 7;
        reasons.push({
          category: 'program',
          status: 'neutral',
          text: `${uni.programHighlight} С направлением «${profile.targetField}» совпадение частичное — проверь список курсов программы.`,
        });
      } else {
        score -= 12;
        reasons.push({
          category: 'program',
          status: 'warning',
          text: `Программа относится к инженерно-технической области и не соответствует направлению «${profile.targetField}». В демо-базе Pathora пока нет программ по этому профилю.`,
        });
      }

      // --- 2. Страна ---
      const isPreferredCountry = profile.preferredCountries.some(
        c => c.toLowerCase() === uni.country.toLowerCase(),
      );
      if (isPreferredCountry) {
        score += 18;
        reasons.push({
          category: 'country',
          status: 'positive',
          text: `${uni.countryLabel} входит в выбранные тобой страны поступления.`,
        });
      } else {
        reasons.push({
          category: 'country',
          status: 'neutral',
          text: `${uni.countryLabel} не входит в твой список стран — это альтернатива за его пределами.`,
        });
      }

      // --- 3. Бюджет ---
      const tuition = uni.tuitionAnnualUSD;
      const totalFirstYear = tuition + uni.livingCostAnnualUSD;
      if (tuition === 0) {
        score += 12;
        reasons.push({
          category: 'budget',
          status: 'positive',
          text: `Обучение бесплатное — оплачивается только семестровый взнос ${formatUSD(uni.semesterFeeUSD)}. С бюджетом ${formatUSD(profile.annualBudgetUSD)} остаются средства на проживание.`,
        });
      } else if (tuition <= profile.annualBudgetUSD) {
        score += 12;
        reasons.push({
          category: 'budget',
          status: 'positive',
          text: `Обучение ${formatUSD(tuition)} в год укладывается в твой бюджет ${formatUSD(profile.annualBudgetUSD)}. С проживанием полная стоимость первого года — около ${formatUSD(totalFirstYear)}.`,
        });
      } else if (tuition - profile.annualBudgetUSD <= 2500) {
        score += 4;
        reasons.push({
          category: 'budget',
          status: 'warning',
          text: `Обучение ${formatUSD(tuition)} превышает бюджет ${formatUSD(profile.annualBudgetUSD)} на ${formatUSD(tuition - profile.annualBudgetUSD)} — разницу закрывает вузовская стипендия.`,
        });
      } else {
        score -= 14;
        reasons.push({
          category: 'budget',
          status: 'warning',
          text: `Обучение ${formatUSD(tuition)} значительно выше бюджета ${formatUSD(profile.annualBudgetUSD)}. Поступление реалистично только с грантом, покрывающим обучение полностью.`,
        });
      }

      if (profile.needsScholarship && uni.scholarshipOpportunities.some(s => s.available)) {
        score += 4;
      }

      // --- 4. Язык ---
      const lang = checkLanguage(profile, uni.requirements);
      if (lang.verdict === 'exceeds') {
        score += 12;
        reasons.push({
          category: 'language',
          status: 'positive',
          text: `Твой ${lang.examLabel} ${lang.userScore} выше порога программы (${lang.required}) — это плюс при отборе и при подаче на стипендии.`,
        });
      } else if (lang.verdict === 'meets') {
        score += 8;
        reasons.push({
          category: 'language',
          status: 'positive',
          text: `Твой ${lang.examLabel} ${lang.userScore} удовлетворяет формальное требование программы (минимум ${lang.required}).`,
        });
      } else if (lang.verdict === 'below') {
        score -= 18;
        reasons.push({
          category: 'language',
          status: 'warning',
          text: `Твой ${lang.examLabel} ${lang.userScore} ниже порога программы (${lang.required}). Потребуется пересдача до подачи документов.`,
        });
      } else {
        score -= 6;
        reasons.push({
          category: 'language',
          status: 'warning',
          text: `Языковой сертификат ещё не получен. Для этой программы нужен ${lang.examLabel} от ${lang.required}.`,
        });
      }

      // --- 5. Успеваемость ---
      const gpaMin = uni.requirements.gpaMin5;
      const gpaLabel = `${profile.gpa} из ${profile.gpaScale}`;
      if (gpa5 >= gpaMin + 0.3) {
        score += 10;
        reasons.push({
          category: 'academic',
          status: 'positive',
          text: `Средний балл ${gpaLabel} (${gpa5.toFixed(2)} по пятибалльной шкале) уверенно выше входного порога программы — ${gpaMin}.`,
        });
      } else if (gpa5 >= gpaMin) {
        score += 7;
        reasons.push({
          category: 'academic',
          status: 'positive',
          text: `Средний балл ${gpaLabel} (${gpa5.toFixed(2)} из 5) проходит входной порог программы — ${gpaMin}.`,
        });
      } else if (gpa5 >= gpaMin - 0.3) {
        score -= 4;
        reasons.push({
          category: 'academic',
          status: 'warning',
          text: `Средний балл ${gpaLabel} (${gpa5.toFixed(2)} из 5) чуть ниже порога ${gpaMin} — компенсировать придётся олимпиадами и портфолио.`,
        });
      } else {
        score -= 14;
        reasons.push({
          category: 'academic',
          status: 'warning',
          text: `Средний балл ${gpaLabel} (${gpa5.toFixed(2)} из 5) заметно ниже порога программы ${gpaMin}. Это основной риск отказа.`,
        });
      }

      const matchScore = clamp(Math.round(score), 20, 97);

      const hardBlocker = lang.verdict === 'below' || gpa5 < gpaMin - 0.3 || affinity === 'none';
      let matchTier: University['matchTier'];
      if (hardBlocker) matchTier = 'Reach';
      else if (matchScore >= 85) matchTier = 'Safety';
      else if (matchScore >= 68) matchTier = 'Target';
      else matchTier = 'Reach';

      return { ...uni, matchScore, matchTier, matchReasons: reasons, isPreferredCountry };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/** Разделение на программы в выбранных странах и альтернативы за их пределами. */
export function splitByPreference(list: University[]): {
  preferred: University[];
  alternatives: University[];
} {
  return {
    preferred: list.filter(u => u.isPreferredCountry),
    alternatives: list.filter(u => !u.isPreferredCountry),
  };
}
