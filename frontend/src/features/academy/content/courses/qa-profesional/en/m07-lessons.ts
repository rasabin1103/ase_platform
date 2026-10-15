import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (course 2 · mission 7). CTFL syllabus 5.4, 2.3 and 5.5. */
export const m07LessonsEn: Lesson[] = [
  {
    id: 'config',
    question: 'What is configuration management? (CTFL 5.4)',
    conceptId: 'config_mgmt',
    cost: 5,
    body: `It is the discipline that **identifies, controls and tracks** work products: code, builds, schemas, configuration files, flags, environments, data and also the **testware** (test cases, scripts, test data).

- Each item has a unique identifier and versions.
- It records which versions make up each build or environment, and changes go through change control.
- That way every test and every defect can be traced to an exact version and reproduced.

In DevOps it is automated in the pipeline: if something is changed by hand on a server, it is no longer under control.`,
  },
  {
    id: 'envs',
    question: 'How do you investigate a bug that only happens in one environment?',
    conceptId: 'config_mgmt',
    cost: 5,
    body: `Before looking at the code, **compare the environments** item by item:

- version of the app and of each service (build);
- database schema;
- flags;
- configuration files;
- data.

The difference that explains the failure is usually in what is **not** versioned: a file edited by hand, a flag enabled in only one place, different data.`,
  },
  {
    id: 'confirmation',
    question: 'What is the difference between confirmation testing and regression testing? (CTFL 2.2.3)',
    conceptId: 'confirmation',
    cost: 5,
    body: `- **Confirmation testing**: checks that the original defect has been fixed. It is run on the **build that contains the fix**.
- **Regression testing**: checks that the change hasn't broken anything else. It is a good candidate for automation, because it is repeated often.

Merged is not deployed: before closing or reopening a defect, check which build is in the environment you are testing on and note it in the ticket.`,
  },
  {
    id: 'maintenance',
    question: 'What triggers maintenance testing? (CTFL 2.3)',
    conceptId: 'maintenance',
    cost: 5,
    body: `Any change to a system that is already in use:

- **modifications**: enhancements, fixes and planned patches;
- **upgrades or migrations of the operational environment**: of the platform, an external service, data;
- **retirement**: when a system or part of it is no longer used; it may require testing data archiving and restoration.

The scope depends on the risk of the change, the size of the system and the size of the change.`,
  },
  {
    id: 'impact',
    question: 'What is impact analysis? (CTFL 2.3)',
    conceptId: 'impact_analysis',
    cost: 5,
    body: `Evaluating, **before the change**, which parts of the system are affected and what consequences it may have, in order to decide **what to test**.

- It relies on traceability and on knowing the dependencies.
- It is hard if specifications are outdated, if there is no traceability or if nobody knows the system.

Neither full regression out of fear nor none out of confidence: the regression the impact justifies.`,
  },
  {
    id: 'report',
    question: 'What should a defect report contain? (CTFL 5.5)',
    conceptId: 'defect_report',
    cost: 5,
    body: `What another person needs to **reproduce** it and manage it:

- identifier, concise title, date and author;
- **test object and test environment with versions**;
- context (test case, activity, test level);
- steps to reproduce;
- **expected and actual results**;
- severity and priority;
- status and references.

Without versions, "cannot reproduce" is the most likely answer.`,
  },
]
