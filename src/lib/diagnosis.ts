import {
  BreakdownStatus,
  ProfileDiagnosis,
  ReadinessTierId,
  University,
  UserProfile,
} from '../types';
import { UNIVERSITIES } from '../data/universities';
import { countryLabel } from '../data/countries';
import { EXAM_LABELS, normalizeGpaTo5, toIeltsEquivalent } from './scoring';
import { intakeOption, monthsUntilIntake } from './intake';
import { formatUSD } from './ui';

/**
 * Диагностика профиля.
 *
 * Каждое утверждение здесь выводится из данных анкеты — в текстах нет ни одного
 * зашитого числа про конкретного абитуриента. Если признака нет, формулировка не
 * подставляется «по умолчанию», а честно отражает отсутствие данных.
 */

const EDUCATION_LABELS: Record<UserProfile['educationLevel'], string> = {
  high_school_10: '10 класс',
  high_school_11: '11 класс (выпускной)',
  high_school_graduated: 'выпускник школы',
  college_student: 'студент колледжа',
};

function statusFor(score: number): BreakdownStatus {
  if (score >= 85) return 'optimal';
  if (score >= 70) return 'good';
  if (score >= 55) return 'needs_work';
  return 'critical';
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function evaluateProfileDiagnosis(
  profile: UserProfile,
  matched: University[] = [],
): ProfileDiagnosis {
  const gpa5 = normalizeGpaTo5(profile.gpa, profile.gpaScale);
  const gpaText = `${profile.gpa} из ${profile.gpaScale}`;
  const intake = intakeOption(profile.targetIntake);
  const months = Math.max(0, monthsUntilIntake(profile.targetIntake));

  // --- Академическая база ---
  const achievementBonus = Math.min(profile.academicAchievements.length, 4) * 3;
  const levelBonus = profile.educationLevel === 'high_school_11' ? 2 : 0;
  const academicScore = Math.max(
    0,
    Math.min(100, Math.round((gpa5 / 5) * 100 * 0.9 + achievementBonus + levelBonus)),
  );
  const achievementsText =
    profile.academicAchievements.length > 0
      ? `${profile.academicAchievements.length} ${plural(profile.academicAchievements.length, 'достижение', 'достижения', 'достижений')} в портфолио`
      : 'достижения и проекты пока не указаны';
  const academicComment = `Средний балл ${gpaText} — это ${gpa5.toFixed(2)} по пятибалльной шкале, в которой заданы пороги вузов. Статус: ${EDUCATION_LABELS[profile.educationLevel]}, ${achievementsText}.`;

  // --- Язык ---
  const band = toIeltsEquivalent(profile.englishExam, profile.englishScore);
  let languageScore: number;
  let languageComment: string;
  if (band === null) {
    languageScore = 35;
    languageComment =
      'Языковой сертификат ещё не получен. Без него нельзя подать документы ни в одну программу базы — это первый блокирующий шаг маршрута.';
  } else {
    const examName = EXAM_LABELS[profile.englishExam];
    const eligible = UNIVERSITIES.filter(
      u => band >= (toIeltsEquivalent('ielts', u.requirements.ieltsMin) ?? 9),
    ).length;
    if (band >= 7.5) languageScore = 96;
    else if (band >= 7) languageScore = 88;
    else if (band >= 6.5) languageScore = 78;
    else if (band >= 6) languageScore = 66;
    else if (band >= 5.5) languageScore = 52;
    else languageScore = 42;

    const equivalent =
      profile.englishExam === 'ielts'
        ? ''
        : ` (эквивалент IELTS ≈ ${band.toFixed(1)})`;
    languageComment = `${examName} ${profile.englishScore}${equivalent} проходит языковой порог в ${eligible} из ${UNIVERSITIES.length} программ базы.`;
  }

  // --- Финансы ---
  const affordable = UNIVERSITIES.filter(
    u => u.tuitionAnnualUSD <= profile.annualBudgetUSD,
  ).length;
  const fullyAffordable = UNIVERSITIES.filter(
    u => u.tuitionAnnualUSD + u.livingCostAnnualUSD <= profile.annualBudgetUSD,
  ).length;
  const financialScore = Math.round(40 + 55 * (affordable / UNIVERSITIES.length));
  const financialComment = `Бюджет ${formatUSD(profile.annualBudgetUSD)} в год покрывает обучение в ${affordable} из ${UNIVERSITIES.length} программ базы, а вместе с проживанием — в ${fullyAffordable}. ${
    profile.needsScholarship
      ? 'Стипендия отмечена как приоритет, поэтому маршрут включает отдельный блок заявок на гранты.'
      : 'Стипендия не отмечена как обязательная, но подача на гранты всё равно повышает шансы.'
  }`;

  // --- Сроки ---
  let timelineScore: number;
  if (months >= 12) timelineScore = 92;
  else if (months >= 9) timelineScore = 85;
  else if (months >= 6) timelineScore = 70;
  else if (months >= 4) timelineScore = 55;
  else timelineScore = 38;
  const timelineComment = `До начала занятий (${intake.label.toLowerCase()}) остаётся около ${months} ${plural(months, 'месяца', 'месяцев', 'месяцев')}. ${
    months >= 9
      ? 'Этого достаточно на признание документов, языковой сертификат и подачу без спешки.'
      : months >= 6
        ? 'Сроки сжатые: апостилирование и признание аттестата нужно запускать в первую очередь.'
        : 'Времени критически мало — часть дедлайнов приёмных кампаний уже закрыта или закроется в ближайшие недели.'
  }`;

  const overallScore = Math.round(
    academicScore * 0.35 + languageScore * 0.25 + financialScore * 0.25 + timelineScore * 0.15,
  );

  let readinessTierId: ReadinessTierId = 'competitive';
  if (overallScore >= 85) readinessTierId = 'high';
  else if (overallScore < 68) readinessTierId = 'needs_prep';

  const readinessTier =
    readinessTierId === 'high'
      ? 'Высокая готовность'
      : readinessTierId === 'competitive'
        ? 'Хорошие шансы с доработкой'
        : 'Требуется усиление';
  const readinessTierEn =
    readinessTierId === 'high'
      ? 'High readiness'
      : readinessTierId === 'competitive'
        ? 'Competitive with targeted prep'
        : 'Needs foundational prep';

  const categories = [
    { key: 'academic', score: academicScore, title: 'академическая база' },
    { key: 'language', score: languageScore, title: 'языковая подготовка' },
    { key: 'financial', score: financialScore, title: 'финансовые возможности' },
    { key: 'timeline', score: timelineScore, title: 'запас времени' },
  ].sort((a, b) => b.score - a.score);
  const strongest = categories[0];
  const weakest = categories[categories.length - 1];

  // --- Сильные стороны ---
  const strengths: string[] = [];
  if (gpa5 >= 4.3) {
    strengths.push(
      `Успеваемость ${gpaText} выше входного порога большинства программ базы (${UNIVERSITIES.filter(u => gpa5 >= u.requirements.gpaMin5).length} из ${UNIVERSITIES.length}).`,
    );
  }
  if (profile.academicAchievements.length > 0) {
    strengths.push(
      `Профильные достижения: ${profile.academicAchievements.slice(0, 2).join('; ')}${profile.academicAchievements.length > 2 ? ` и ещё ${profile.academicAchievements.length - 2}` : ''}. Это материал для мотивационного письма и CV.`,
    );
  }
  if (band !== null && band >= 6.5) {
    strengths.push(
      `${EXAM_LABELS[profile.englishExam]} ${profile.englishScore} снимает языковой барьер — документы можно подавать без пересдачи.`,
    );
  }
  if (affordable >= UNIVERSITIES.length / 2) {
    strengths.push(
      `Бюджет ${formatUSD(profile.annualBudgetUSD)} оставляет широкий выбор: ${affordable} ${plural(affordable, 'программа доступна', 'программы доступны', 'программ доступны')} без полного гранта.`,
    );
  }
  if (months >= 10) {
    strengths.push(
      `Запас времени в ${months} ${plural(months, 'месяц', 'месяца', 'месяцев')} позволяет пройти признание документов и усилить профиль до подачи.`,
    );
  }
  if (strengths.length === 0) {
    strengths.push(
      `Самая сильная часть профиля сейчас — ${strongest.title} (${strongest.score} из 100). На неё и стоит опираться в заявке.`,
    );
    strengths.push(
      'Цель и ограничения зафиксированы — это уже позволяет построить конкретный маршрут вместо общего поиска.',
    );
  }

  // --- Ограничения ---
  const constraints: string[] = [];
  if (band === null) {
    constraints.push(
      'Нет языкового сертификата: подача документов невозможна до получения результата, а сессии IELTS/TOEFL нужно бронировать заранее.',
    );
  } else if (band < 6.5) {
    constraints.push(
      `${EXAM_LABELS[profile.englishExam]} ${profile.englishScore} (эквивалент IELTS ≈ ${band.toFixed(1)}) закрывает часть программ: порог 6.5 требуют ${UNIVERSITIES.filter(u => u.requirements.ieltsMin >= 6.5).length} из ${UNIVERSITIES.length}.`,
    );
  }
  const tooExpensive = UNIVERSITIES.filter(
    u => u.tuitionAnnualUSD > profile.annualBudgetUSD,
  ).length;
  if (tooExpensive > 0) {
    constraints.push(
      `${tooExpensive} ${plural(tooExpensive, 'программа выходит', 'программы выходят', 'программ выходят')} за бюджет ${formatUSD(profile.annualBudgetUSD)} — по ним поступление реалистично только со стипендией.`,
    );
  }
  if (gpa5 < 4.3) {
    constraints.push(
      `Средний балл ${gpaText} (${gpa5.toFixed(2)} из 5) ниже порога ${UNIVERSITIES.filter(u => gpa5 < u.requirements.gpaMin5).length} ${plural(UNIVERSITIES.filter(u => gpa5 < u.requirements.gpaMin5).length, 'программы', 'программ', 'программ')} базы.`,
    );
  }
  if (profile.educationLevel !== 'college_student' && profile.targetDegree === 'bachelor') {
    constraints.push(
      'Аттестат за 11 лет в ряде стран (Германия, Италия) требует признания через Studienkolleg, Foundation или год обучения в вузе на родине.',
    );
  }
  if (months < 9) {
    constraints.push(
      `До начала занятий ${months} ${plural(months, 'месяц', 'месяца', 'месяцев')} — часть дедлайнов приёмных кампаний придётся проходить в сжатом режиме.`,
    );
  }
  if (constraints.length === 0) {
    constraints.push(
      `Самое слабое место профиля сейчас — ${weakest.title} (${weakest.score} из 100). Критических блокеров не найдено, но именно здесь запас прочности минимальный.`,
    );
  }

  // --- Точки роста ---
  const recommendedImprovements: string[] = [];
  if (band === null) {
    recommendedImprovements.push(
      'Записаться на ближайшую сессию языкового экзамена — это блокирующий шаг, всё остальное можно делать параллельно.',
    );
  } else if (band < 7) {
    recommendedImprovements.push(
      `Поднять ${EXAM_LABELS[profile.englishExam]} до эквивалента IELTS 7.0: стипендиальные комитеты почти всегда отдают приоритет кандидатам выше формального порога.`,
    );
  }
  recommendedImprovements.push(
    'Оформить нотариальный перевод и апостиль на школьные документы — процедура занимает недели и блокирует подачу.',
  );
  if (profile.academicAchievements.length < 3) {
    recommendedImprovements.push(
      'Дополнить портфолио: олимпиады, проекты или онлайн-сертификаты по направлению заметно усиливают заявку при пограничном GPA.',
    );
  }
  const topPicks = matched.filter(u => u.isPreferredCountry).slice(0, 2);
  if (topPicks.length > 0) {
    recommendedImprovements.push(
      `Изучить требования приоритетных вариантов — ${topPicks.map(u => u.name).join(' и ')} — и подготовить документы под их формат.`,
    );
  }
  if (profile.needsScholarship) {
    const earliest = matched
      .flatMap(u => u.scholarshipOpportunities.filter(s => s.available))
      .slice(0, 1);
    recommendedImprovements.push(
      earliest.length > 0
        ? `Заранее подать на стипендии: ближайшая в подборке — ${earliest[0].name} (дедлайн ${earliest[0].applicationDeadline}).`
        : 'Заранее подать заявки на стипендии: у грантов дедлайны раньше основного приёма.',
    );
  }

  const degreeWord = profile.targetDegree === 'foundation' ? 'подготовительный год' : 'бакалавриат';
  const countriesText =
    profile.preferredCountries.length > 0
      ? profile.preferredCountries.map(countryLabel).join(' / ')
      : 'страны пока не выбраны';
  const goalStatement = `${degreeWord[0].toUpperCase()}${degreeWord.slice(1)} по направлению «${profile.targetField}» — ${countriesText}, старт ${intake.label.toLowerCase()}, бюджет до ${formatUSD(profile.annualBudgetUSD)} в год.`;

  const summary = `Профиль ${profile.name}: ${EDUCATION_LABELS[profile.educationLevel]}, средний балл ${gpaText}, ${
    band === null ? 'языковой сертификат не получен' : `${EXAM_LABELS[profile.englishExam]} ${profile.englishScore}`
  }, бюджет ${formatUSD(profile.annualBudgetUSD)} в год. Индекс готовности — ${overallScore} из 100: сильнее всего ${strongest.title}, слабее всего ${weakest.title}. Маршрут ниже выстроен так, чтобы закрыть именно это слабое место до начала приёма.`;

  return {
    overallScore,
    readinessTierId,
    readinessTier,
    readinessTierEn,
    summary,
    goalStatement,
    breakdown: {
      academic: {
        score: academicScore,
        maxScore: 100,
        status: statusFor(academicScore),
        title: 'Академическая успеваемость',
        comment: academicComment,
      },
      language: {
        score: languageScore,
        maxScore: 100,
        status: statusFor(languageScore),
        title: 'Языковая сертификация',
        comment: languageComment,
      },
      financial: {
        score: financialScore,
        maxScore: 100,
        status: statusFor(financialScore),
        title: 'Финансовое соответствие',
        comment: financialComment,
      },
      timeline: {
        score: timelineScore,
        maxScore: 100,
        status: statusFor(timelineScore),
        title: 'Запас времени и сроки',
        comment: timelineComment,
      },
    },
    strengths,
    constraints,
    recommendedImprovements,
    disclaimer:
      'Демонстрационная оценка. Индекс готовности рассчитан правилами Pathora по данным анкеты и демо-набору требований вузов, сверенному 17 сентября 2026 года. Это не прогноз зачисления и не гарантия: итоговое решение принимает приёмная комиссия, а актуальные требования всегда смотрите на сайте университета.',
  };
}
