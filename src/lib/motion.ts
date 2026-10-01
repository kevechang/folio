export const spring = {
  snappy: { type: "spring", visualDuration: 0.24, bounce: 0.14 },
  smooth: { type: "spring", visualDuration: 0.34, bounce: 0.1 },
  gentle: { type: "spring", visualDuration: 0.5, bounce: 0.06 },
} as const;

export const exit = { duration: 0.16, ease: [0.55, 0, 1, 0.45] } as const;
