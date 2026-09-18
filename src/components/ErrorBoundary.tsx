import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Перехватывает ошибки отрисовки, чтобы сбой одного экрана не превращался
 * в белую страницу: пользователь видит понятное сообщение и может вернуться
 * к рабочему состоянию, не теряя приложение целиком.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Pathora: ошибка отрисовки экрана', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">Экран не удалось отобразить</h2>
          <p className="text-xs text-slate-500">
            Произошла непредвиденная ошибка. Сохранённые данные анкеты можно сбросить и
            пройти путь заново — остальная часть приложения продолжает работать.
          </p>

          <p className="text-[11px] font-mono text-slate-400 break-words bg-slate-50 rounded-xl p-3 border border-slate-100">
            {error.message}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => {
                this.props.onReset();
                this.setState({ error: null });
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сбросить данные
            </button>
          </div>
        </div>
      </div>
    );
  }
}
