import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

const PREFIX = 'pathora:';

/**
 * Сохранение состояния в localStorage.
 *
 * Полноценного бэкенда у прототипа нет — регламент кейса это допускает, если
 * полный путь работает. Поэтому весь прогресс абитуриента (анкета, отмеченные
 * шаги, сравнение, избранное и текущий экран) переживает перезагрузку страницы.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = `${PREFIX}${key}`;

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Приватный режим браузера или переполненное хранилище — приложение
      // продолжает работать, просто без сохранения между сессиями.
    }
  }, [storageKey, value]);

  return [value, setValue];
}

/** Полный сброс сохранённого состояния Pathora. */
export function useClearStorage(): () => void {
  return useCallback(() => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch {
      // ничего не делаем: сброс состояния в памяти выполняется вызывающим кодом
    }
  }, []);
}
