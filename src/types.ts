export type EducationLevel =
  | 'high_school_10'
  | 'high_school_11'
  | 'high_school_graduated'
  | 'college_student';

export type TargetDegree = 'bachelor' | 'foundation';

export type EnglishExamType = 'ielts' | 'toefl' | 'duolingo' | 'none_planning';

/** Целевой семестр поступления. Из него считается вся шкала дедлайнов маршрута. */
export type IntakeId = 'spring_2027' | 'fall_2027' | 'fall_2028';

export interface UserProfile {
  name: string;
  age: number;
  educationLevel: EducationLevel;
  currentGradeDescription: string;
  targetDegree: TargetDegree;
  targetField: string;
  subSpecialty: string;
  gpa: number;
  gpaScale: number;
  englishExam: EnglishExamType;
  /** Балл в шкале выбранного экзамена (IELTS 4–9, TOEFL 0–120, Duolingo 10–160). */
  englishScore: number | null;
  secondLanguage: string;
  preferredCountries: string[];
  annualBudgetUSD: number;
  needsScholarship: boolean;
  targetIntake: IntakeId;
  academicAchievements: string[];
}

export type BreakdownStatus = 'optimal' | 'good' | 'needs_work' | 'critical';

export interface ScoreCategoryBreakdown {
  score: number;
  maxScore: number;
  status: BreakdownStatus;
  title: string;
  comment: string;
}

export type ReadinessTierId = 'high' | 'competitive' | 'needs_prep';

export interface ProfileDiagnosis {
  overallScore: number;
  readinessTierId: ReadinessTierId;
  readinessTier: string;
  readinessTierEn: string;
  summary: string;
  goalStatement: string;
  breakdown: {
    academic: ScoreCategoryBreakdown;
    language: ScoreCategoryBreakdown;
    financial: ScoreCategoryBreakdown;
    timeline: ScoreCategoryBreakdown;
  };
  strengths: string[];
  constraints: string[];
  recommendedImprovements: string[];
  disclaimer: string;
}

export interface UniversityRequirement {
  gpaMin5: number;
  ieltsMin: number;
  toeflMin: number;
  duolingoMin: number;
  satRequired: boolean;
  satRecommendedScore?: number;
  prerequisites: string[];
}

export interface UniversityDeadline {
  roundName: string;
  date: string;
  formattedDate: string;
  isUrgent?: boolean;
  note?: string;
}

export type MatchReasonCategory =
  | 'program'
  | 'country'
  | 'budget'
  | 'language'
  | 'academic';

export interface MatchReason {
  category: MatchReasonCategory;
  status: 'positive' | 'neutral' | 'warning';
  text: string;
}

export interface University {
  id: string;
  name: string;
  nativeName: string;
  country: string;
  countryLabel: string;
  city: string;
  flag: string;
  logoText: string;
  rankingGlobal: number;
  rankingSubject: number;
  programName: string;
  degree: TargetDegree;
  /** Ключевые слова направления — используются для оценки соответствия интересу абитуриента. */
  fieldTags: string[];
  /** Чем именно сильна программа — основа аргумента «почему подходит» по направлению. */
  programHighlight: string;
  languageOfInstruction: string;
  englishOnly: boolean;
  tuitionAnnualUSD: number;
  semesterFeeUSD: number;
  livingCostAnnualUSD: number;
  scholarshipOpportunities: {
    available: boolean;
    name: string;
    coverage: string;
    description: string;
    applicationDeadline: string;
  }[];
  requirements: UniversityRequirement;
  deadlines: UniversityDeadline[];
  applicationPlatform: string;
  documentsRequired: string[];
  potentialConcerns: string[];
  officialUrl: string;
  /** Дата, на которую данные были сверены с официальным сайтом вуза (демо-набор). */
  dataCheckedOn: string;

  // --- Поля, вычисляемые движком подбора под конкретный профиль ---
  matchScore: number;
  matchTier: 'Target' | 'Safety' | 'Reach';
  matchReasons: MatchReason[];
  /** Входит ли страна вуза в выбранные абитуриентом. */
  isPreferredCountry: boolean;
}

/** Университет до расчёта соответствия: без персональных полей. */
export type UniversityRecord = Omit<
  University,
  'matchScore' | 'matchTier' | 'matchReasons' | 'isPreferredCountry'
>;

export type TaskCategory =
  | 'academic'
  | 'exam'
  | 'document'
  | 'application'
  | 'scholarship'
  | 'visa'
  | 'financial';

export type TaskPriority = 'urgent' | 'high' | 'medium';

export interface RoadmapTask {
  id: string;
  stageId: string;
  title: string;
  description: string;
  /** Почему этот шаг важен именно сейчас — показывается в интерфейсе. */
  rationale: string;
  estimatedTime: string;
  /** ISO-дата дедлайна, пересчитывается под целевой семестр профиля. */
  deadlineISO: string;
  deadlineFormatted: string;
  priority: TaskPriority;
  category: TaskCategory;
  completed: boolean;
  /** Ссылка на первоисточник требования, если он есть. */
  sourceUrl?: string;
  sourceLabel?: string;
}

export interface RoadmapStage {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  timeWindow: string;
  tasks: RoadmapTask[];
}

export interface AdmissionRoadmap {
  stages: RoadmapStage[];
  overallProgressPercent: number;
}

export type NotificationType = 'deadline' | 'insight' | 'achievement' | 'scholarship';

export interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'normal';
  targetTab?: AppView;
  /** id задачи или вуза, к которому относится уведомление. */
  targetId?: string;
}

export type AppView =
  | 'landing'
  | 'questionnaire'
  | 'diagnosis'
  | 'universities'
  | 'comparison'
  | 'roadmap'
  | 'dashboard';
