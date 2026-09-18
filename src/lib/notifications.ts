import {
  AdmissionRoadmap,
  ProfileDiagnosis,
  SmartNotification,
  University,
  UserProfile,
} from '../types';
import { catalogCoverage } from './matching';
import { upcomingDeadlines } from './roadmap';
import { formatUSD, relativeDeadline } from './ui';

/**
 * Уведомления строятся из текущего состояния профиля и маршрута, а не хранятся
 * заранее написанным списком: при смене ответов в анкете меняется и содержимое
 * ленты. Каждое уведомление ведёт на конкретный экран и объект.
 */
export function buildNotifications(
  profile: UserProfile,
  diagnosis: ProfileDiagnosis,
  matched: University[],
  roadmap: AdmissionRoadmap,
): SmartNotification[] {
  const items: SmartNotification[] = [];
  const [nearest, second] = upcomingDeadlines(roadmap.stages, 2);

  if (nearest) {
    items.push({
      id: `deadline_${nearest.id}`,
      type: 'deadline',
      title: `Ближайший дедлайн: ${relativeDeadline(nearest.deadlineISO)}`,
      message: `${nearest.title} — до ${nearest.deadlineFormatted}. ${nearest.rationale}`,
      timestamp: 'сейчас',
      read: false,
      priority: nearest.priority === 'urgent' ? 'high' : 'normal',
      targetTab: 'roadmap',
      targetId: nearest.id,
    });
  }

  const coverage = catalogCoverage(profile, matched);
  if (coverage.missingCountries.length > 0 || !coverage.fieldCovered) {
    const parts: string[] = [];
    if (coverage.missingCountries.length > 0) {
      parts.push(
        `по ${coverage.missingCountries.join(', ')} программ в демо-базе пока нет`,
      );
    }
    if (!coverage.fieldCovered) {
      parts.push(`направление «${profile.targetField}» в базе не представлено`);
    }
    items.push({
      id: 'coverage_warning',
      type: 'insight',
      title: 'Ограничение подборки',
      message: `Показываем ближайшие альтернативы: ${parts.join('; ')}. Требования по остальным направлениям проверяйте на сайтах вузов.`,
      timestamp: 'сейчас',
      read: false,
      priority: 'high',
      targetTab: 'universities',
    });
  }

  const topPick = matched.find(u => u.isPreferredCountry) ?? matched[0];
  const scholarship = topPick?.scholarshipOpportunities.find(s => s.available);
  if (topPick && scholarship) {
    items.push({
      id: `scholarship_${topPick.id}`,
      type: 'scholarship',
      title: `Стипендия ${scholarship.name}`,
      message: `${topPick.name}: ${scholarship.coverage}. Дедлайн по данным вуза — ${scholarship.applicationDeadline}. ${
        topPick.tuitionAnnualUSD > profile.annualBudgetUSD
          ? `Обучение ${formatUSD(topPick.tuitionAnnualUSD)} выше твоего бюджета, поэтому грант здесь решающий.`
          : 'Грант освободит часть бюджета на проживание.'
      }`,
      timestamp: 'сейчас',
      read: false,
      priority: profile.needsScholarship ? 'high' : 'normal',
      targetTab: 'universities',
      targetId: topPick.id,
    });
  }

  const weakest = Object.values(diagnosis.breakdown).sort((a, b) => a.score - b.score)[0];
  items.push({
    id: `insight_${weakest.title}`,
    type: 'insight',
    title: `Слабое место профиля: ${weakest.title.toLowerCase()}`,
    message: `${weakest.score} из 100. ${weakest.comment}`,
    timestamp: 'сейчас',
    read: false,
    priority: weakest.status === 'critical' ? 'high' : 'normal',
    targetTab: 'diagnosis',
  });

  if (roadmap.overallProgressPercent > 0) {
    items.push({
      id: 'progress_update',
      type: 'achievement',
      title: `Маршрут пройден на ${roadmap.overallProgressPercent}%`,
      message: second
        ? `Следующий шаг после текущего — «${second.title}» до ${second.deadlineFormatted}.`
        : 'Все оставшиеся шаги видны в маршруте.',
      timestamp: 'сейчас',
      read: false,
      priority: 'normal',
      targetTab: 'roadmap',
    });
  }

  return items;
}
