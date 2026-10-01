import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { platform } from "../../lib/platform";
import { applyTheme, readTheme, resolveTheme, type ThemeSetting } from "../../lib/theme";
import { useSetting } from "../../lib/useSetting";

export function useAppTheme(syncMenu: () => void) {
  const [setting, setSetting] = useSetting("theme");
  const [theme, setTheme] = useState<"light" | "dark">(() => resolveTheme(readTheme()));
  const settingRef = useRef<ThemeSetting>(setting);
  const pending = useRef(Promise.resolve());
  const version = useRef(0);
  const switching = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTheme = useCallback(
    (value: ThemeSetting, actual: "light" | "dark") => {
      const root = document.documentElement;
      if (transitionTimer.current !== null) clearTimeout(transitionTimer.current);
      if (
        root.dataset.theme !== undefined &&
        root.dataset.theme !== actual &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        root.dataset.themeSwitching = "";
        void getComputedStyle(root).transitionProperty;
        transitionTimer.current = setTimeout(() => {
          delete root.dataset.themeSwitching;
          transitionTimer.current = null;
        }, 260);
      } else {
        delete root.dataset.themeSwitching;
        transitionTimer.current = null;
      }
      applyTheme(value, actual);
      flushSync(() => {
        setSetting(value);
        setTheme(actual);
      });
      syncMenu();
    },
    [syncMenu],
  );

  const changeTheme = useCallback(
    (value: ThemeSetting) => {
      settingRef.current = value;
      switching.current = true;
      const current = ++version.current;
      pending.current = pending.current
        .catch(() => {})
        .then(async () => {
          if (current !== version.current) return;
          try {
            await platform.setThemeOverride(value === "system" ? null : value);
            const actual = value === "system" ? await platform.getSystemTheme() : value;
            if (current === version.current) showTheme(value, actual);
          } finally {
            if (current === version.current) switching.current = false;
          }
        });
    },
    [showTheme],
  );

  useEffect(() => {
    let active = true;
    const current = ++version.current;
    pending.current = pending.current
      .catch(() => {})
      .then(async () => {
        if (current !== version.current) return;
        await platform.setThemeOverride(
          settingRef.current === "system" ? null : settingRef.current,
        );
        const actual =
          settingRef.current === "system" ? await platform.getSystemTheme() : settingRef.current;
        if (active && current === version.current) showTheme(settingRef.current, actual);
      });
    let unsubscribe: (() => void) | undefined;
    void platform
      .onSystemThemeChanged((actual) => {
        if (active && settingRef.current === "system" && !switching.current)
          showTheme("system", actual);
      })
      .then((stop) => {
        if (active) unsubscribe = stop;
        else stop();
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [showTheme]);

  useEffect(
    () => () => {
      if (transitionTimer.current !== null) clearTimeout(transitionTimer.current);
      delete document.documentElement.dataset.themeSwitching;
    },
    [],
  );

  return { setting, theme, settingRef, changeTheme };
}
