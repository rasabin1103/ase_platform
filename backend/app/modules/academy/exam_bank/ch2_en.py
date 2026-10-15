"""Capítulo 2 · versión en inglés (mismos ids que ch2.py; la correcta primero)."""

from app.modules.academy.exam_bank.model import BankText, en

EN: dict[str, BankText] = {
    # 2.1 Testing in the context of an SDLC
    "c2-01": en(
        "In a sequential (waterfall) development model, when is dynamic testing usually performed?",
        "In the later phases, once the code is available; earlier on, reviews and test design take place",
        ["Continuously from day one", "Never: there is only static testing", "Only in production"],
        "In sequential models, reviews, test analysis and test design happen early; test execution comes once code exists.",
    ),
    "c2-02": en(
        "Which good testing practice applies to any SDLC?",
        "For every software development activity, there is a corresponding test activity",
        ["Testing starts when development is finished", "All test levels have the same objectives", "Testers do not review draft documents"],
        "Other good practices: each test level has its own objectives, test analysis and design start early, and testers review drafts.",
    ),
    "c2-03": en(
        "What does test-driven development (TDD) describe?",
        "A failing test is written first, then the minimum code to make it pass, and then the code is refactored",
        ["Acceptance tests are agreed with the business at the end of the sprint", "UI tests are automated once the release is finished", "Testing is done directly in production with real users"],
        "TDD drives coding through tests, usually component tests, written before the code.",
    ),
    "c2-04": en(
        "What characterizes behavior-driven development (BDD)?",
        "It expresses the desired behaviour through natural-language examples (Given/When/Then) that business understands and that can be automated",
        ["It is based on the internal structure of the code", "It replaces acceptance criteria", "Only testers use it, without business involvement"],
        "BDD fosters a shared understanding through concrete scenarios that serve as both specification and tests.",
    ),
    "c2-05": en(
        "What is a benefit of DevOps for testing?",
        "Fast feedback on quality thanks to automated tests in the continuous integration and delivery pipeline",
        ["It removes the need for manual testing", "It does not require maintaining CI/CD tools", "It makes test environments unnecessary"],
        "DevOps provides fast feedback and automated regression testing, but requires a defined pipeline, tool maintenance and resources for test automation.",
    ),
    "c2-06": en(
        "Which is an example of shift-left?",
        "Reviewing the specification from a testing perspective before coding",
        ["Extending exploratory testing after the release", "Monitoring behaviour in production", "Running the full regression suite just before deployment"],
        "Shift-left means testing earlier: early reviews, test cases before code, CI and static analysis.",
    ),
    "c2-07": en(
        "What do retrospectives contribute to testing?",
        "Identifying what went well and what to improve, including in testing, and applying it in the next iteration",
        ["Assigning blame for escaped defects", "Setting the annual test budget", "Replacing the test completion report"],
        "Retrospectives improve test effectiveness and efficiency, testware quality, team learning and collaboration.",
    ),
    "c2-19": en(
        "In iterative and incremental development, what is characteristic of testing?",
        "Static and dynamic testing is performed at several test levels in every iteration, with frequent regression testing",
        ["All dynamic testing is concentrated after the last increment", "Only acceptance testing is performed at the end of each iteration", "Static testing is dropped because the code changes constantly"],
        "Each iteration delivers an increment that is tested statically and dynamically at all test levels, which requires fast feedback and extensive regression testing.",
    ),
    "c2-20": en(
        "In an agile team at a neobank, what is typical of manual testing?",
        "It is often done using experience-based test techniques that do not require extensive prior test analysis and design",
        ["It is documented with formal, extensive test specifications", "It disappears completely thanks to test automation", "It is executed by an external team at the end of the project"],
        "In agile, change is expected: lightweight documentation, extensive test automation and experience-based manual testing.",
    ),
    "c2-21": en(
        "Which aspect of testing is influenced by the chosen SDLC model?",
        "The timing and scope of test activities, the level of detail of test documentation and the extent of test automation",
        ["The definitions of error, defect and failure", "The seven testing principles", "The need for testing to have objectives"],
        "The SDLC affects the scope and timing of testing, documentation, techniques, automation and the role of testers.",
    ),
    "c2-22": en(
        "In a V-model, according to good practice, when should test analysis and design for system testing begin?",
        "During the corresponding development phase, that is, while the system requirements are being specified",
        ["When the complete system has been integrated", "After integration testing has finished", "When acceptance testing starts"],
        "Test analysis and design for each test level begin during the corresponding development phase, applying the principle of early testing.",
    ),
    "c2-23": en(
        "In the DevOps team of an insurance company, how does continuous integration promote shift-left?",
        "It encourages developers to submit high-quality code accompanied by component tests and static analysis",
        ["It moves acceptance testing into the production environment", "It postpones test execution until the release is complete", "It removes the need to review the requirements before coding"],
        "According to the syllabus, continuous integration promotes shift-left by encouraging developers to submit high-quality code accompanied by component tests and static analysis, with fast feedback.",
    ),
    "c2-24": en(
        "What do TDD, ATDD and BDD have in common?",
        "Tests are defined before the code is written and are used to drive development",
        ["They always use Given/When/Then scenarios", "They are only applied at the system test level", "Tests are always written by an independent team"],
        "All three are test-first approaches: they apply early testing and shift-left, and the tests may persist as automated tests.",
    ),
    "c2-25": en(
        "A fintech company adopts DevOps. What is an associated risk or challenge?",
        "The delivery pipeline and CI/CD tools must be defined and maintained, and test automation requires additional resources",
        ["Fast feedback on code quality is lost", "Regression tests can no longer be run", "Static analysis of the code is no longer possible"],
        "DevOps provides fast feedback and automated regression testing, but requires establishing the pipeline, maintaining the tools and investing in test automation.",
    ),
    "c2-26": en(
        "With DevOps and a highly automated pipeline, is manual testing still needed?",
        "Yes, especially testing that evaluates the system from the user's perspective",
        ["No, pipeline automation replaces it completely", "Only at the component test level", "Only when the pipeline is down"],
        "Although DevOps involves a high level of automation, manual testing is still needed, especially from the user's perspective.",
    ),
    "c2-27": en(
        "Which statement about shift-left is correct?",
        "It may require more training, effort and cost early on, but is expected to save effort and cost later",
        ["It involves no additional cost at any stage", "It means moving testing into the production environment", "It can only be applied in sequential SDLCs"],
        "Shift-left brings test activities forward, so stakeholders should be convinced of and support the approach.",
    ),
    # 2.2 Test levels and test types
    "c2-08": en(
        "Testing the interaction between the payments and invoicing modules of the same application, already tested separately, is…",
        "Component integration testing",
        ["Component testing", "Acceptance testing", "System integration testing"],
        "Component integration testing focuses on the interfaces and interactions between components of the same system.",
    ),
    "c2-09": en(
        "Testing that the application correctly exchanges data with the tax authority's external API is…",
        "System integration testing",
        ["Component integration testing", "Component testing", "Confirmation testing"],
        "System integration testing tests the interfaces with other systems and external services.",
    ),
    "c2-10": en(
        "Which test level focuses on validating that the system is ready for use and meets the business needs?",
        "Acceptance testing",
        ["Component testing", "Component integration testing", "System testing"],
        "Acceptance testing validates readiness for deployment and that the user's needs are met.",
    ),
    "c2-11": en(
        "Checking that the dashboard responds in under 2 seconds with 500 concurrent users is…",
        "Non-functional testing (performance efficiency)",
        ["Functional testing", "White-box testing", "Confirmation testing"],
        "Non-functional testing evaluates how well the system behaves: performance, security, usability, etc.",
    ),
    "c2-12": en(
        "Which statement about test types and test levels is correct?",
        "Any test type can be applied at any test level",
        ["Non-functional testing is only performed at system test level", "White-box testing is only performed at component test level", "Functional testing is only performed during acceptance testing"],
        "Test types (functional, non-functional, black-box, white-box) can be applied at all test levels, with different focuses.",
    ),
    "c2-13": en(
        "What is white-box testing based on?",
        "The system's internal structure or implementation",
        ["The specification of its behaviour", "The tester's experience", "Users' preferences"],
        "White-box testing derives tests from the code, the architecture or the data flows.",
    ),
    "c2-14": en(
        "A defect has been fixed. Which testing checks that the defect can no longer be reproduced?",
        "Confirmation testing",
        ["Regression testing", "Smoke testing", "Operational acceptance testing"],
        "Confirmation testing verifies the fix; regression testing checks that the change has not broken other parts.",
    ),
    "c2-15": en(
        "Why are regression tests good candidates for automation?",
        "Because they are run many times and their number grows with each change",
        ["Because they never need maintenance", "Because they replace confirmation tests", "Because they are only run once per project"],
        "Regression tests are repeated in every iteration; automating them, for example in CI, saves a lot of effort.",
    ),
    "c2-16": en(
        "After fixing a defect in the VAT calculation, what should be run in addition to confirmation testing?",
        "Regression tests on the parts that may be affected by the change",
        ["Nothing else: if confirmation passes, it is closed", "Only usability tests", "A review of the test plan"],
        "A change can have side effects; impact analysis helps to scope the regression testing.",
    ),
    "c2-28": en(
        "A developer tests the function that calculates a loan instalment in isolation, replacing the interest-rate service with a stub. Which test level is this?",
        "Component testing",
        ["Component integration testing", "System testing", "System integration testing"],
        "Component testing tests components in isolation and often requires test harnesses or unit test frameworks.",
    ),
    "c2-29": en(
        "What is the focus of system testing?",
        "The overall behaviour and capabilities of the entire system, end to end, covering functional and non-functional aspects",
        ["The interfaces between components of the same system", "The internal logic of each function separately", "The customer's formal acceptance of the contract"],
        "System testing evaluates the whole system or product; it is often performed by an independent test team.",
    ),
    "c2-30": en(
        "Before launch, a payments app is given to a group of real customers who use it on their own phones and in their own environments. What type of testing is this?",
        "Beta testing",
        ["Alpha testing", "Operational acceptance testing", "System integration testing"],
        "Beta testing is performed by users at their own locations; alpha testing takes place at the developing organization's site.",
    ),
    "c2-31": en(
        "Before launch, the operations team checks backups, restore and disaster recovery procedures. What type of testing is this?",
        "Operational acceptance testing",
        ["User acceptance testing", "Contractual and regulatory acceptance testing", "Beta testing"],
        "Operational acceptance testing checks that the system is ready to be operated: backup, recovery, maintenance and similar.",
    ),
    "c2-32": en(
        "What does functional testing evaluate?",
        "The functions that the system should perform, that is, \"what\" it should do",
        ["How well the system behaves, for example its performance or usability", "The internal structure of the code", "Compliance with the coding standard"],
        "Functional testing evaluates what the system does; non-functional testing evaluates how well it does it.",
    ),
    "c2-33": en(
        "Testers check that an online shop's app installs, updates and uninstalls correctly on the supported Android and iOS versions. Which quality characteristic is mainly being evaluated?",
        "Portability",
        ["Maintainability", "Performance efficiency", "Functional suitability"],
        "Installability and adaptability to different environments are part of portability, a non-functional characteristic.",
    ),
    "c2-34": en(
        "Apart from the test object, which attributes distinguish one test level from another?",
        "Test objectives, test basis, typical defects and failures, and approach and responsibilities",
        ["Only the test automation tool used", "The number of testers", "The system's programming language"],
        "Each test level is characterized by its test object, test objectives, test basis, defects and failures, and approach and responsibilities.",
    ),
    # 2.3 Maintenance testing
    "c2-17": en(
        "Which is a trigger for maintenance testing?",
        "Migrating the system to a new cloud platform",
        ["Writing the test plan for a new project", "Making the first release of a product", "Holding a retrospective"],
        "Triggers include modifications, upgrades or migrations of the operational environment, and retirement.",
    ),
    "c2-18": en(
        "An application is being retired, but its data must be kept for ten years. What needs to be tested?",
        "Data archiving and the restore and retrieval procedures",
        ["Only the performance of the new application", "Nothing: a retired application is not tested", "The usability of the old screens"],
        "Retirement may require testing data migration or archiving and its later retrieval.",
    ),
    "c2-35": en(
        "Before approving a change to the fee calculation, the team estimates which parts of the system would be affected and which tests would need to be rerun. What activity is this?",
        "Impact analysis",
        ["Confirmation testing", "Static analysis", "Retrospective"],
        "Impact analysis evaluates the consequences of a change and can be done before approving it, to help decide whether it should be made.",
    ),
    "c2-36": en(
        "What mainly determines the scope of maintenance testing?",
        "The degree of risk of the change and the size of the existing system and of the change",
        ["Only the number of testers available", "How long the development team has existed", "The number of previous releases of the product"],
        "The syllabus states that the scope depends on the risk of the change, the size of the system and the size of the change.",
    ),
    "c2-37": en(
        "An urgent hot fix is deployed to production to fix a defect in card payments. Which statement is correct?",
        "It is a trigger for maintenance testing: the fix must be confirmed and anything that may be affected must be regression tested",
        ["Because it is urgent and small in scope, it can be deployed without any testing", "It will only be tested once it is included in the next planned release", "Static analysis of the patch is enough, because the change is small"],
        "Modifications, including unplanned hot fixes, trigger maintenance testing.",
    ),
    "c2-38": en(
        "A neobank migrates its customer data from an old database to a new platform. Besides the modified software, what needs to be tested?",
        "The data conversion and operation in the new operational environment",
        ["Only the user interface", "Nothing, if the application code has not changed", "Only the performance of the old database"],
        "Migrations require testing the new environment and, where data is converted, that the conversion is correct.",
    ),
}
