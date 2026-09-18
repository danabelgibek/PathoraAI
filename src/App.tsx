import { useCallback, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UniversityDetailModal } from './components/UniversityDetailModal';
import { LandingView } from './views/LandingView';
import { QuestionnaireView } from './views/QuestionnaireView';
import { DiagnosisView } from './views/DiagnosisView';
import { RecommendationsView } from './views/RecommendationsView';
import { ComparisonView } from './views/ComparisonView';
import { RoadmapView } from './views/RoadmapView';
import { DashboardView } from './views/DashboardView';

import {
  AdmissionRoadmap,
  AppView,
  SmartNotification,
  University,
  UserProfile,
} from './types';
import { DEMO_PROFILE } from './data/demoProfile';
import { evaluateProfileDiagnosis } from './lib/diagnosis';
import { matchUniversities } from './lib/matching';
import { generatePersonalizedRoadmap } from './lib/roadmap';
import { buildNotifications } from './lib/notifications';
import { useClearStorage, usePersistentState } from './lib/storage';

export default function App() {
  const clearStorage = useClearStorage();

  const [currentView, setCurrentView] = usePersistentState<AppView>('view', 'landing');
  const [profile, setProfile] = usePersistentState<UserProfile>('profile', DEMO_PROFILE);
  const [selectedUniId, setSelectedUniId] = usePersistentState<string>('target-uni', '');
  const [comparisonList, setComparisonList] = usePersistentState<string[]>('comparison', []);
  const [savedList, setSavedList] = usePersistentState<string[]>('saved', []);
  const [completedTaskIds, setCompletedTaskIds] = usePersistentState<string[]>('tasks', []);
  const [readNotificationIds, setReadNotificationIds] = usePersistentState<string[]>(
    'notifications-read',
    [],
  );

  const [modalUniversity, setModalUniversity] = useState<University | null>(null);

  const matchedUniversities = useMemo(() => matchUniversities(profile), [profile]);

  const diagnosis = useMemo(
    () => evaluateProfileDiagnosis(profile, matchedUniversities),
    [profile, matchedUniversities],
  );

  // Если сохранённый целевой вуз больше не проходит подбор, берём лучший вариант.
  const targetUniversity = useMemo(
    () =>
      matchedUniversities.find(u => u.id === selectedUniId) ??
      matchedUniversities.find(u => u.isPreferredCountry) ??
      matchedUniversities[0],
    [matchedUniversities, selectedUniId],
  );

  const roadmap = useMemo<AdmissionRoadmap>(() => {
    if (!targetUniversity) return { stages: [], overallProgressPercent: 0 };

    const completed = new Set(completedTaskIds);
    const stages = generatePersonalizedRoadmap(profile, targetUniversity).map(stage => ({
      ...stage,
      tasks: stage.tasks.map(task => ({ ...task, completed: completed.has(task.id) })),
    }));

    const all = stages.flatMap(s => s.tasks);
    const done = all.filter(t => t.completed).length;

    return {
      stages,
      overallProgressPercent: all.length === 0 ? 0 : Math.round((done / all.length) * 100),
    };
  }, [profile, targetUniversity, completedTaskIds]);

  const notifications = useMemo<SmartNotification[]>(() => {
    const read = new Set(readNotificationIds);
    return buildNotifications(profile, diagnosis, matchedUniversities, roadmap).map(n => ({
      ...n,
      read: read.has(n.id),
    }));
  }, [profile, diagnosis, matchedUniversities, roadmap, readNotificationIds]);

  const comparedUniversities = useMemo(
    () =>
      comparisonList
        .map(id => matchedUniversities.find(u => u.id === id))
        .filter((u): u is University => u !== undefined),
    [comparisonList, matchedUniversities],
  );

  const taskStats = useMemo(() => {
    const all = roadmap.stages.flatMap(s => s.tasks);
    return { total: all.length, completed: all.filter(t => t.completed).length };
  }, [roadmap]);

  const navigate = useCallback(
    (view: AppView) => {
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setCurrentView],
  );

  const toggleTask = useCallback(
    (taskId: string) =>
      setCompletedTaskIds(prev =>
        prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId],
      ),
    [setCompletedTaskIds],
  );

  const toggleComparison = useCallback(
    (uniId: string) =>
      setComparisonList(prev =>
        prev.includes(uniId) ? prev.filter(id => id !== uniId) : [...prev, uniId],
      ),
    [setComparisonList],
  );

  const toggleSave = useCallback(
    (uniId: string) =>
      setSavedList(prev =>
        prev.includes(uniId) ? prev.filter(id => id !== uniId) : [...prev, uniId],
      ),
    [setSavedList],
  );

  const selectForRoadmap = useCallback(
    (uni: University) => {
      setSelectedUniId(uni.id);
      navigate('roadmap');
    },
    [navigate, setSelectedUniId],
  );

  const handleNotificationClick = useCallback(
    (notif: SmartNotification) => {
      setReadNotificationIds(prev => (prev.includes(notif.id) ? prev : [...prev, notif.id]));
      if (notif.targetTab) navigate(notif.targetTab);
    },
    [navigate, setReadNotificationIds],
  );

  const markAllNotificationsRead = useCallback(
    () => setReadNotificationIds(notifications.map(n => n.id)),
    [notifications, setReadNotificationIds],
  );

  const resetToDemo = useCallback(() => {
    clearStorage();
    setProfile(DEMO_PROFILE);
    setSelectedUniId('');
    setComparisonList([]);
    setSavedList([]);
    setCompletedTaskIds([]);
    setReadNotificationIds([]);
    navigate('landing');
  }, [
    clearStorage,
    navigate,
    setComparisonList,
    setCompletedTaskIds,
    setProfile,
    setReadNotificationIds,
    setSavedList,
    setSelectedUniId,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header
        currentView={currentView}
        onNavigate={navigate}
        profile={profile}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllNotificationsRead={markAllNotificationsRead}
        comparisonCount={comparisonList.length}
        progressPercent={roadmap.overallProgressPercent}
      />

      <main className="flex-1">
        <ErrorBoundary onReset={resetToDemo}>
          {currentView === 'landing' && (
            <LandingView
              profile={profile}
              sampleUniversity={targetUniversity}
              onStartJourney={() => navigate('questionnaire')}
              onOpenDiagnosis={() => navigate('diagnosis')}
              onExploreUniversities={() => navigate('universities')}
            />
          )}

          {currentView === 'questionnaire' && (
            <QuestionnaireView
              initialProfile={profile}
              onComplete={updated => {
                setProfile(updated);
                navigate('diagnosis');
              }}
              onCancel={() => navigate('landing')}
            />
          )}

          {currentView === 'diagnosis' && (
            <DiagnosisView
              profile={profile}
              diagnosis={diagnosis}
              onProceedToMatches={() => navigate('universities')}
              onEditProfile={() => navigate('questionnaire')}
            />
          )}

          {currentView === 'universities' && (
            <RecommendationsView
              universities={matchedUniversities}
              profile={profile}
              selectedUniId={targetUniversity?.id ?? ''}
              onSelectForRoadmap={selectForRoadmap}
              onOpenDetails={setModalUniversity}
              comparisonList={comparisonList}
              onToggleComparison={toggleComparison}
              savedList={savedList}
              onToggleSave={toggleSave}
              onGoToComparison={() => navigate('comparison')}
              onEditProfile={() => navigate('questionnaire')}
            />
          )}

          {currentView === 'comparison' && (
            <ComparisonView
              comparedUniversities={comparedUniversities}
              profile={profile}
              onRemoveFromComparison={toggleComparison}
              onSelectForRoadmap={selectForRoadmap}
              onGoToUniversities={() => navigate('universities')}
            />
          )}

          {currentView === 'roadmap' && targetUniversity && (
            <RoadmapView
              roadmap={roadmap}
              selectedUniversity={targetUniversity}
              profile={profile}
              allUniversities={matchedUniversities}
              onToggleTask={toggleTask}
              onSelectUniversity={uni => setSelectedUniId(uni.id)}
              onGoToUniversities={() => navigate('universities')}
            />
          )}

          {currentView === 'dashboard' && targetUniversity && (
            <DashboardView
              profile={profile}
              diagnosis={diagnosis}
              targetUniversity={targetUniversity}
              roadmap={roadmap}
              notifications={notifications}
              comparisonCount={comparisonList.length}
              savedCount={savedList.length}
              onNavigate={navigate}
              onToggleTask={toggleTask}
              onOpenNotification={handleNotificationClick}
            />
          )}
        </ErrorBoundary>
      </main>

      <UniversityDetailModal
        university={modalUniversity}
        profile={profile}
        isOpen={modalUniversity !== null}
        onClose={() => setModalUniversity(null)}
        onSelectForRoadmap={selectForRoadmap}
        isCompared={modalUniversity ? comparisonList.includes(modalUniversity.id) : false}
        onToggleComparison={toggleComparison}
      />

      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              P
            </div>
            <span className="font-bold text-slate-800">Pathora</span>
            <span className="hidden sm:inline">
              · навигатор поступления на демонстрационных данных
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>
              Прогресс: {taskStats.completed} из {taskStats.total} шагов
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={resetToDemo}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Сбросить данные и начать заново
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
