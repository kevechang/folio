export function scheduleIdle(task: () => void, delay = 0): () => void {
  let cancelled = false;
  let timer = 0;
  let idle = 0;
  timer = setTimeout(() => {
    if (cancelled) return;
    if ("requestIdleCallback" in globalThis) {
      idle = globalThis.requestIdleCallback(() => {
        if (!cancelled) task();
      });
    } else {
      timer = setTimeout(() => {
        if (!cancelled) task();
      }, 0);
    }
  }, delay);
  return () => {
    cancelled = true;
    clearTimeout(timer);
    if (idle && "cancelIdleCallback" in globalThis) globalThis.cancelIdleCallback(idle);
  };
}
