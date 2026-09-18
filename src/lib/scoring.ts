import { EnglishExamType, UniversityRequirement, UserProfile } from '../types';

/**
 * Нормализация входных данных профиля.
 *
 * Абитуриент может указать успеваемость в разных шкалах (5.0 / 4.0 / 100) и сдать
 * разные языковые экзамены (IELTS / TOEFL iBT / Duolingo). Требования вузов в базе
 * хранятся в собственных шкалах каждого экзамена, поэтому сравнивать «сырые» числа
 * нельзя — балл TOEFL 88 не является баллом IELTS 88.
 */

export const EXAM_LABELS: Record<EnglishExamType, string> = {
  ielts: 'IELTS Academic',
  toefl: 'TOEFL iBT',
  duolingo: 'Duolingo English Test',
  none_planning: 'Экзамен ещё не сдан',
};

export const EXAM_RANGES: Record<
  Exclude<EnglishExamType, 'none_planning'>,
  { min: number; max: number; step: number }
> = {
  ielts: { min: 4, max: 9, step: 0.5 },
  toefl: { min: 30, max: 120, step: 1 },
  duolingo: { min: 40, max: 160, step: 5 },
};

/** Приводит GPA к единой пятибалльной шкале, в которой заданы пороги вузов. */
export function normalizeGpaTo5(gpa: number, gpaScale: number): number {
  if (!gpaScale || gpaScale <= 0) return 0;
  const normalized = (gpa / gpaScale) * 5;
  return Math.round(normalized * 100) / 100;
}

/**
 * Переводит балл любого из поддерживаемых экзаменов в эквивалент полосы IELTS.
 * Используются официальные таблицы сопоставления ETS (TOEFL) и Duolingo.
 */
export function toIeltsEquivalent(
  exam: EnglishExamType,
  score: number | null,
): number | null {
  if (exam === 'none_planning' || score === null || Number.isNaN(score)) return null;

  if (exam === 'ielts') return score;

  if (exam === 'toefl') {
    if (score >= 118) return 9;
    if (score >= 115) return 8.5;
    if (score >= 110) return 8;
    if (score >= 102) return 7.5;
    if (score >= 94) return 7;
    if (score >= 79) return 6.5;
    if (score >= 60) return 6;
    if (score >= 46) return 5.5;
    return 5;
  }

  // Duolingo English Test
  if (score >= 160) return 9;
  if (score >= 150) return 8.5;
  if (score >= 140) return 8;
  if (score >= 130) return 7.5;
  if (score >= 120) return 7;
  if (score >= 115) return 6.5;
  if (score >= 105) return 6;
  if (score >= 95) return 5.5;
  return 5;
}

/** Порог конкретного вуза в шкале того экзамена, который сдаёт абитуриент. */
export function requirementForExam(
  exam: EnglishExamType,
  req: UniversityRequirement,
): { value: number; label: string } {
  switch (exam) {
    case 'toefl':
      return { value: req.toeflMin, label: 'TOEFL iBT' };
    case 'duolingo':
      return { value: req.duolingoMin, label: 'Duolingo' };
    default:
      return { value: req.ieltsMin, label: 'IELTS' };
  }
}

export type LanguageVerdict = 'not_taken' | 'below' | 'meets' | 'exceeds';

export interface LanguageCheck {
  verdict: LanguageVerdict;
  /** Балл абитуриента в его собственной шкале, либо null если экзамен не сдан. */
  userScore: number | null;
  /** Порог вуза в той же шкале. */
  required: number;
  examLabel: string;
}

/** Честное сравнение языкового балла с требованием вуза — в одной шкале. */
export function checkLanguage(
  profile: UserProfile,
  req: UniversityRequirement,
): LanguageCheck {
  const { value: required, label: examLabel } = requirementForExam(profile.englishExam, req);

  if (profile.englishExam === 'none_planning' || profile.englishScore === null) {
    return { verdict: 'not_taken', userScore: null, required, examLabel };
  }

  const userScore = profile.englishScore;
  const userBand = toIeltsEquivalent(profile.englishExam, userScore);
  const requiredBand = toIeltsEquivalent(profile.englishExam, required);

  if (userBand === null || requiredBand === null) {
    return { verdict: 'not_taken', userScore, required, examLabel };
  }
  if (userBand < requiredBand) {
    return { verdict: 'below', userScore, required, examLabel };
  }
  if (userBand >= requiredBand + 0.5) {
    return { verdict: 'exceeds', userScore, required, examLabel };
  }
  return { verdict: 'meets', userScore, required, examLabel };
}

/** Читаемая запись балла: «IELTS 6.5», «TOEFL iBT 88», «не сдан». */
export function formatExamScore(profile: UserProfile): string {
  if (profile.englishExam === 'none_planning' || profile.englishScore === null) {
    return 'не сдан';
  }
  return `${EXAM_LABELS[profile.englishExam]} ${profile.englishScore}`;
}

/** Короткая запись без названия экзамена — для плотных таблиц. */
export function formatExamScoreShort(profile: UserProfile): string {
  if (profile.englishExam === 'none_planning' || profile.englishScore === null) {
    return 'не сдан';
  }
  const short = profile.englishExam === 'duolingo' ? 'DET' : profile.englishExam.toUpperCase();
  return `${short} ${profile.englishScore}`;
}
