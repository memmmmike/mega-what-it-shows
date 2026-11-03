<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, PROBLEMS } from '#lib/kb/problems';

  let { ticket }: { ticket: number } = $props();

  const rows = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket));
  const merged = $derived(uniqueById(rows));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const tags = (g: { taggedAs: Record<string, number> }) =>
    Object.entries(g.taggedAs)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket}
  ({rows.length - merged.length} export rows were the same report twice) ·
  <strong>{groups.length}</strong> {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td>
          <code>{g.problem}</code>
          {#if g.problem !== 'unplaced'}<br /><span class="what">{PROBLEMS[g.problem].what}</span>{/if}
        </td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td class="tags">{tags(g)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if g.problem !== 'unplaced'}
            <a href={PROBLEMS[g.problem].ticket}>{PROBLEMS[g.problem].ticket.split('/').slice(-3).join('/').replace('/issues/', '#')}</a>
          {:else}none{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .what { color: var(--muted); font-size: 0.85em; }
  .tags { color: var(--muted); font-size: 0.85em; }
</style>
