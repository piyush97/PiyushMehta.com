// Educational, in-memory action boundary. No model calls or external writes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const cases = JSON.parse(await readFile(new URL('./cases.json', import.meta.url), 'utf8'));
const unsafe = process.argv.includes('--unsafe');

function createGate() {
  const completed = new Map();
  const writes = [];
  return {
    writes,
    execute(proposal, trustedContext) {
      if (unsafe) {
        writes.push({ tool: proposal?.tool, project: proposal?.project, title: proposal?.title });
        return 'executed';
      }
      if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) return 'invalid';
      const { tool, project, title, key } = proposal;
      if (tool !== 'create_ticket') return 'unsupported_tool';
      if (![project, title, key].every((value) => typeof value === 'string' && value.trim().length > 0)) {
        return 'invalid';
      }
      if (title.length > 200 || key.length > 100) return 'invalid';
      if (!trustedContext.allowedProjects.includes(project)) return 'forbidden';
      // Approval comes from the application, never the proposal or retrieved text.
      // Bind approval to the exact fields that will be executed.
      const action = JSON.stringify({ tool, project, title, key });
      if (!trustedContext.approvedActions.includes(action)) return 'approval_required';
      const scopedKey = JSON.stringify([trustedContext.userId, project, key]);
      if (completed.has(scopedKey)) {
        return completed.get(scopedKey) === action ? 'duplicate' : 'key_conflict';
      }
      // This synchronous in-memory example models one process only.
      writes.push({ tool, project, title });
      completed.set(scopedKey, action);
      return 'executed';
    },
  };
}

let failures = 0;
for (const fixture of cases) {
  const gate = createGate();
  const context = {
    userId: 'demo-user',
    allowedProjects: fixture.allowedProjects,
    approvedActions: fixture.approvals.map(({ tool, project, title, key }) =>
      JSON.stringify({ tool, project, title, key }),
    ),
  };
  const outcomes = fixture.proposals.map((proposal) => gate.execute(proposal, context));
  try {
    assert.deepEqual(outcomes, fixture.expectedOutcomes);
    assert.deepEqual(gate.writes, fixture.expectedWrites);
    console.log(`PASS ${fixture.name}`);
  } catch {
    failures += 1;
    console.error(`FAIL ${fixture.name}: ${JSON.stringify({ outcomes, writes: gate.writes })}`);
  }
}
console.log(`${cases.length - failures}/${cases.length} fixtures passed (${unsafe ? 'unsafe' : 'guarded'} mode)`);
process.exitCode = failures ? 1 : 0;
