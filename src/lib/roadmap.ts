import {
  RoadmapStage,
  RoadmapTask,
  TaskCategory,
  TaskPriority,
  University,
  UserProfile,
} from '../types';
import { checkLanguage, EXAM_LABELS, normalizeGpaTo5 } from './scoring';
import { deadlineBeforeIntake, intakeOption } from './intake';
import { formatDateRu, formatUSD } from './ui';

/**
 * Построение персонального маршрута поступления.
 *
 * Маршрут зависит от целевого вуза И от профиля: уровня образования, желаемой
 * степени, направления, статуса языкового экзамена, потребности в стипендии и
 * целевого семестра. Все дедлайны считаются от даты начала занятий выбранного
 * семестра; там, где вуз публикует собственную дату, используется она.
 */

interface TaskDraft {
  id: string;
  title: string;
  description: string;
  rationale: string;
  estimatedTime: string;
  priority: TaskPriority;
  category: TaskCategory;
  /** За сколько месяцев до начала занятий шаг должен быть закрыт. */
  monthsBefore: number;
  /** Явная дата (ISO), если вуз публикует собственный дедлайн. */
  fixedISO?: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

const TRANSCRIPT_BY_LEVEL: Record<UserProfile['educationLevel'], string> = {
  high_school_10:
    'Запросить в школе выписку оценок за 9 класс и текущие отметки 10 класса с указанием количества академических часов по профильным предметам.',
  high_school_11:
    'Запросить в школьной канцелярии табель за 10 класс и первую четверть 11 класса с гербовой печатью и количеством академических часов по профильным предметам.',
  high_school_graduated:
    'Получить в школе дубликат аттестата с приложением итоговых оценок и справку о количестве академических часов по профильным предметам.',
  college_student:
    'Получить в колледже академическую справку с перечнем дисциплин, оценками и количеством часов по каждому курсу.',
};

const RECOMMENDER_BY_FIELD = (field: string): string => {
  const f = field.toLowerCase();
  if (/computer|информат|программ|software|data|ai|инженер|engineering|math|матем/.test(f)) {
    return 'учителей математики и информатики';
  }
  if (/био|chem|хим|med|физик|physics|science/.test(f)) {
    return 'учителей профильных естественно-научных предметов';
  }
  if (/econom|business|эконом|бизнес|finance|менедж/.test(f)) {
    return 'учителей математики и обществознания';
  }
  return 'двух преподавателей по профильным для твоего направления предметам';
};

export function generatePersonalizedRoadmap(
  profile: UserProfile,
  targetUni: University,
): RoadmapStage[] {
  const intake = intakeOption(profile.targetIntake);
  const country = targetUni.country;
  const isGermany = country === 'Germany';
  const isNetherlands = country === 'Netherlands';
  const isKorea = country === 'South Korea';
  const isItaly = country === 'Italy';

  const lang = checkLanguage(profile, targetUni.requirements);
  const gpa5 = normalizeGpaTo5(profile.gpa, profile.gpaScale);
  const isFoundation = profile.targetDegree === 'foundation';
  const needsTwelfthYear =
    !isFoundation &&
    profile.educationLevel !== 'college_student' &&
    (isItaly || isGermany);

  const build = (draft: TaskDraft, stageId: string): RoadmapTask => {
    const computed = draft.fixedISO
      ? { iso: draft.fixedISO, overdue: new Date(draft.fixedISO) < new Date() }
      : deadlineBeforeIntake(profile.targetIntake, draft.monthsBefore);

    return {
      id: draft.id,
      stageId,
      title: draft.title,
      description: draft.description,
      rationale: draft.rationale,
      estimatedTime: draft.estimatedTime,
      deadlineISO: computed.iso,
      deadlineFormatted: formatDateRu(computed.iso),
      // Просроченный или сжатый срок автоматически повышает приоритет.
      priority: computed.overdue ? 'urgent' : draft.priority,
      category: draft.category,
      completed: false,
      sourceUrl: draft.sourceUrl,
      sourceLabel: draft.sourceLabel,
    };
  };

  // ------------------------------------------------------------------
  // Этап 1. Документы об образовании и их признание
  // ------------------------------------------------------------------
  const stage1: TaskDraft[] = [
    {
      id: 'task_transcript',
      title: 'Получить официальную выписку оценок',
      description: TRANSCRIPT_BY_LEVEL[profile.educationLevel],
      rationale: `${targetUni.name} проверяет эквивалентность твоего образования: без разбивки по часам приёмная комиссия не может сопоставить программу с национальным стандартом.`,
      estimatedTime: '3–5 дней',
      priority: 'high',
      category: 'academic',
      monthsBefore: 11,
    },
    {
      id: 'task_apostille',
      title: 'Нотариальный перевод и апостиль на документы об образовании',
      description: isGermany
        ? 'Перевести выписку и свидетельство о рождении на немецкий или английский у присяжного переводчика и проставить апостиль.'
        : isItaly
          ? 'Перевести документы на итальянский, проставить апостиль и запросить Declaration of Value в консульстве либо Statement of Comparability в CIMEA.'
          : 'Перевести выписку и свидетельство о рождении на английский у присяжного переводчика и проставить апостиль.',
      rationale:
        'Без апостиля консульства и университеты не принимают иностранные документы об образовании. Процедура занимает недели и блокирует подачу.',
      estimatedTime: '7–10 дней',
      priority: 'high',
      category: 'document',
      monthsBefore: 10,
    },
    {
      id: 'task_prerequisites',
      title: `Проверить пререквизиты программы «${targetUni.programName}»`,
      description: `Сверить свою подготовку с требованиями вуза: ${targetUni.requirements.prerequisites.join('; ')}.`,
      rationale: `Это официальный список условий допуска. Несоответствие любому пункту — самая частая причина отказа ещё до рассмотрения заявки.`,
      estimatedTime: '1 день',
      priority: gpa5 < targetUni.requirements.gpaMin5 ? 'high' : 'medium',
      category: 'academic',
      monthsBefore: 10,
      sourceUrl: targetUni.officialUrl,
      sourceLabel: 'Требования программы на сайте вуза',
    },
  ];

  if (needsTwelfthYear || isFoundation) {
    stage1.push({
      id: 'task_twelfth_year',
      title: isFoundation
        ? 'Выбрать программу Foundation / Studienkolleg и подать заявку'
        : 'Закрыть требование 12 лет образования',
      description: isGermany
        ? 'Определиться между Studienkolleg (T-Kurs для технических направлений) и одним годом обучения в вузе на родине, затем подать документы на выбранный вариант.'
        : isItaly
          ? 'Определиться между Foundation year и одним годом обучения в вузе на родине: итальянские вузы требуют 12 лет школьного образования.'
          : 'Уточнить у вуза, признаётся ли твой аттестат напрямую, и при необходимости подобрать Foundation-программу.',
      rationale: `Университеты выбранной страны (${targetUni.countryLabel}) обычно не дают прямого допуска к бакалавриату после 11 классов. Этот шаг определяет, на какой год обучения ты реально поступаешь.`,
      estimatedTime: '1–2 недели',
      priority: 'high',
      category: 'academic',
      monthsBefore: 11,
      sourceUrl: targetUni.officialUrl,
      sourceLabel: 'Условия допуска на сайте вуза',
    });
  }

  // ------------------------------------------------------------------
  // Этап 2. Язык и вступительные испытания
  // ------------------------------------------------------------------
  const stage2: TaskDraft[] = [];

  if (lang.verdict === 'not_taken') {
    stage2.push({
      id: 'task_exam_register',
      title: `Записаться на ${EXAM_LABELS.ielts} или ${EXAM_LABELS.toefl}`,
      description: `Выбрать центр тестирования и забронировать ближайшую доступную дату. Для ${targetUni.name} нужен результат от ${lang.required} по шкале ${lang.examLabel}.`,
      rationale:
        'Это блокирующий шаг: без сертификата заявку не примет ни одна программа, а свободные слоты на экзамен разбирают за несколько недель.',
      estimatedTime: '1 день',
      priority: 'urgent',
      category: 'exam',
      monthsBefore: 10,
    });
    stage2.push({
      id: 'task_exam_take',
      title: 'Сдать языковой экзамен на проходной балл',
      description: `Набрать минимум ${lang.required} (${lang.examLabel}) — порог программы «${targetUni.programName}».`,
      rationale:
        'Официальный сертификат с номером TRF требуется уже на первом шаге электронной подачи. На пересдачу закладывай ещё 3–4 недели.',
      estimatedTime: '4–6 недель подготовки',
      priority: 'urgent',
      category: 'exam',
      monthsBefore: 8,
    });
  } else if (lang.verdict === 'below') {
    stage2.push({
      id: 'task_exam_retake',
      title: `Пересдать ${lang.examLabel} с ${lang.userScore} минимум на ${lang.required}`,
      description: `Текущий балл ${lang.userScore} ниже порога программы (${lang.required}). Записаться на пересдачу и подтянуть слабые секции.`,
      rationale: `${targetUni.name} отклоняет заявки с языковым баллом ниже порога автоматически, до содержательной оценки досье.`,
      estimatedTime: '4–6 недель',
      priority: 'urgent',
      category: 'exam',
      monthsBefore: 8,
    });
  } else {
    stage2.push({
      id: 'task_exam_verify',
      title: `Подтвердить действительность сертификата ${lang.examLabel} ${lang.userScore}`,
      description: `Балл проходит порог программы (${lang.required}). Проверить, что сертификат не истечёт до подачи (срок действия — 2 года), и заказать отправку результатов в вуз.`,
      rationale:
        'Сертификаты с истекающим сроком — частая причина отклонения комплекта документов на финальной проверке.',
      estimatedTime: '1 день',
      priority: 'medium',
      category: 'exam',
      monthsBefore: 8,
    });
    if (lang.verdict === 'meets' && profile.needsScholarship) {
      stage2.push({
        id: 'task_exam_upgrade',
        title: 'Рассмотреть пересдачу ради стипендиального конкурса',
        description: `Балл ${lang.userScore} проходит формальный порог, но на стипендии конкурируют кандидаты с запасом над минимумом.`,
        rationale:
          'Стипендия отмечена в анкете как приоритет, а языковой балл — один из немногих параметров, который ещё можно улучшить до подачи.',
        estimatedTime: '3–4 недели',
        priority: 'medium',
        category: 'exam',
        monthsBefore: 7,
      });
    }
  }

  if (isGermany && !targetUni.englishOnly) {
    stage2.push({
      id: 'task_german_b2',
      title: 'Получить сертификат по немецкому языку B2/C1',
      description: `Программа «${targetUni.programName}» преподаётся не только на английском: ${targetUni.languageOfInstruction}. Нужен TestDaF, DSH-2 или Goethe C1.`,
      rationale:
        'Это обязательное условие допуска, а не пожелание: без немецкого сертификата заявку на эту программу не примут.',
      estimatedTime: '6–12 месяцев курса',
      priority: 'urgent',
      category: 'exam',
      monthsBefore: 7,
      sourceUrl: targetUni.officialUrl,
      sourceLabel: 'Языковые требования вуза',
    });
  } else if (isGermany) {
    stage2.push({
      id: 'task_german_basics',
      title: 'Пройти базовый курс немецкого языка (A1–A2)',
      description:
        'Программа идёт на английском, но базовый немецкий нужен для вида на жительство, банка, страховки и подработки Werkstudent.',
      rationale:
        'Бытовая интеграция и студенческая подработка в Германии почти невозможны без базового немецкого, а курс требует нескольких месяцев.',
      estimatedTime: '2–3 месяца',
      priority: 'medium',
      category: 'exam',
      monthsBefore: 5,
    });
  }

  if (isNetherlands) {
    stage2.push({
      id: 'task_numerus_fixus',
      title: 'Подготовиться к отбору Numerus Fixus',
      description:
        'Пройти тренировочные тесты по логике, математике и базовому кодингу, которые публикует приёмная комиссия программы.',
      rationale:
        'Отбор в Нидерландах рейтинговый: места распределяются по результатам теста, а не в порядке подачи.',
      estimatedTime: '2–3 недели',
      priority: 'urgent',
      category: 'exam',
      monthsBefore: 8,
      sourceUrl: targetUni.officialUrl,
      sourceLabel: 'Процедура Numerus Fixus',
    });
  }

  if (isItaly) {
    stage2.push({
      id: 'task_tol_test',
      title: 'Зарегистрироваться и сдать вступительный тест TOL',
      description:
        'Пройти онлайн-тест по математике и логике (TOL). Результат SAT от 1250 может заменить TOL — уточни актуальное правило на сайте вуза.',
      rationale: `Без результата TOL или SAT заявка в ${targetUni.name} не рассматривается: это основной инструмент отбора.`,
      estimatedTime: '3 недели подготовки',
      priority: 'urgent',
      category: 'exam',
      monthsBefore: 7,
      sourceUrl: targetUni.officialUrl,
      sourceLabel: 'Регламент теста TOL',
    });
  }

  if (isKorea) {
    stage2.push({
      id: 'task_interview_prep',
      title: 'Подготовиться к интервью на английском',
      description:
        'Отрепетировать рассказ о проектах, мотивации и планах: приёмная комиссия проводит личное интервью с иностранными кандидатами.',
      rationale:
        'Интервью входит в обязательные условия допуска и часто решает исход при равных академических показателях.',
      estimatedTime: '2 недели',
      priority: 'high',
      category: 'exam',
      monthsBefore: 7,
    });
  }

  // ------------------------------------------------------------------
  // Этап 3. Портфолио, эссе и рекомендации
  // ------------------------------------------------------------------
  const achievementsHint =
    profile.academicAchievements.length > 0
      ? `Опереться на то, что уже есть: ${profile.academicAchievements.slice(0, 3).join('; ')}.`
      : 'Достижения в анкете не указаны — сделай опорой конкретные учебные проекты, книги и курсы, которые сформировали интерес к направлению.';

  const stage3: TaskDraft[] = [
    {
      id: 'task_motivation_letter',
      title: `Написать мотивационное письмо для ${targetUni.name}`,
      description: `Связать направление «${profile.targetField}»${profile.subSpecialty ? ` и специализацию «${profile.subSpecialty}»` : ''} с конкретной программой и городом ${targetUni.city}. Структура: путь к направлению → почему именно этот вуз → что планируешь делать после выпуска. ${achievementsHint}`,
      rationale:
        'Приёмные комиссии отсеивают шаблонные заявки в первую очередь. Письмо — единственное место, где профиль объясняется словами, а не цифрами.',
      estimatedTime: '1 неделя',
      priority: 'high',
      category: 'document',
      monthsBefore: 8,
    },
    {
      id: 'task_cv',
      title: 'Составить академическое резюме (Europass / Academic CV)',
      description: `Указать средний балл ${profile.gpa} из ${profile.gpaScale}, ${
        profile.academicAchievements.length > 0
          ? `достижения (${profile.academicAchievements.length} ${profile.academicAchievements.length === 1 ? 'позиция' : 'позиций'})`
          : 'учебные проекты'
      }, языки (${profile.secondLanguage ? `английский, ${profile.secondLanguage}` : 'английский'}) и ссылки на работы по направлению.`,
      rationale:
        'CV — первый документ, который открывает приёмная комиссия. По нему принимается решение, читать ли эссе целиком.',
      estimatedTime: '2 дня',
      priority: 'high',
      category: 'document',
      monthsBefore: 8,
    },
    {
      id: 'task_recommendations',
      title: `Получить 2 рекомендательных письма от ${RECOMMENDER_BY_FIELD(profile.targetField)}`,
      description:
        'Попросить письма на официальном бланке школы или колледжа с печатью и контактами. Заложить время: преподаватели пишут их неделями.',
      rationale: `Для ${targetUni.name} рекомендации входят в обязательный комплект — без них заявка считается неполной.`,
      estimatedTime: '10 дней',
      priority: 'high',
      category: 'document',
      monthsBefore: 7,
    },
  ];

  // ------------------------------------------------------------------
  // Этап 4. Подача заявки
  // ------------------------------------------------------------------
  const primaryDeadline = [...targetUni.deadlines].sort((a, b) =>
    a.date.localeCompare(b.date),
  )[0];

  const stage4: TaskDraft[] = [
    {
      id: 'task_platform_registration',
      title: `Подать документы через ${targetUni.applicationPlatform}`,
      description: `Зарегистрировать профиль, выбрать программу «${targetUni.programName}», загрузить переводы, языковой сертификат и эссе.${
        primaryDeadline ? ` Раунд: ${primaryDeadline.roundName}.` : ''
      }`,
      rationale: primaryDeadline?.note
        ? `${primaryDeadline.note}. Дедлайн жёсткий: заявки после него система не принимает.`
        : 'Заявка попадает в работу приёмной комиссии только после полной загрузки комплекта документов.',
      estimatedTime: '2–4 часа',
      priority: 'urgent',
      category: 'application',
      monthsBefore: 7,
      fixedISO: primaryDeadline?.date,
      sourceUrl: targetUni.officialUrl,
      sourceLabel: 'Страница приёма на сайте вуза',
    },
    {
      id: 'task_application_fee',
      title: 'Оплатить регистрационный взнос за рассмотрение заявки',
      description:
        'Оплатить административный сбор международной картой и сохранить подтверждение транзакции.',
      rationale:
        'До подтверждения оплаты заявка не поступает в работу приёмной комиссии, даже если все документы загружены.',
      estimatedTime: '15 минут',
      priority: 'high',
      category: 'application',
      monthsBefore: 7,
      fixedISO: primaryDeadline?.date,
    },
  ];

  if (isGermany) {
    stage4.unshift({
      id: 'task_uniassist_vpd',
      title: 'Получить VPD через Uni-Assist',
      description:
        'Загрузить сканы аттестата и переводов в Uni-Assist, оплатить сбор и дождаться справки предварительной проверки (VPD).',
      rationale:
        'Обработка VPD занимает 4–6 недель, а без неё подача в портал немецкого вуза технически невозможна. Это самый длинный шаг маршрута.',
      estimatedTime: '1 день + 4–6 недель ожидания',
      priority: 'urgent',
      category: 'application',
      monthsBefore: 8,
      sourceUrl: 'https://www.uni-assist.de/en/',
      sourceLabel: 'Uni-Assist — официальный сайт',
    });
  }

  if (isNetherlands) {
    stage4.unshift({
      id: 'task_studielink',
      title: 'Зарегистрироваться в государственной системе Studielink',
      description: `Создать профиль, выбрать программу «${targetUni.programName}» и получить личный студенческий номер.`,
      rationale:
        'Studielink — единственный вход в нидерландские вузы. Для программ Numerus Fixus регистрация закрывается 15 января в 23:59 CET без исключений.',
      estimatedTime: '2 часа',
      priority: 'urgent',
      category: 'application',
      monthsBefore: 8,
      fixedISO: primaryDeadline?.date,
      sourceUrl: 'https://www.studielink.nl/',
      sourceLabel: 'Studielink — официальный портал',
    });
  }

  if (isItaly) {
    stage4.unshift({
      id: 'task_universitaly',
      title: 'Пройти предзачисление на портале Universitaly',
      description:
        'Заполнить заявку на предзачисление (pre-enrolment) и записаться в итальянское консульство на подачу документов для визы.',
      rationale:
        'Предзачисление через Universitaly — обязательное условие выдачи студенческой визы в Италию, без него консульство не примет комплект.',
      estimatedTime: '1 день',
      priority: 'urgent',
      category: 'application',
      monthsBefore: 6,
      sourceUrl: 'https://www.universitaly.it/',
      sourceLabel: 'Universitaly — государственный портал',
    });
  }

  // ------------------------------------------------------------------
  // Этап 5. Стипендии и финансовое обеспечение
  // ------------------------------------------------------------------
  const stage5: TaskDraft[] = [];
  const availableScholarships = targetUni.scholarshipOpportunities.filter(s => s.available);

  availableScholarships.slice(0, 2).forEach((sch, idx) => {
    stage5.push({
      id: `task_scholarship_${idx}`,
      title: `Подать заявку на стипендию «${sch.name}»`,
      description: `${sch.description} Размер поддержки: ${sch.coverage}. Дедлайн по данным вуза: ${sch.applicationDeadline}.`,
      rationale: profile.needsScholarship
        ? `Стипендия отмечена в анкете как приоритет, а стоимость обучения — ${formatUSD(targetUni.tuitionAnnualUSD)} в год при бюджете ${formatUSD(profile.annualBudgetUSD)}.`
        : 'Стипендиальные конкурсы закрываются раньше основного приёма, поэтому заявку подают параллельно с документами.',
      estimatedTime: '3–4 дня',
      priority:
        profile.needsScholarship || targetUni.tuitionAnnualUSD > profile.annualBudgetUSD
          ? 'high'
          : 'medium',
      category: 'scholarship',
      monthsBefore: 5,
      sourceUrl: targetUni.officialUrl,
      sourceLabel: 'Стипендии на сайте вуза',
    });
  });

  stage5.push({
    id: 'task_financial_proof',
    title: isGermany
      ? 'Открыть блокированный счёт (Sperrkonto)'
      : 'Подготовить подтверждение финансовой состоятельности',
    description: isGermany
      ? 'Открыть счёт через лицензированного провайдера и внести сумму, установленную для студенческой визы ФРГ на текущий год.'
      : `Оформить выписку со счёта спонсора с балансом не ниже стоимости первого года — около ${formatUSD(targetUni.tuitionAnnualUSD + targetUni.livingCostAnnualUSD)}.`,
    rationale:
      'Без официального подтверждения средств миграционная служба отклоняет студенческую визу независимо от решения университета.',
    estimatedTime: '5–7 дней',
    priority: 'high',
    category: 'financial',
    monthsBefore: 4,
  });

  // ------------------------------------------------------------------
  // Этап 6. Зачисление, виза, переезд
  // ------------------------------------------------------------------
  const stage6: TaskDraft[] = [
    {
      id: 'task_accept_offer',
      title: `Подтвердить оффер в личном кабинете ${targetUni.name}`,
      description:
        'Принять предложение о зачислении, подписать договор и отправить финальный документ об образовании с итоговыми оценками.',
      rationale:
        'Университеты аннулируют бронь места, если подтверждение не получено в отведённый срок — обычно это около двух недель.',
      estimatedTime: '1 день',
      priority: 'urgent',
      category: 'application',
      monthsBefore: 3,
    },
    {
      id: 'task_housing',
      title: `Забронировать жильё в городе ${targetUni.city}`,
      description:
        'Подать заявку в университетский жилищный сервис в первый день открытия подачи для первокурсников и параллельно смотреть частные варианты.',
      rationale: targetUni.potentialConcerns.some(c => /жиль|housing|комнат/i.test(c))
        ? `Это отмечено как риск именно для этого вуза: ${targetUni.potentialConcerns.find(c => /жиль|housing|комнат/i.test(c))}`
        : 'В студенческих городах жильё разбирают в первые часы после открытия подачи.',
      estimatedTime: '2–3 часа',
      priority: 'high',
      category: 'visa',
      monthsBefore: 3,
    },
    {
      id: 'task_visa',
      title: 'Подать документы на студенческую визу',
      description:
        'Собрать комплект: письмо о зачислении, финансовое подтверждение, медицинскую страховку — и записаться в консульство.',
      rationale:
        'Рассмотрение национальной студенческой визы занимает от 4 до 8 недель, а запись в консульство приходится ждать отдельно.',
      estimatedTime: '4–8 недель ожидания',
      priority: 'urgent',
      category: 'visa',
      monthsBefore: 2,
    },
  ];

  const definitions: {
    id: string;
    title: string;
    subtitle: string;
    tasks: TaskDraft[];
  }[] = [
    {
      id: 'stage_1_academics',
      title: 'Документы об образовании и их признание',
      subtitle: 'Выписки, апостиль и проверка соответствия требованиям программы',
      tasks: stage1,
    },
    {
      id: 'stage_2_language',
      title: 'Язык и вступительные испытания',
      subtitle: 'Языковой сертификат и отборочные тесты выбранной страны',
      tasks: stage2,
    },
    {
      id: 'stage_3_documents',
      title: 'Портфолио, эссе и рекомендации',
      subtitle: 'Материалы, которые объясняют профиль словами',
      tasks: stage3,
    },
    {
      id: 'stage_4_application',
      title: 'Подача официальной заявки',
      subtitle: targetUni.applicationPlatform,
      tasks: stage4,
    },
    {
      id: 'stage_5_scholarship',
      title: 'Стипендии и финансовое обеспечение',
      subtitle: 'Гранты и подтверждение средств для визы',
      tasks: stage5,
    },
    {
      id: 'stage_6_final',
      title: 'Зачисление, виза и переезд',
      subtitle: 'Оффер, жильё и студенческая виза',
      tasks: stage6,
    },
  ];

  return definitions.map((def, index) => {
    const tasks = def.tasks
      .map(draft => build(draft, def.id))
      .sort((a, b) => a.deadlineISO.localeCompare(b.deadlineISO));

    const first = tasks[0];
    const last = tasks[tasks.length - 1];

    return {
      id: def.id,
      stepNumber: index + 1,
      title: def.title,
      subtitle: def.subtitle,
      timeWindow:
        first && last
          ? first.deadlineISO === last.deadlineISO
            ? formatDateRu(first.deadlineISO)
            : `${formatDateRu(first.deadlineISO)} — ${formatDateRu(last.deadlineISO)}`
          : intake.label,
      tasks,
    };
  });
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2 };

/**
 * Ближайшее лучшее действие: сначала по приоритету, затем по дедлайну.
 * Единственный источник правды — используется и в маршруте, и на дашборде.
 */
export function determineNextBestAction(
  stages: RoadmapStage[],
): { task: RoadmapTask; stage: RoadmapStage } | null {
  const pending = stages.flatMap(stage =>
    stage.tasks.filter(t => !t.completed).map(task => ({ task, stage })),
  );
  if (pending.length === 0) return null;

  return pending.sort((a, b) => {
    const byPriority =
      PRIORITY_WEIGHT[a.task.priority] - PRIORITY_WEIGHT[b.task.priority];
    if (byPriority !== 0) return byPriority;
    const byDeadline = a.task.deadlineISO.localeCompare(b.task.deadlineISO);
    if (byDeadline !== 0) return byDeadline;
    return a.stage.stepNumber - b.stage.stepNumber;
  })[0];
}

/** Ближайшие дедлайны маршрута — для дашборда и уведомлений. */
export function upcomingDeadlines(stages: RoadmapStage[], limit = 4): RoadmapTask[] {
  return stages
    .flatMap(s => s.tasks)
    .filter(t => !t.completed)
    .sort((a, b) => a.deadlineISO.localeCompare(b.deadlineISO))
    .slice(0, limit);
}
