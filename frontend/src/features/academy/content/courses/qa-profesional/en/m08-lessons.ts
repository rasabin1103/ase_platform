import type { Lesson } from '../../../../engine/types'

/** Laura's micro-lessons (course 2 · mission 8). CTFL syllabus 6.1 and 6.2. */
export const m08LessonsEn: Lesson[] = [
  {
    id: 'categories',
    question: 'What categories of test tools are there? (CTFL 6.1)',
    conceptId: 'tool_categories',
    cost: 5,
    body: `- **Management**: process, requirements, tests, defects and configuration; traceability.
- **Static testing**: support for reviews and static analysis.
- **Test design and implementation**: generate test cases, data and procedures.
- **Test execution and coverage**: run automated tests and measure coverage.
- **Non-functional testing**: performance, load, security… tests that are hard or impossible to do manually.
- **DevOps**: the delivery pipeline, automated builds, CI/CD.
- **Collaboration**: communication between roles.
- And tools for **scalability and deployment standardization** (virtual machines, containers).

First the need, then the category and finally the tool.`,
  },
  {
    id: 'benefits',
    question: 'What are the benefits of test automation? (CTFL 6.2)',
    conceptId: 'automation_benefits',
    cost: 5,
    body: `- Saves time on **repetitive** work: regression, re-entering data, comparing results, checking against standards.
- Fewer human errors: more **consistency and repeatability**.
- More **objective** assessment (coverage) and measures that are hard to obtain manually.
- Easier access to information for test management and reporting.
- Faster execution: **earlier defect detection** and quicker feedback.
- Frees up time to design new, deeper and more effective tests.`,
  },
  {
    id: 'risks',
    question: 'What are the risks of test automation? (CTFL 6.2)',
    conceptId: 'automation_risks',
    cost: 5,
    body: `- **Unrealistic expectations** about functionality and ease of use.
- Misjudging time, cost and effort: introducing it, **maintaining the scripts**, changing the process.
- Using it when manual testing is more appropriate.
- **Over-reliance** on the tool and ignoring critical thinking.
- **Vendor dependency**: the vendor goes out of business, retires the tool, sells it or provides poor support.
- Abandoned open-source software, or software with constant updates.
- **Incompatibility** with the development platform.
- Failing to meet regulatory or security requirements.`,
  },
  {
    id: 'evaluate',
    question: 'How do you evaluate a candidate tool?',
    conceptId: 'automation_risks',
    cost: 5,
    body: `Look at what the demo doesn't show:

- **fit** with the specific need;
- **total cost** over several years: license, training, infrastructure and script maintenance;
- the team's **learning curve**;
- **integration** with the CI and with the tools you already use;
- script **format**: can they be versioned and exported?;
- **support** and the health of the vendor or community.`,
  },
  {
    id: 'pilot',
    question: 'What is a tool pilot for?',
    conceptId: 'tool_pilot',
    cost: 5,
    body: `To decide with data before committing the whole team:

- get to know the tool in a **limited**, real scope;
- check that it **fits** the process and the infrastructure;
- establish usage guidelines and standards;
- measure costs and benefits with **measurable success criteria** and a decision date.

It is good adoption practice; CTFL v4.0 no longer examines it as a section of its own, but in real work it is what separates a purchase from a solution.`,
  },
  {
    id: 'balance',
    question: 'Does test automation replace manual testing?',
    conceptId: 'automation_benefits',
    cost: 5,
    body: `No. Automate what is **repetitive and stable** (regression, data checks, load) and leave to people what requires **judgment**: exploratory testing, usability, new and ambiguous cases.

"Automate 100% in a month" is an unrealistic expectation: test automation is a software product that has to be designed, reviewed and maintained.`,
  },
]
