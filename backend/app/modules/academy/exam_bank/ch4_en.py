"""Capítulo 4 · versión en inglés (mismos ids que ch4.py; la correcta primero)."""

from app.modules.academy.exam_bank.model import BankText, en

_DISCOUNT = """discount = 0
IF amount > 100 THEN
    discount = 10
ENDIF
total = amount - discount"""

_BALANCE = """IF balance < 0 THEN
    status = "overdrawn"
ELSE
    status = "ok"
ENDIF
IF status = "overdrawn" THEN
    send_alert()
ENDIF"""

_LOOP = """READ(n)
i = 0
total = 0
WHILE i < n DO
    total = total + i
    i = i + 1
ENDWHILE
PRINT(total)"""

_FARE = """IF age >= 18 THEN
    IF member THEN
        price = 8
    ELSE
        price = 10
    ENDIF
ELSE
    price = 6
ENDIF
PRINT(price)"""

_MAXIMUM = """READ(a, b)
IF a > b THEN
    max = a
ELSE
    max = b
ENDIF
IF max > 100 THEN
    max = 100
ENDIF
PRINT(max)"""

EN: dict[str, BankText] = {
    # 4.1 Test techniques overview
    "c4-01": en(
        "What are black-box test techniques based on?",
        "The specified behaviour of the test object, without reference to its internal structure",
        ["The source code and its structure", "The tester's experience and intuition", "Defect metrics from previous releases"],
        "They are also known as specification-based techniques.",
    ),
    "c4-02": en(
        "What is an advantage of tests designed with black-box test techniques?",
        "They remain valid if the implementation changes but the specified behaviour does not",
        ["They guarantee 100% statement coverage", "They do not need any specification", "They always detect unreachable code"],
        "Because they do not depend on the implementation, the test cases survive refactoring.",
    ),
    "c4-03": en(
        "What are experience-based test techniques based on?",
        "The knowledge and experience of the tester",
        ["The internal structure of the code", "Formal models of the system", "Decision tables"],
        "They complement black-box and white-box techniques and find defects that those may miss.",
    ),
    "c4-34": en(
        "Which of the following is a white-box test technique?",
        "Branch testing",
        ["Boundary value analysis", "State transition testing", "Error guessing"],
        "Statement testing and branch testing are white-box techniques; boundary value analysis and state transition testing are black-box, and error guessing is experience-based.",
    ),
    "c4-35": en(
        "How do test techniques support the tester?",
        "In defining test conditions, coverage items and test data",
        ["In estimating the test effort needed for the whole release", "In deciding the priority with which defects are fixed", "In replacing test planning and test monitoring"],
        "Test techniques support test analysis (what to test) and test design (how to test), helping to derive a small but sufficient set of test cases systematically.",
    ),
    "c4-36": en(
        "Which statement about white-box test techniques is correct?",
        "The test cases depend on the design or implementation, so they can only be created once these exist",
        ["The test cases are independent of how the software is implemented and survive any change", "They are only applied when no specification is available for the test object", "They are based mainly on the intuition and previous experience of the person testing the system"],
        "White-box techniques are based on the internal structure (code, architecture, control flow), so test cases are designed once a design or code exists.",
    ),
    # 4.2 Black-box test techniques: equivalence partitioning
    "c4-04": en(
        "A discount applies to orders from €50 to €200, both inclusive. Considering only positive amounts, how many equivalence partitions are there?",
        "3",
        ["2", "4", "5"],
        "Below €50, from €50 to €200, and above €200.",
    ),
    "c4-05": en(
        "The age for opening an account must be between 18 and 65. With the partitions \"under 18\", \"18–65\" and \"over 65\", which set achieves 100% equivalence partition coverage with the minimum number of test cases?",
        "10, 30 and 70",
        ["17, 18 and 65", "18, 40 and 65", "30 and 70"],
        "One value from each partition is needed: one below 18, one between 18 and 65, and one above 65.",
    ),
    "c4-06": en(
        "With several sets of partitions (for example, customer type and payment method), what does Each Choice coverage require?",
        "That each partition from each set is exercised at least once",
        ["That all combinations of partitions are tested", "That only the valid partitions are tested", "That two values per partition are tested"],
        "Each Choice is the simplest coverage criterion for multiple sets of partitions.",
    ),
    "c4-07": en(
        "Why should each invalid partition be tested in a separate test case?",
        "So that a defect is not masked by another invalid value in the same test case",
        ["Because invalid partitions cannot be combined with valid ones", "Because it reduces the total number of test cases", "Because statement coverage requires it"],
        "If a test case contains two invalid values, the first rejection may hide how the second one is handled.",
    ),
    "c4-37": en(
        "Which statement about equivalence partitions is correct?",
        "Partitions must not overlap and must be non-empty sets",
        ["Each partition must contain exactly one boundary value", "Invalid partitions do not count towards coverage", "Two valid partitions may overlap if they share values"],
        "The domain is divided into disjoint, non-empty partitions; coverage is measured against all identified partitions, both valid and invalid.",
    ),
    "c4-38": en(
        "A payment depends on three sets of partitions: card (Visa, Mastercard, Amex), currency (EUR, USD) and channel (web, app, store, phone). What is the minimum number of test cases needed to achieve 100% Each Choice coverage?",
        "4",
        ["24", "9", "3"],
        "Each Choice requires every partition of every set to be exercised at least once, so the minimum is set by the largest set (channel, with 4 partitions).",
    ),
    "c4-39": en(
        "For the valid partition of 1 to 10 units, a tester tests only with 7 units. Why is one value enough to cover the partition?",
        "Because all values in a partition are assumed to be processed the same way",
        ["Because 7 is the most representative boundary value of that partition", "Because partition coverage only requires one value per boundary", "Because the remaining values of the partition are covered in regression testing"],
        "The premise of equivalence partitioning is that all elements of a partition are processed in the same way: if one value reveals a defect, the others would too.",
    ),
    # 4.2 Boundary value analysis
    "c4-08": en(
        "A field accepts integer quantities from 1 to 99. Using 2-value boundary value analysis, what is the minimum set of values to test?",
        "0, 1, 99 and 100",
        ["1 and 99", "0, 1, 2, 98, 99 and 100", "1, 50 and 99"],
        "In 2-value BVA, each boundary value and its closest neighbour in the adjacent partition are tested.",
    ),
    "c4-09": en(
        "A field accepts integer quantities from 1 to 99. Using 3-value boundary value analysis applied to the boundaries of the valid range (1 and 99), how many distinct values must be tested?",
        "6",
        ["4", "3", "8"],
        "For each boundary, the value and both its neighbours: 0, 1, 2 and 98, 99, 100.",
    ),
    "c4-10": en(
        "A password must be between 8 and 16 characters long. Using 2-value BVA, which minimum set achieves 100% coverage?",
        "7, 8, 16 and 17 characters",
        ["8 and 16 characters", "7, 8, 9, 15, 16 and 17 characters", "1, 8, 16 and 32 characters"],
        "The boundaries 8 and 16 plus their neighbours outside the range: 7 and 17.",
    ),
    "c4-11": en(
        "Shipping rates: 0 to 10 kg, rate A; 11 to 20 kg, rate B; over 20 kg, rate C. Weights are entered as whole kilograms and the field does not allow negative values (there is no invalid partition below 0). Which minimum set achieves 100% 2-value BVA coverage?",
        "0, 10, 11, 20 and 21",
        ["10, 11, 20 and 21", "0, 5, 15 and 25", "0, 10 and 20"],
        "The boundary values are 0 and 10 (A), 11 and 20 (B) and 21 (C, with no maximum); the neighbours of each boundary are themselves boundary values.",
    ),
    "c4-40": en(
        "A thermostat accepts temperatures with a precision of one decimal place between 15.0 and 30.0 °C, both inclusive. Using 2-value BVA, which minimum set achieves 100% coverage?",
        "14.9, 15.0, 30.0 and 30.1",
        ["15.0 and 30.0", "14.0, 15.0, 30.0 and 31.0", "14.9, 15.0, 15.1, 29.9, 30.0 and 30.1"],
        "With a precision of 0.1, the closest neighbours of 15.0 and 30.0 in the adjacent partitions are 14.9 and 30.1.",
    ),
    "c4-41": en(
        "When can boundary value analysis be applied?",
        "Only when the partitions are ordered",
        ["Only when the partitions are invalid", "Only when there are exactly two partitions", "Only when the values are integers"],
        "BVA is based on the minimum and maximum values of each partition, which only makes sense if the elements of the partition are ordered.",
    ),
    "c4-42": en(
        "Requirement: \"a surcharge applies if the weight is at most 30 kg\". The code applies the surcharge only \"if weight = 30\". Analysing only the 30 kg boundary, which BVA variant detects the defect?",
        "Only 3-value BVA, thanks to the value 29",
        ["Only 2-value BVA, thanks to the value 31", "Both, thanks to the value 30", "Neither of the two variants"],
        "2-value BVA tests 30 and 31, which behave correctly; 3-value BVA adds 29, which should get the surcharge but does not.",
    ),
    # 4.2 Decision table testing
    "c4-12": en(
        "A business rule depends on 3 independent Boolean conditions. How many columns does the full decision table have, without simplification?",
        "8",
        ["6", "3", "9"],
        "2 × 2 × 2 = 8 combinations.",
    ),
    "c4-13": en(
        "Rule: shipping is free if the customer is premium, or if the amount is at least €50 and the destination is domestic. For a non-premium customer with €60 and an international destination, what is the expected result?",
        "No free shipping",
        ["Free shipping", "Free shipping only if paying by card", "The rule does not define the case"],
        "The customer is not premium and, although the amount exceeds €50, the destination is not domestic: neither branch of the rule is satisfied.",
    ),
    "c4-14": en(
        "What coverage is targeted in decision table testing?",
        "Exercising each feasible column (rule) at least once",
        ["Making each condition take the value true", "Executing each action once", "All combinations, including infeasible ones"],
        "Infeasible columns are removed; the aim is to cover all feasible rules.",
    ),
    "c4-43": en(
        "Discounts: members always get 15%; non-members with a coupon get 10%; non-members without a coupon spending at least €100 get 5%; everyone else gets nothing. Conditions: member, coupon and amount ≥ €100. How many columns does the minimized decision table have (merging columns where a condition does not affect the actions)?",
        "4",
        ["8", "3", "6"],
        "Member (coupon and amount irrelevant): 1; non-member with coupon (amount irrelevant): 1; non-member without coupon with amount ≥ 100 or < 100: 2. Total: 4.",
    ),
    "c4-44": en(
        "A transport fare depends on three conditions: C1 \"age < 26\", C2 \"age ≥ 65\" and C3 \"is a student\". How many feasible columns does the full decision table have, without minimization?",
        "6",
        ["8", "4", "7"],
        "There are 2³ = 8 combinations, but C1 and C2 cannot both be true: those 2 columns (with C3 true or false) are infeasible.",
    ),
    "c4-45": en(
        "In a decision table, what does a dash (\"–\") in a condition row indicate?",
        "That the condition is irrelevant to the outcome of the column",
        ["That the combination of conditions is infeasible", "That the action of that column is never performed", "That the specification does not define the value of that condition"],
        "A dash marks an irrelevant condition; impossible combinations are marked as infeasible (N/A) and removed.",
    ),
    "c4-46": en(
        "What is a strength of decision table testing?",
        "It helps to find overlooked combinations and gaps or contradictions in the requirements",
        ["It reduces the test cases to a single one per condition in the requirement", "It allows branch coverage of the implemented code to be measured directly", "It makes it unnecessary to identify the equivalence partitions of the inputs"],
        "By systematically listing the combinations of conditions, it exposes unspecified cases and contradictory rules.",
    ),
    # 4.2 State transition testing
    "c4-15": en(
        "A payment has the states Pending, Authorized, Captured and Cancelled. Valid transitions: Pending→Authorized, Pending→Cancelled, Authorized→Captured and Authorized→Cancelled. If each test case starts in Pending, what is the minimum number of test cases that cover all valid transitions?",
        "3",
        ["2", "4", "1"],
        "Pending→Authorized→Captured, Pending→Authorized→Cancelled and Pending→Cancelled.",
    ),
    "c4-16": en(
        "Which state transition coverage criterion also requires invalid transitions to be tested?",
        "All transitions coverage",
        ["All states coverage", "Valid transitions coverage", "Statement coverage"],
        "All transitions = the valid transitions plus attempts to execute the invalid ones.",
    ),
    "c4-17": en(
        "Which of these state transition coverage criteria is the weakest?",
        "All states coverage",
        ["Valid transitions coverage", "All transitions coverage", "They are all equivalent"],
        "Visiting all states does not guarantee that all transitions are exercised.",
    ),
    "c4-47": en(
        "For all transitions coverage, how should invalid transitions preferably be tested?",
        "Each in a separate test case, to avoid defect masking",
        ["All together in a single test case, to save execution time", "Only those explicitly drawn in the state diagram", "They are not tested; documenting them as invalid in the table is enough"],
        "As with invalid partitions, if a test case attempts several invalid transitions, the rejection of the first may hide how the others are handled.",
    ),
    "c4-48": en(
        "An article in a content management system has the states Draft (initial), In review, Published and Archived. Valid transitions: Draft→In review (submit), In review→Draft (reject), In review→Published (approve), Published→Draft (edit) and Published→Archived (withdraw). A single test case, starting in Draft, executes: submit, reject, submit, approve. What coverage does it achieve?",
        "75% of states and 60% of valid transitions",
        ["100% of states and 60% of valid transitions", "75% of states and 80% of valid transitions", "60% of states and 75% of valid transitions"],
        "It visits Draft, In review and Published (3 of 4 states) and exercises Draft→In review, In review→Draft and In review→Published (3 of 5 transitions; the repetition does not count twice).",
    ),
    "c4-49": en(
        "What advantage does a state table have over a state diagram?",
        "It shows invalid transitions explicitly as its empty cells",
        ["It shows the actions of each transition, which a diagram never represents", "It allows statement coverage of the state model to be measured directly", "It removes the need to define the initial state of the test object"],
        "The table crosses every state with every event, so each combination without a valid transition is visible as invalid.",
    ),
    # 4.3 White-box test techniques
    "c4-18": en(
        "What does statement coverage measure?",
        "The percentage of executable statements exercised by the tests",
        ["The percentage of requirements tested", "The percentage of decision branches exercised", "The number of defects per line of code"],
        "100% statement coverage means every executable statement was executed at least once.",
    ),
    "c4-19": en(
        "Given the following pseudocode, what is the minimum number of test cases needed for 100% statement coverage and for 100% branch coverage, respectively?",
        "1 and 2",
        ["2 and 2", "1 and 1", "2 and 1"],
        "With amount > 100 all statements are executed; for branch coverage, another test case that does not enter the IF is also needed.",
        code=_DISCOUNT,
    ),
    "c4-20": en(
        "Which statement about code coverage is correct?",
        "100% branch coverage implies 100% statement coverage, but not vice versa",
        ["100% statement coverage implies 100% branch coverage", "They are always equivalent", "100% branch coverage guarantees there are no defects"],
        "Branch coverage subsumes statement coverage.",
    ),
    "c4-21": en(
        "What is a limitation of white-box test techniques?",
        "They cannot detect requirements that were not implemented, because that code does not exist",
        ["They cannot be applied at component test level", "They do not allow coverage to be measured", "They only work with commercial tools"],
        "That is why they are complemented with black-box techniques.",
    ),
    "c4-22": en(
        "Given the following pseudocode, a single test case is executed with balance = 50. Considering only decision branches (the true and false outcome of each IF), what branch coverage is achieved?",
        "50%",
        ["25%", "75%", "100%"],
        "There are 4 branches (true and false of each decision). With balance = 50, both \"false\" branches are exercised: 2 of 4.",
        code=_BALANCE,
    ),
    "c4-50": en(
        "Given the following pseudocode, and considering the true and false outcomes of the WHILE condition as branches, what is the minimum number of test cases needed for 100% statement coverage and for 100% branch coverage, respectively?",
        "1 and 1",
        ["1 and 2", "2 and 2", "2 and 3"],
        "A single test case with n = 2 enters the loop (true), executes every statement and eventually exits (false): it covers everything.",
        code=_LOOP,
    ),
    "c4-51": en(
        "Given the following pseudocode, what is the minimum number of test cases needed for 100% statement coverage?",
        "3",
        ["2", "4", "1"],
        "The assignments price = 8, price = 10 and price = 6 lie on mutually exclusive paths, so each needs its own test case.",
        code=_FARE,
    ),
    "c4-52": en(
        "Given the following pseudocode, T1 (a = 5, b = 3) has already been executed. Considering only the true and false outcomes of each IF, which additional test case, together with T1, achieves 100% branch coverage?",
        "a = 1, b = 150",
        ["a = 150, b = 1", "a = 2, b = 7", "a = 50, b = 50"],
        "T1 covers \"a > b\" true and \"max > 100\" false; a test case with a ≤ b and b > 100 is still needed, such as a = 1, b = 150.",
        code=_MAXIMUM,
    ),
    "c4-53": en(
        "Which statement about statement coverage is correct?",
        "100% can be achieved without detecting defects that only appear with certain data",
        ["Achieving 100% guarantees that all branches of the code have been exercised", "It can only be measured during system testing, with the complete product", "Achieving 100% ensures that no defects remain in the executed code"],
        "For example, a division by zero only fails if the divisor is 0: executing the statement with another value does not reveal it.",
    ),
    "c4-54": en(
        "What is a benefit of white-box testing?",
        "It considers the whole implementation and finds defects even with a vague specification",
        ["It detects requirements that were never actually implemented in the code", "It can be applied without any access to the source code or the internal design", "It replaces the acceptance testing that end users perform on the system"],
        "Because it is based on the code, it finds defects even with vague, outdated or incomplete specifications; however, it cannot see what was not implemented.",
    ),
    "c4-55": en(
        "In branch testing, what is a branch?",
        "A transfer of control between two nodes in the control flow graph",
        ["Only the true outcome of each decision in the code", "Any executable line of code in the component under test", "A complete path from the component's entry to its exit"],
        "Branches can be unconditional (straight-line code) or conditional (decision outcomes).",
    ),
    "c4-56": en(
        "Why is it useful to measure code coverage when running black-box tests?",
        "Because it reveals parts of the code that those tests do not exercise",
        ["Because it turns those black-box tests into white-box tests", "Because it replaces the need to measure requirements coverage", "Because it is mandatory at every test level and in every project"],
        "Structural coverage measures provide an objective way to identify gaps and design additional tests.",
    ),
    # 4.4 Experience-based test techniques
    "c4-23": en(
        "What is error guessing?",
        "Anticipating errors, defects and failures based on the tester's knowledge and designing tests to trigger them",
        ["Estimating the number of defects with a statistical model", "Choosing values at random", "Repeating the tests that failed in the previous release"],
        "It draws on how the application has behaved in the past, typical developer errors and failures in other applications.",
    ),
    "c4-24": en(
        "What is a fault attack?",
        "A methodical approach to error guessing: a list of possible errors is drawn up and tests are designed to trigger them",
        ["A security test against external attacks", "An extreme load test", "A formal code review"],
        "The list can be based on experience, defect data and general knowledge about why software fails.",
    ),
    "c4-25": en(
        "When is exploratory testing especially useful?",
        "When specifications are few or inadequate, or there is significant time pressure",
        ["When 100% branch coverage must be achieved", "When regulations require step-by-step documented test cases", "When nobody has experience in the domain"],
        "Its effectiveness depends on experience, domain knowledge and skills such as curiosity and critical thinking.",
    ),
    "c4-26": en(
        "In session-based exploratory testing, what guides each session?",
        "A test charter with the objective of the session",
        ["A detailed step-by-step script", "A decision table", "The project plan"],
        "The session is time-boxed and usually ends with a short debriefing.",
    ),
    "c4-27": en(
        "What is the risk of a test checklist that is used unchanged for a long time?",
        "It becomes less effective because developers learn to avoid those errors; it must be updated",
        ["It becomes too formal", "It prevents black-box techniques from being applied", "It forces all tests to be automated"],
        "Checklists are updated based on defect analysis, and items that no longer add value are removed.",
    ),
    "c4-57": en(
        "Which of these sources of information does error guessing use?",
        "Typical development errors and failures seen in similar applications",
        ["The decision and loop structure of the component's source code", "The combinations of conditions and actions in a decision table", "The states, events and transitions of the system's behavioural model"],
        "Error guessing draws on the application's history, typical development errors and failures in other applications.",
    ),
    "c4-58": en(
        "For 90 minutes, a tester investigates the booking feature following the objective \"Explore date changes on non-refundable fares to discover calculation errors\". She designs, executes and logs the tests at the same time and holds a debriefing at the end. Which technique is she applying?",
        "Session-based exploratory testing",
        ["Checklist-based testing", "State transition testing", "Fault attack"],
        "A time-boxed session, a test charter with the objective, simultaneous design and execution, and a final debriefing.",
    ),
    "c4-59": en(
        "If a checklist is high-level, what effect does it usually have on testing?",
        "There is variability in execution: greater coverage but less repeatability",
        ["The tests become fully repeatable from one execution to the next", "Coverage decreases because everyone tests exactly the same thing", "All the guidance and consistency provided by the checklist are lost"],
        "High-level checklists leave room for the tester: the actual way of testing varies, which broadens coverage at the expense of repeatability.",
    ),
    "c4-60": en(
        "How should the items of a test checklist be phrased?",
        "Often as questions that can be checked separately and directly",
        ["As exit criteria for the test level to which the checklist applies", "As checks that a tool already performs automatically", "As general quality objectives that affect the whole product"],
        "Items should not be automated checks, entry or exit criteria, or too general.",
    ),
    "c4-61": en(
        "Which statement about exploratory testing is correct?",
        "It can incorporate other test techniques, such as equivalence partitioning",
        ["It excludes the use of black-box techniques during the session", "It requires the test cases to be written before starting", "It can only be performed by the system's end users"],
        "During exploration, the tester can apply any technique that helps them learn about the test object.",
    ),
    "c4-62": en(
        "A tester draws up a list of possible defects and failures for a form (empty mandatory fields, special characters, pasting 10,000 characters, double-clicking \"Submit\") and designs a test to trigger each one. What is he applying?",
        "A fault attack",
        ["Checklist-based testing", "Boundary value analysis", "Session-based exploratory testing"],
        "A fault attack is the methodical form of error guessing: a list of possible errors, defects or failures, and tests designed to expose them.",
    ),
    # 4.5 Collaboration-based test approaches
    "c4-28": en(
        "What are the \"3 Cs\" of a user story?",
        "Card, Conversation and Confirmation",
        ["Code, Coverage and Quality", "Customer, Contract and Cost", "Criterion, Case and Closure"],
        "The confirmation is the acceptance criteria.",
    ),
    "c4-29": en(
        "According to INVEST, a good user story should be…",
        "Independent, Negotiable, Valuable, Estimable, Small and Testable",
        ["Immediate, Normative, Visible, Economical, Simple and Technical", "Integrated, New, Variable, Stable, Secure and Traceable", "Internal, Numbered, Validated, Written, Simple and Terminated"],
        "The \"T\" for Testable is a reminder that it must be possible to check it.",
    ),
    "c4-30": en(
        "Which formats are commonly used to write acceptance criteria?",
        "Scenario-oriented (Given/When/Then) and rule-oriented (verification list)",
        ["UML diagrams only", "Low-level test cases only", "Code coverage tables"],
        "They are used to define the scope, reach consensus, describe scenarios and serve as the basis for acceptance tests.",
    ),
    "c4-31": en(
        "In acceptance test-driven development (ATDD), when are the tests written?",
        "Before the story is implemented, based on the acceptance criteria and collaboratively",
        ["After the release, based on failures in production", "During the final regression run", "Only by the developer, once the code is finished"],
        "Acceptance tests are created before the code by business, development and testing together.",
    ),
    "c4-32": en(
        "Acceptance criterion: \"A transfer of more than €5,000 requires double confirmation\". Which pair of examples best tests the boundary?",
        "One of €5,000 (no double confirmation) and another of €5,000.01 (with double confirmation)",
        ["A single one of €10,000", "One of €4,000 and another of €6,000", "A transfer with no amount"],
        "\"More than 5,000\" leaves €5,000 outside and the next cent inside.",
    ),
    "c4-33": en(
        "In ATDD, in what order is it recommended to write the test cases?",
        "Positive tests (happy path) first, then negative tests, then non-functional characteristics",
        ["Non-functional tests first and positive tests last", "Negative test cases only", "The order is decided by the tool"],
        "Correct behaviour is confirmed first, and then errors and non-functional aspects are covered.",
    ),
    "c4-63": en(
        "Who takes part in collaborative user story writing?",
        "Business, development and testing, to achieve a shared vision",
        ["Only the product owner, who then hands them to the team", "Only the tester, to make sure they are testable", "The customer and project management, without the technical team"],
        "The three perspectives (business, development and testing) collaborate to reach a common understanding of what is to be delivered.",
    ),
    "c4-64": en(
        "What are the acceptance criteria of a user story used for?",
        "To agree on its scope and to serve as the basis for acceptance testing",
        ["To describe the technical architecture of the chosen solution", "To log the defects found during the sprint", "To set the team's velocity in each of the iterations"],
        "They also help to reach consensus, describe positive and negative scenarios, and plan and estimate more accurately.",
    ),
    "c4-65": en(
        "Acceptance criterion: \"Given a user with 3 consecutive failed login attempts, when they enter an incorrect password again, then the account is locked for 30 minutes\". Which test case is correctly derived from the criterion?",
        "After 3 consecutive failures, enter a wrong password and check the 30-minute lockout",
        ["After 3 consecutive failures, enter the correct password and check the 30-minute lockout", "With no previous failures, enter a wrong password and check the 30-minute lockout", "After 2 consecutive failures, enter a wrong password and check the 30-minute lockout"],
        "The precondition (Given) is 3 previous failures, the action (When) another wrong password, and the outcome (Then) the 30-minute lockout.",
    ),
    "c4-66": en(
        "In ATDD, what characteristic should the test cases have?",
        "Be understandable to the business and not go beyond the user story",
        ["Be written in the same programming language as the product", "Also cover the features of other related user stories", "Repeat the same characteristics in several test cases, to be safe"],
        "They are written in natural language that stakeholders understand, cover all characteristics of the story without duplication and do not go beyond its scope.",
    ),
    "c4-67": en(
        "In ATDD, if the test cases are written in a format understood by a test automation framework, what is achieved?",
        "The team can automate them, turning them into executable requirements",
        ["The acceptance criteria of the story are no longer needed", "The business no longer needs to review or even understand them", "They can then only be executed manually by the tester"],
        "Written in a format supported by the framework, developers can automate them while implementing the feature.",
    ),
    "c4-68": en(
        "A story says: \"As a customer, I want the flight search to be fast\". According to INVEST, what is its main problem?",
        "It is not testable, because \"fast\" has no measurable criterion",
        ["It is not independent, because it depends on another backlog story", "It is not negotiable, because it imposes a specific technical solution", "It is not small, because it spans the work of several epics"],
        "Without an objective criterion (for example, results in under 2 seconds), it is impossible to decide whether the story is met.",
    ),
    "c4-69": en(
        "Which of these acceptance criteria is written in a scenario-oriented format?",
        "Given a cart with 2 products, when I apply the SUMMER coupon, then the total drops by 10%",
        ["The SUMMER coupon applies a 10% discount to the total amount of the shopping cart", "Each registered customer can use the SUMMER coupon only once during the whole campaign", "The SUMMER coupon cannot be combined with any other promotion active in the store"],
        "The scenario-oriented format uses Given/When/Then; the other three are standalone rules, typical of the rule-oriented format.",
    ),
}
