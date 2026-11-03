// What went wrong, per report: the cause by tenant (causes.ts), except where the desk read a
// one-day move (desk-notes.json). A month/day swap cannot move a date by one day.
import { causeOf, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day move';

const REPO = 'https://github.com/memmmmike/mega-what-it-shows/issues';

export const PROBLEMS: Record<Problem, { what: string; ticket: string }> = {
  parser: { what: 'the shared parser reads day-first dates month first', ticket: `${REPO}/1` },
  hint: { what: 'booking-v3 prints MM/DD/YYYY to day-first tenants', ticket: `${REPO}/2` },
  'one-day move': { what: 'the date moves by one day, not a swap', ticket: `${REPO}/3` },
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | null {
  return oneDayMove.includes(r.id) ? 'one-day move' : causeOf(r, t);
}

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
    const p = problemOf(r, tenantOf(r), oneDayMove) ?? 'unplaced';
    by.set(p, [...(by.get(p) ?? []), r]);
  }
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
