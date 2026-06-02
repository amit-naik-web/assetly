import { expect } from '@playwright/test';
import type { AxeResults, Result } from 'axe-core';

const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

function formatViolation(v: Result): string {
  const targets = v.nodes
    .map(n => n.target.join(' > '))
    .slice(0, 3)
    .join('; ');
  return `[${v.impact}] ${v.id}: ${v.help} (${targets})`;
}

export function assertNoSeriousViolations(results: AxeResults): void {
  const blocking = results.violations.filter(v =>
    BLOCKING_IMPACTS.has(v.impact ?? ''),
  );

  if (blocking.length > 0) {
    const summary = blocking.map(formatViolation).join('\n');
    expect(
      blocking,
      `Accessibility violations (critical/serious):\n${summary}`,
    ).toEqual([]);
  }
}
