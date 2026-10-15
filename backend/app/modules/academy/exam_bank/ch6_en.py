"""Capítulo 6 · versión en inglés (mismos ids que ch6.py; la correcta primero)."""

from app.modules.academy.exam_bank.model import BankText, en

EN: dict[str, BankText] = {
    # 6.1 Tool support for testing
    "c6-01": en(
        "A tool that generates test data from a model belongs to the category of…",
        "Test design and test implementation tools",
        ["Test management tools", "Static testing tools", "Collaboration tools"],
        "These tools facilitate the generation of test cases, test data and test procedures.",
    ),
    "c6-02": en(
        "A tool that simulates thousands of concurrent users is a…",
        "Non-functional testing tool",
        ["Static testing tool", "Test management tool", "DevOps tool"],
        "They enable tests that are difficult or impossible to perform manually, such as load testing.",
    ),
    "c6-03": en(
        "Which type of tool helps to manage requirements, tests and defects and their traceability?",
        "Test management tools",
        ["Test execution and coverage tools", "Non-functional testing tools", "Test design tools"],
        "Management tools increase the efficiency of the test process by facilitating management of the SDLC, requirements, tests, defects and configuration.",
    ),
    "c6-07": en(
        "A static analysis tool that flags uninitialized variables in the code belongs to the category of…",
        "Static testing tools",
        ["Test execution and coverage tools", "Test management tools", "Non-functional testing tools"],
        "Static testing tools support reviews and static analysis without executing the code.",
    ),
    "c6-08": en(
        "A tool that triggers the build and the automated tests on every commit in the delivery pipeline belongs to the category of…",
        "DevOps tools",
        ["Test design and test implementation tools", "Static testing tools", "Collaboration tools"],
        "DevOps tools support the delivery pipeline, workflow tracking, automated build processes and CI/CD.",
    ),
    "c6-09": en(
        "Containers and virtual machines that make it possible to spin up identical test environments are tools that support…",
        "Scalability and deployment standardization",
        ["Defect management and traceability", "Static analysis of the source code", "Test case design with black-box techniques"],
        "The syllabus includes, among test tools, those that facilitate scalability and deployment standardization.",
    ),
    # 6.2 Benefits and risks of test automation
    "c6-04": en(
        "What is a benefit of test automation?",
        "Greater consistency and repeatability by preventing human errors in repetitive tasks",
        ["It completely removes the need for manual testing", "Scripts need no maintenance", "It guarantees there are no defects in production"],
        "Other benefits: more objective measures, faster feedback and more time for designing tests.",
    ),
    "c6-05": en(
        "What is a risk of test automation?",
        "Over-reliance on the tool, ignoring the need for critical thinking",
        ["Getting faster feedback", "Running more tests in less time", "Measuring coverage more precisely"],
        "Other risks: unrealistic expectations, underestimating maintenance, vendor dependency or incompatibility with the platform.",
    ),
    "c6-06": en(
        "The vendor of the test automation tool announces that it will stop supporting it. Which risk has materialized?",
        "Dependency on the tool vendor",
        ["Unrealistic expectations", "Over-reliance on the tool", "Incompatibility with regulatory requirements"],
        "The vendor may go out of business, retire the tool, sell it to another vendor or provide poor support.",
    ),
    "c6-10": en(
        "Management buys a test automation tool and expects all manual testing to disappear within a month. Which risk does this situation show?",
        "Unrealistic expectations about the tool",
        ["Excessive dependency on the vendor", "Incompatibility with the development platform", "Abandonment of an open-source project"],
        "Expecting the tool to solve everything, and immediately, is an unrealistic expectation about its functionality and ease of use.",
    ),
    "c6-11": en(
        "After a user interface redesign, 40% of the automated scripts stop working and nobody had planned time to update them. Which risk has materialized?",
        "Underestimating the effort required to maintain the testware",
        ["Excessive dependency on the vendor of the automation tool", "Incompatibility of the tool with regulatory requirements", "Abandonment of the open-source project behind the tool"],
        "Automated scripts are testware that must be maintained when the test object changes; failing to plan for this is a typical risk.",
    ),
    "c6-12": en(
        "Which of the following is a benefit of automating test execution?",
        "Shorter test execution times, which allow earlier defect detection",
        ["No maintenance costs after the first version of the scripts", "Complete replacement of the tester's critical judgement", "Automatic detection of all usability problems in the product"],
        "Faster execution allows earlier defect detection, faster feedback and a shorter time to market.",
    ),
}
