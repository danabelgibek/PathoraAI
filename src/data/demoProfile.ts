import { UserProfile } from '../types';

/** Профиль по умолчанию — им же заполняется анкета при первом запуске. */
export const DEMO_PROFILE: UserProfile = {
  name: 'Данияр Ибраев',
  age: 17,
  educationLevel: 'high_school_11',
  currentGradeDescription: '11 класс, лицей с углублённой математикой и информатикой',
  targetDegree: 'bachelor',
  targetField: 'Computer Science / Data Science',
  subSpecialty: 'Artificial Intelligence & Software Engineering',
  gpa: 4.5,
  gpaScale: 5.0,
  englishExam: 'ielts',
  englishScore: 6.5,
  secondLanguage: 'Немецкий A1 (в процессе)',
  preferredCountries: ['Germany', 'Netherlands', 'South Korea'],
  annualBudgetUSD: 12000,
  needsScholarship: true,
  targetIntake: 'fall_2027',
  academicAchievements: [
    'Призёр республиканской олимпиады по информатике',
    'Пет-проект на Python/React: бот для анализа успеваемости',
    'Сертификат CS50: Introduction to Computer Science (Harvard/edX)',
  ],
};

export interface ProfilePreset {
  id: string;
  label: string;
  description: string;
  profile: UserProfile;
}

/**
 * Готовые сценарии для быстрой проверки того, как меняется результат при смене
 * ключевых ответов: бюджета, страны, языкового экзамена и уровня образования.
 */
export const PROFILE_PRESETS: ProfilePreset[] = [
  {
    id: 'base_cs',
    label: 'Базовый: 11 класс, CS, $12 000',
    description: 'GPA 4.5, IELTS 6.5, Германия / Нидерланды / Корея',
    profile: DEMO_PROFILE,
  },
  {
    id: 'low_budget',
    label: 'Жёсткий бюджет: $4 000, только Германия',
    description: 'Проверяет финансовые ограничения и приоритет бесплатного обучения',
    profile: {
      ...DEMO_PROFILE,
      name: 'Алишер Сапаров',
      preferredCountries: ['Germany'],
      annualBudgetUSD: 4000,
      secondLanguage: 'Немецкий A2',
      needsScholarship: true,
    },
  },
  {
    id: 'toefl_no_exam',
    label: 'Экзамен не сдан: подготовка с нуля',
    description: 'Проверяет, как в маршрут добавляется срочный блок подготовки к тесту',
    profile: {
      ...DEMO_PROFILE,
      name: 'Тимур Мухамедов',
      englishExam: 'none_planning',
      englishScore: null,
      targetIntake: 'spring_2027',
    },
  },
  {
    id: 'toefl_strong',
    label: 'TOEFL 105 и бюджет $25 000',
    description: 'Проверяет пересчёт под другую шкалу экзамена и широкий бюджет',
    profile: {
      ...DEMO_PROFILE,
      name: 'Камила Турсынова',
      preferredCountries: ['Netherlands', 'Italy'],
      annualBudgetUSD: 25000,
      englishExam: 'toefl',
      englishScore: 105,
      needsScholarship: false,
    },
  },
];
