import { Info } from 'lucide-react';
import { DATA_CHECKED_ON } from '../data/universities';
import { formatDateRu } from '../lib/ui';

interface Props {
  /** Компактный вариант — для плотных заголовков экранов. */
  compact?: boolean;
  className?: string;
}

/**
 * Обязательная пометка о характере данных.
 *
 * Требования и дедлайны в Pathora — демонстрационный набор, сверенный вручную.
 * Плашка выводится на каждом экране, где абитуриент видит фактические требования,
 * стоимость или даты, вместе с датой последней сверки.
 */
export function DemoDataNotice({ compact = false, className = '' }: Props) {
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium ${className}`}
      >
        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
        Демо-данные · сверено {formatDateRu(DATA_CHECKED_ON)}
      </span>
    );
  }

  return (
    <div
      className={`flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs ${className}`}
    >
      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      <span>
        <strong className="font-semibold">Демонстрационные данные.</strong> Требования,
        стоимость и дедлайны собраны вручную {formatDateRu(DATA_CHECKED_ON)} и приведены к
        единому формату. Перед подачей сверяйте их по ссылке на официальный сайт вуза —
        приёмные кампании меняются.
      </span>
    </div>
  );
}
