const chartColors = ["#D97757", "#6A8A5A", "#C8923B", "#7A5C9E", "#3E7C8A", "#B85A3B", "#9A6B3E"];

export function prepareChartOption(code: string): {
  option: Record<string, unknown>;
  height: number;
} {
  const parsed: unknown = JSON.parse(code);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new SyntaxError("Chart option must be a JSON object");
  const scrub = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(scrub);
    if (!value || typeof value !== "object") return value;
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === "formatter" && typeof item === "string") continue;
      result[key] = scrub(item);
      if (
        key === "tooltip" &&
        result[key] &&
        typeof result[key] === "object" &&
        !Array.isArray(result[key])
      )
        (result[key] as Record<string, unknown>).renderMode = "richText";
    }
    return result;
  };
  const option = scrub(parsed) as Record<string, unknown>;
  const rawHeight = option.height;
  delete option.height;
  option.tooltip = {
    ...(option.tooltip && typeof option.tooltip === "object" && !Array.isArray(option.tooltip)
      ? option.tooltip
      : {}),
    renderMode: "richText",
  };
  return {
    option,
    height:
      typeof rawHeight === "number" && Number.isFinite(rawHeight)
        ? Math.min(640, Math.max(200, rawHeight))
        : 320,
  };
}

function errorCard(element: HTMLElement, message: string) {
  element.classList.remove("folio-skeleton");
  element.classList.add("folio-render-error");
  element.textContent = message;
}

export async function renderChart(element: HTMLElement, dark: boolean): Promise<() => void> {
  let active = true;
  let instance: import("echarts").ECharts | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let option: Record<string, unknown>;
  let height: number;
  try {
    ({ option, height } = prepareChartOption(element.dataset.code ?? ""));
  } catch {
    errorCard(element, "图表配置不是合法 JSON");
    return () => {};
  }
  element.style.height = `${height}px`;
  try {
    const echarts = await import("echarts");
    if (!active || !element.isConnected) return () => {};
    const tokens = getComputedStyle(element);
    const color = (name: string) => tokens.getPropertyValue(name).trim();
    const axis = {
      lineStyle: { color: color("--hairline") },
      axisLabel: { color: color("--ink-2") },
    };
    echarts.registerTheme(dark ? "folio-dark" : "folio-light", {
      color: chartColors,
      backgroundColor: "transparent",
      textStyle: { color: color("--ink-2"), fontFamily: color("--font-ui") },
      title: { textStyle: { color: color("--ink-2"), fontFamily: color("--font-ui") } },
      legend: { textStyle: { color: color("--ink-2"), fontFamily: color("--font-ui") } },
      categoryAxis: { ...axis, splitLine: { lineStyle: { color: color("--hairline") } } },
      valueAxis: { ...axis, splitLine: { lineStyle: { color: color("--hairline") } } },
    });
    instance = echarts.init(element, dark ? "folio-dark" : "folio-light", { renderer: "svg" });
    instance.setOption(option);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => instance?.resize());
      resizeObserver.observe(element);
    }
    element.classList.remove("folio-skeleton");
    element.classList.add("folio-ready");
  } catch (error) {
    if (active) errorCard(element, `图表渲染失败：${String(error)}`);
  }
  return () => {
    active = false;
    resizeObserver?.disconnect();
    instance?.dispose();
  };
}
