"""Capítulo 3 · versión en inglés (mismos ids que ch3.py; la correcta primero)."""

from app.modules.academy.exam_bank.model import BankText, en

EN: dict[str, BankText] = {
    # 3.1 Static testing basics
    "c3-01": en(
        "Which work products can be examined using static testing?",
        "Any work product that can be read and understood: requirements, code, plans, contracts or models",
        ["Only executable code", "Only the user interface in production", "Only automated test scripts"],
        "Static testing can be applied to almost any work product; static analysis applies to those with a formal structure, such as code.",
    ),
    "c3-02": en(
        "What value does static testing provide?",
        "It detects defects early, before anything is executed, when they are cheaper to fix",
        ["It measures system performance under load", "It completely replaces dynamic testing", "Only testers can perform it"],
        "It also helps create a shared understanding among stakeholders and detect defects that are hard to find by execution.",
    ),
    "c3-03": en(
        "Which defect is easier to find with static testing than with dynamic testing?",
        "Unreachable code or a deviation from the coding standard",
        ["A performance problem with many users", "An intermittent network failure", "A usability problem found by real users"],
        "Typical defects: in requirements and design, unreachable code, deviations from standards, incorrect interface specifications or security vulnerabilities.",
    ),
    "c3-04": en(
        "What is a key difference between static and dynamic testing?",
        "Static testing finds defects directly; dynamic testing causes failures from which the defects are then sought",
        ["Static testing requires executing the code", "Dynamic testing only applies to documents", "Static testing only finds performance defects"],
        "They complement each other: static testing does not require execution, and dynamic testing measures behaviour that is only visible during execution.",
    ),
    "c3-05": en(
        "What is static analysis?",
        "The evaluation of code or other work products using tools, without executing them",
        ["An automated load test", "An informal peer review", "Acceptance testing with users"],
        "Static analysis is tool-based and can be integrated into the CI pipeline.",
    ),
    "c3-13": en(
        "Which quality characteristic can be evaluated by static testing, without executing the code?",
        "Maintainability",
        ["Response time under load", "Memory consumption at run time", "Performance efficiency"],
        "Static testing measures characteristics that do not depend on executing the code, such as maintainability; dynamic testing measures those that do, such as performance.",
    ),
    "c3-14": en(
        "In which case may tool-based static analysis not be appropriate?",
        "For third-party executable code when there are legal reasons preventing it",
        ["For source code written by the team itself", "For the project's automated test scripts", "For a formal model of the system"],
        "The syllabus mentions work products that are hard to interpret or should not be analysed for legal reasons, such as third-party executable code.",
    ),
    "c3-15": en(
        "While reviewing the user stories for a digital wallet, the team notices that one sets the top-up limit at €500 and another at €1,000. What type of defect is this?",
        "An inconsistency between requirements",
        ["A security vulnerability", "A database design defect", "A run-time failure"],
        "Inconsistencies, ambiguities, contradictions and omissions in requirements are typical defects found by static testing.",
    ),
    "c3-16": en(
        "A static analysis tool detects that the code calls a transfers function with parameters in a different order and of different types from those declared. What type of defect is this?",
        "An incorrect interface specification",
        ["A performance defect", "A usability problem", "A browser compatibility defect"],
        "Parameters that do not match in number, type or order are an interface defect that static testing detects easily.",
    ),
    "c3-17": en(
        "During a review, the team discovers that one acceptance criterion of the \"block card\" user story has no associated test. What does this illustrate?",
        "That static testing can detect gaps in test basis coverage",
        ["That dynamic testing is no longer needed for that story", "That a failure has occurred in production", "That the story must be removed from the backlog"],
        "Static testing also finds gaps or inaccuracies in test basis coverage, such as acceptance criteria with no tests.",
    ),
    # 3.2 Feedback and review process
    "c3-06": en(
        "Why is early and frequent stakeholder feedback important?",
        "It prevents misunderstandings about requirements and avoids changes arriving late and becoming expensive",
        ["It allows acceptance testing to be skipped", "It reduces the number of environments needed", "It makes risk analysis unnecessary"],
        "Early feedback makes it possible to change course sooner and focus on what delivers the most value.",
    ),
    "c3-07": en(
        "In which review process activity are the scope, objectives and exit criteria defined?",
        "Planning",
        ["Review initiation", "Individual review", "Communication and analysis"],
        "Activities: planning, review initiation, individual review, communication and analysis, and fixing and reporting.",
    ),
    "c3-08": en(
        "In which review process activity does each reviewer examine the work product and record anomalies?",
        "Individual review",
        ["Planning", "Review initiation", "Fixing and reporting"],
        "In individual review, each reviewer assesses the quality of the work product and records anomalies, recommendations and questions.",
    ),
    "c3-09": en(
        "Which review role ensures that review meetings run effectively and creates a safe environment for expressing opinions?",
        "Moderator (facilitator)",
        ["Scribe (recorder)", "Author", "Manager"],
        "Roles: manager, author, moderator, scribe, reviewer and review leader.",
    ),
    "c3-10": en(
        "Which review type is the most formal, follows a complete process, collects metrics and aims to find the maximum number of anomalies?",
        "Inspection",
        ["Informal review", "Walkthrough", "Technical review"],
        "Inspection is the most formal type; the author cannot act as review leader or scribe.",
    ),
    "c3-11": en(
        "Which review type is led by the author and can be used to educate, build consensus or find anomalies?",
        "Walkthrough",
        ["Inspection", "Technical review", "Audit"],
        "In a walkthrough the author leads the session; it can serve several objectives.",
    ),
    "c3-12": en(
        "Which is a success factor for reviews?",
        "Clear objectives and measurable exit criteria, without using the results to evaluate participants",
        ["Reviewing very large documents in one go", "Using the anomalies found to evaluate the author", "Skipping training for participants"],
        "Other success factors: choosing the right review type, reviewing small chunks, giving feedback, management support and training.",
    ),
    "c3-18": en(
        "What is the goal of review initiation?",
        "Making sure all participants are prepared: they have access to the work product, understand their role and responsibilities, and have the materials they need",
        ["Defining the scope, objectives, effort and exit criteria of the review", "Recording the anomalies, questions and recommendations found by each reviewer", "Creating defect reports and reporting the results of the review"],
        "The other options belong to planning, individual review and fixing and reporting.",
    ),
    "c3-19": en(
        "In a review meeting, the status, owner and required actions are decided for each anomaly, and the quality level of the work product is assessed. Which activity is this?",
        "Communication and analysis",
        ["Individual review", "Fixing and reporting", "Review initiation"],
        "In communication and analysis, anomalies are analysed and decided upon, and the quality level and follow-up actions are determined.",
    ),
    "c3-20": en(
        "What happens in the fixing and reporting activity of a review?",
        "Defect reports are created so that corrective actions can be followed up and, once the exit criteria are met, the work product can be accepted",
        ["Roles are assigned and the work product and supporting materials are distributed to participants", "Each reviewer examines the work product on their own and records anomalies, questions and recommendations", "The objectives, scope, effort and exit criteria of the review are set"],
        "The other options belong to review initiation, individual review and planning.",
    ),
    "c3-21": en(
        "Which role collates the reviewers' anomalies and records review information, such as decisions and new anomalies found during the meeting?",
        "Scribe (recorder)",
        ["Moderator (facilitator)", "Review leader", "Manager"],
        "The scribe collates and records; the moderator runs the meetings and the review leader has overall responsibility for the review.",
    ),
    "c3-22": en(
        "Which role takes overall responsibility for the review and decides who is involved and when and where it takes place?",
        "Review leader",
        ["Manager", "Moderator (facilitator)", "Author"],
        "The manager decides what is reviewed and provides resources; the review leader organizes the review and is responsible for it.",
    ),
    "c3-23": en(
        "The architects of an e-commerce platform meet, with a moderator, to choose between two designs for the catalogue cache and reach consensus. Which review type fits best?",
        "Technical review",
        ["Inspection", "Informal review", "Walkthrough"],
        "A technical review is performed by technically qualified reviewers, led by a moderator, and aims to gain consensus and make decisions on technical problems.",
    ),
    "c3-24": en(
        "A developer asks a colleague to take a quick look at her pull request before merging it, with no defined process or report. What type of review is this?",
        "Informal review",
        ["Inspection", "Technical review", "Walkthrough"],
        "An informal review does not follow a defined process and does not require a formal documented output.",
    ),
    "c3-25": en(
        "A team reviews a 120-page document in one go in a four-hour session and finds hardly any anomalies in the final part. Which success factor has it ignored?",
        "Conducting reviews on small chunks so that reviewers do not lose concentration",
        ["Using review metrics to evaluate the author", "Having the author always lead the review", "Limiting the review to the most senior reviewers"],
        "Reviewing small chunks prevents loss of concentration; using results to evaluate people works against review success.",
    ),
}
