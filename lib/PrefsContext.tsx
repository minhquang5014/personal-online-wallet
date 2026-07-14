import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { DEFAULT_PREFS, loadPrefs, Prefs, savePrefs } from './prefs';

interface PrefsContextValue {
  prefs: Prefs;
  /** Đã đọc xong dữ liệu từ máy chưa (trước đó dùng giá trị mặc định). */
  ready: boolean;
  /** Cập nhật một phần tuỳ chọn rồi lưu xuống máy. */
  update: (patch: Partial<Prefs>) => Promise<void>;
}

const PrefsContext = createContext<PrefsContextValue>({
  prefs: DEFAULT_PREFS,
  ready: false,
  update: async () => {},
});

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  // Giữ giá trị mới nhất để `update` không đọc phải state cũ trong closure.
  const prefsRef = useRef<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    loadPrefs().then((p) => {
      prefsRef.current = p;
      setPrefs(p);
      setReady(true);
    });
  }, []);

  const update = useCallback(async (patch: Partial<Prefs>) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    await savePrefs(next);
  }, []);

  return <PrefsContext.Provider value={{ prefs, ready, update }}>{children}</PrefsContext.Provider>;
}

export const usePrefs = () => useContext(PrefsContext);
