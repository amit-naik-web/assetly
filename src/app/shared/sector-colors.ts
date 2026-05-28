/** Sector palette shared by allocation donut chart and holdings table. */
export const SECTOR_COLORS: Record<string, string> = {
  Technology:  '#378ADD',
  Financials:  '#1D9E75',
  Automotive:  '#EF9F27',
  Healthcare:  '#C44D9E',
  Energy:      '#E24B4A',
  Consumer:    '#BA7517',
  Industrials: '#5046A0',
};

export const SECTOR_COLOR_FALLBACK = [
  '#378ADD',
  '#1D9E75',
  '#EF9F27',
  '#C44D9E',
  '#E24B4A',
  '#BA7517',
  '#5046A0',
  '#5DCAA5',
  '#185FA5',
] as const;

/** Resolves a stable donut-chart color for any sector label. */
export function getSectorColor(sector: string, index = 0): string {
  const mapped = SECTOR_COLORS[sector];
  if (mapped) {
    return mapped;
  }

  if (index > 0) {
    return SECTOR_COLOR_FALLBACK[index % SECTOR_COLOR_FALLBACK.length];
  }

  let hash = 0;
  for (let i = 0; i < sector.length; i++) {
    hash = sector.charCodeAt(i) + ((hash << 5) - hash);
  }

  return SECTOR_COLOR_FALLBACK[Math.abs(hash) % SECTOR_COLOR_FALLBACK.length];
}
