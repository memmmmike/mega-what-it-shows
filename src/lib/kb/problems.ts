// What went wrong in a ticket. The desk counts a report where its tenant files it (causes.ts) and
// footnotes what it read differently (desk-notes.json). A month/day swap cannot move a date by one
// day, so the one-day moves are a problem of their own, counted on their ticket and still under
// the cause they are filed under.
import { causeOf, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day move';

const REPO = 'https://github.com/memmmmike/mega-what-it-shows/issues';

export const PROBLEMS: Record<Problem, { what: string; ticket: string }> = {
  parser: { what: 'the shared parser reads day-first dates month first', ticket: `${REPO}/1` },
  hint: { what: 'booking-v3 prints MM/DD/YYYY to day-first tenants', ticket: `${REPO}/2` },
  'one-day move': { what: 'the date moves by one day, not a swap', ticket: `${REPO}/3` },
};

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: number;
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of reports) {
    const p = causeOf(r, tenantOf(r)) ?? 'unplaced';
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const moved = reports.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) by.set('one-day move', moved);
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        taggedAs: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
