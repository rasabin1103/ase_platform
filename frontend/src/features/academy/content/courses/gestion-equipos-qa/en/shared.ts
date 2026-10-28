import type { Patch } from '../../../overlay'

/** English patches for the role sheets shared by several missions (see ../shared.ts). */

export const FICHA_QA_MANUAL_EN: Patch = {
  title: 'Role sheet: Manual QA',
  updatedLabel: 'Laura Méndez · QA Lead',
  body: `## What you own
- Your tests: understanding what has to be tested, running it and keeping the evidence.
- Your bug reports: reproducible, with steps, data, environment and evidence.
- Your status: what is tested, what is not, what blocks you and what risk you see.

## What you decide
- How to test what you have been assigned and in what order (risk first).
- When to ask for help: as soon as you see you won't make it, not at the end.

## What you do NOT decide
- Whether the product ships with a risk: that is decided by the owner of the business (the PO and the Engineering Manager), with your information.
- Other teams' priorities: if two requests clash, your QA Lead decides.

## What you escalate to your QA Lead
- That you can't test what was committed.
- Pressure to sign off something untested.
- A conflict that can't be solved with evidence and a conversation.

## How you are measured
- Useful defects found in time.
- That your “tested” means tested.
- That nobody finds out about a risk by surprise.`,
}

export const FICHA_QA_LEAD_EN: Patch = {
  title: 'Role sheet: QA Lead',
  updatedLabel: 'Laura Méndez · QA Manager',
  body: `## What you own
- The people on your team: that they know what is expected of them, that they grow and that they are able to work.
- The distribution of work and the team's priorities.
- The 1:1s and the feedback, in both directions.

## What you decide
- Who takes what, with what support and with what margin.
- How the team works (agreements, practices, review).
- When you back a person on your team and when you correct them, in private.

## What you do NOT decide
- Whether to ship with a risk: the business owner decides. You make sure they decide with your team's information.
- Headcount and budget: your QA Manager handles those. You give them the data.

## What you escalate to your QA Manager
- Sustained lack of capacity or someone being overloaded.
- Low performance that does not improve with feedback and support.
- Conflicts with other areas that can't be solved at your level.

## What you no longer do
- Being the best QA on the team or taking the hardest work yourself: if you do, nobody grows and the team depends on you.

## How you are measured
- What the team delivers, not what you deliver.
- That people grow, stay and dare to warn about risks.`,
}

export const FICHA_QA_ENGINEER_EN: Patch = {
  title: 'Role sheet: QA Engineer',
  updatedLabel: 'Laura Méndez · QA Lead',
  body: `## What you own
- The squad's test automation: that the suite is reliable, fast and useful.
- The tools, data and test environments the team uses.
- Helping others (devs and QA) write good tests.

## What you decide
- What to automate and how, and what to do with a test that adds nothing.
- When a test leaves the critical path (quarantine) and under what conditions.

## What you do NOT decide
- Sprint time: you negotiate it with the PO and the EM, with data.
- Fixing everybody's tests: each squad owns theirs; you set the rules and help.

## What you escalate to your QA Lead
- Sustained lack of time to maintain the suite.
- Platform or environment problems that don't depend on the team.

## How you are measured
- That the pipeline is a signal the team trusts.
- How fast the team finds out that something broke.
- How much others learn from you.`,
}

export const FICHA_QA_ARCHITECT_EN: Patch = {
  title: 'Role sheet: QA Architect',
  updatedLabel: 'Raúl Ortega · Head of Engineering',
  body: `## What you own
- The standards, tools and testing architecture common to all squads.
- Cross-cutting technical decisions and their documentation (RFC and ADR).

## What you decide
- What is proposed as a standard and with what criteria, after listening to the squads.
- What is out of scope for each decision.

## What you do NOT have
- Authority over the squads: they are not your team. Your tool is influence: data, criteria, pilots and listening.
- Budget: you propose it with its cost; Management approves it.

## What you escalate
- Conflicts between squads that block a common decision.
- Investments and technical risks that affect the whole organization.

## How you are measured
- By the real adoption of the standards, not by the documents published.
- By whether testing is faster, cheaper and more reliable across the organization.`,
}

export const FICHA_QA_MANAGER_EN: Patch = {
  title: 'Role sheet: QA Manager',
  updatedLabel: 'Laura Méndez · VP Engineering',
  body: `## What you own
- Several QA teams and their QA Leads.
- Hiring, capacity and the budget of your area.
- Careers: evaluations, promotions and the development of your leads.

## What you decide
- Who is hired and with what process, together with your leads and People.
- How capacity is shared among teams.
- The common processes of the area.

## What you do NOT do
- Interview and decide alone, or by gut feeling: with criteria and a panel.
- Each QA's 1:1s: they belong to their leads. You do your leads' 1:1s.

## What you escalate to your VP
- Cuts or budget changes that affect risk coverage.
- Pressure from management that compromises a fair process.

## How you are measured
- Capacity and retention of your area.
- Quality of hires and onboarding.
- That your leads grow.`,
}

export const FICHA_HEAD_OF_QA_EN: Patch = {
  title: 'Role sheet: Head of QA',
  updatedLabel: 'Irene Sáez · CEO',
  body: `## What you own
- The company's quality strategy, the QA organizational model and the quality culture.
- The relationship with management, Compliance and the regulator on everything related to quality.

## What you decide
- The vision, the investment and the model (centralized, embedded or platform).
- The common policies: how risks are accepted, what is required before a release.

## What you do NOT do
- Be the last signature on every release: if QA is the only gate, quality belongs only to QA.
- Look for culprits: your job is to change the system that allowed the failure.

## What you escalate to the executive committee
- Business and regulatory risks, with their cost.

## How you are measured
- Cost of poor quality and serious incidents.
- Delivery speed without losing the trust of customers and the regulator.
- Management's confidence in the quality of what ships.`,
}
