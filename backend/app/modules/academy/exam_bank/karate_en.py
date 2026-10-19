"""Karate course final theory exam · English version (same ids as karate.py; correct answer first)."""

from app.modules.academy.exam_bank.karate import _MOCK, _RETRY, _RUNNER
from app.modules.academy.exam_bank.model import BankText, en

_STATUS_ONLY = """Scenario: account details
  Given url 'https://api.kobalto.test/v1/accounts/ACC-1001'
  When method get
  Then status 200
  * print response"""

_OUTLINE = """Scenario Outline: amount <amount>
  Given path 'transfers'
  And request { amount: <amount>, currency: 'EUR' }
  When method post
  Then status <status>

  Examples:
    | amount | status |
    | 0.01   | 201    |
    | 1000   | 201    |"""

EN: dict[str, BankText] = {
    # ------------------------------------------------------------ 11 · Fundamentals and match
    "c11-01": en(
        "Which Karate step sets the part of the URL that changes in each scenario, without repeating the host?",
        "path",
        ["url", "param", "header"],
        "url is set once (usually in the Background with baseUrl) and path appends the segments of each request.",
    ),
    "c11-02": en(
        "When does the Background of a feature run?",
        "Before every scenario in the feature",
        ["Only once, before the first scenario", "After every scenario", "Only when a scenario calls it with call"],
        "The Background is repeated before every scenario: that is why every scenario starts from the same state.",
    ),
    "c11-03": en(
        "After «When method get», what happens to the path, param and request that had been set?",
        "They are reset: the next request starts without them",
        ["They are kept for every request in the scenario", "They are kept until the end of the feature", "Only the request is reset"],
        "As in real Karate: after each method, path, params, one-off headers and the body are cleared.",
    ),
    "c11-04": en(
        "What is the main problem with this scenario?",
        "It only checks the status: a 200 with wrong data would also pass",
        ["The print makes the scenario slow", "A Background is missing", "status 200 should come before method"],
        "print shows the response but checks nothing; on top of that, the full URL makes it impossible to switch environments.",
        code=_STATUS_ONLY,
    ),
    "c11-05": en(
        "Which marker checks that a field exists and is text, whatever its value?",
        "#string",
        ["#present", "#notnull", "#ignore"],
        "#string requires a string; #present only that the key exists; #notnull that it is not null.",
    ),
    "c11-06": en(
        "What does «alias: '##string'» mean in a schema?",
        "alias is optional: it may be missing or null; if present, it is a string",
        ["alias must be an empty string", "alias can be of any type", "alias is mandatory and cannot be null"],
        "The double # marks an optional field (missing or null).",
    ),
    "c11-07": en(
        "The response has a field that the schema does not include. What does «match response == schema» do?",
        "It fails: == requires exactly the same keys",
        ["It passes: it only compares the schema's keys", "It passes if the extra field is null", "It fails only if the extra field is an object"],
        "== compares the whole object; to ignore extra fields, use contains.",
    ),
    "c11-08": en(
        "What does «match each response.items contains { status: 'ACTIVE' }» check?",
        "That every element of the list has status ACTIVE",
        ["That at least one has status ACTIVE", "That the list has a single element", "That status is the only field of each element"],
        "match each applies the comparison to every element; contains allows other keys.",
    ),
    "c11-09": en(
        "Which marker validates an array of exactly 2 elements?",
        "#[2]",
        ["#array(2)", "#[] 2", "#size2"],
        "#[n] checks that it is an array of length n; #[] only that it is an array.",
    ),
    "c11-10": en(
        "A test validates an account's details with «match response contains { id: '#string' }». The API adds a field with the full card number. What happens?",
        "Nothing: contains ignores the extra field and the leak goes unnoticed",
        ["It fails because there is a new field", "It fails because id is not unique", "Karate warns about sensitive data"],
        "To detect fields that should not be there, compare the full contract with == (or check #notpresent).",
    ),
    "c11-11": en(
        "Which embedded expression uses the value of the accountId variable inside a JSON?",
        "'#(accountId)'",
        ["'${accountId}'", "'<accountId>'", "'{{accountId}}'"],
        "#(expr) is replaced by the value of the expression when the JSON is evaluated.",
    ),
    "c11-12": en(
        "A scenario fails at its second step. What happens to the following steps?",
        "They are not run: the scenario is marked as failed",
        ["They run anyway", "Only the match steps run", "The scenario is repeated"],
        "A failed step skips the rest of the scenario; the other scenarios in the feature still run.",
    ),
    # ------------------------------------------------------------ 12 · Configuration and data
    "c12-01": en(
        "When does karate-config.js run?",
        "Before every scenario; what it returns becomes the global variables",
        ["Once, when the project is compiled", "Only when called with call", "At the end of the run"],
        "karate-config.js is evaluated for every scenario and its return object defines variables such as baseUrl.",
    ),
    "c12-02": en(
        "How do you run the suite against pre-production without touching the features?",
        "With -Dkarate.env=pre and a karate-config.js that picks the URL based on karate.env",
        ["Changing url in every Background", "With a different feature per environment", "With a @pre tag on every scenario"],
        "karate.env comes from the command line and the configuration decides baseUrl, keys, etc.",
    ),
    "c12-03": en(
        "Where should the pre-production API key live?",
        "In a pipeline property (-Dkobalto.apiKey=…) read with karate.properties",
        ["Hard-coded in karate-config.js", "In every feature that uses it", "In a comment in the runner"],
        "Secrets do not go in the repository: they arrive as CI properties or variables.",
    ),
    "c12-04": en(
        "What does «header x-api-key = null» do?",
        "It removes that header from the next request, even if it is configured for all of them",
        ["It sends the header with the text null", "It causes a syntax error", "It deletes the header from every scenario"],
        "A null value removes the header: useful to test that the API requires it.",
    ),
    "c12-05": en(
        "After creating a transfer, how do you look it up by its id in the same scenario?",
        "* def id = response.id and then Given path 'transfers', id",
        ["Copying the id from the log by hand", "With a second scenario that reads the id", "With print response.id"],
        "Chaining: store what you need from one response in a variable and use it in the next request.",
    ),
    "c12-06": en(
        "What does «* def body = read('transfer.json')» do?",
        "It reads the JSON and resolves its embedded expressions #(…)",
        ["It sends it as a request", "It validates it against the contract", "It writes it to the report"],
        "read of a .json file returns the object, with its embedded expressions evaluated.",
    ),
    "c12-07": en(
        "Which step changes a field of a JSON variable before sending it?",
        "* set body.amount = 0",
        ["* change body.amount = 0", "* put body.amount 0", "* match body.amount = 0"],
        "set (or a JavaScript assignment) modifies the variable; remove deletes a key.",
    ),
    "c12-08": en(
        "In a Scenario Outline, what is the point of writing a column header as «amount!»?",
        "So that the value is a number (or another JSON type) and not text",
        ["So that the column is mandatory", "To negate it in the match", "To hide it in the report"],
        "With ! the cell value is evaluated: 1000 is a number, not the string '1000'.",
    ),
    "c12-09": en(
        "The limit is «up to €1,000 per transfer, inclusive». Which rows are essential?",
        "1000 (accepted) and 1000.01 (rejected)",
        ["500 and 2000", "1 and 1000000", "999 and 1001"],
        "Boundary values: exactly on the edge and the value immediately outside, with the precision of the rule (cents).",
    ),
    "c12-10": en(
        "What does the table «| read('cases.json') |» under Examples do?",
        "It creates one row for each object in the file's array",
        ["It reads the file once and passes it as a variable", "It validates the file against a schema", "It only works with CSV files"],
        "Dynamic Examples: each element of the array is a row, keeping its types.",
    ),
    "c12-11": en(
        "What is wrong with this outline if the contract accepts amounts from €0.01 to €1,000?",
        "Rows just outside the boundaries (0 and 1000.01) that must be rejected are missing",
        ["A row with 500 is missing", "The amounts should be quoted", "There is no need to check the status"],
        "It only tests that valid values are accepted; boundary bugs show up just outside the range.",
        code=_OUTLINE,
    ),
    "c12-12": en(
        "Which variable holds the headers of the last response?",
        "responseHeaders",
        ["response.headers", "headers", "karate.headers"],
        "Each header is a list: responseHeaders['Location'][0].",
    ),
    # ------------------------------------------------------------ 13 · Reuse and authentication
    "c13-01": en(
        "What does «* def auth = call read('login.feature')» return?",
        "An object with the variables of the called feature (auth.token…)",
        ["The text of the feature", "Only the status of the last request", "Nothing"],
        "call returns the variables of the called feature; if not assigned, they flow into the calling scenario.",
    ),
    "c13-02": en(
        "Six features use «callonce read('login.feature')». How many times does the login happen in one run?",
        "Six: once per feature",
        ["Once", "Once per scenario", "Never"],
        "callonce is once per feature; for once per run there is karate.callSingle.",
    ),
    "c13-03": en(
        "What is @ignore for in a reusable login feature?",
        "So that it does not run on its own as a test; call still runs it",
        ["So that it cannot be called", "To hide the secret", "To run it in parallel"],
        "The runner runs every feature except the @ignore ones.",
    ),
    "c13-04": en(
        "How do you pass an argument to the called feature?",
        "* def ro = call read('login.feature') { scope: 'accounts:read' }",
        ["* call read('login.feature') scope=accounts:read", "* def scope = call 'accounts:read'", "You can't: features do not take arguments"],
        "The object after the call defines variables in the called feature (and __arg).",
    ),
    "c13-05": en(
        "Inside the called feature, how do you give an optional argument a default value?",
        "* def scope = karate.get('scope', 'accounts:read transfers:write')",
        ["* def scope = scope || 'all'", "* default scope = 'all'", "* def scope = __arg.scope!"],
        "karate.get returns the variable if it exists, or the default value otherwise.",
    ),
    "c13-06": en(
        "A valid token without the required scope tries to create a transfer. Which code should the API return?",
        "403",
        ["401", "400", "500"],
        "401 means «I don't know who you are»; 403 «I know who you are, but you can't do this».",
    ),
    "c13-07": en(
        "To test that a revoked token stops working, why not use the token shared through callonce?",
        "Because revoking it breaks the other scenarios that use it",
        ["Because callonce does not return a token", "Because it is slower", "Because the API does not allow revoking it"],
        "A scenario that destroys shared data breaks the others: request a token of its own with call.",
    ),
    "c13-08": en(
        "The suite fails with 429 TOO_MANY_REQUESTS on /auth/token. What is most likely?",
        "The suite requests more tokens than the limit allows",
        ["A bug in the API", "Wrong credentials", "The CI network is slow"],
        "The limit is documented: request fewer tokens (callonce / callSingle).",
    ),
    "c13-09": en(
        "Where is karate.callSingle usually used for the login?",
        "In karate-config.js, passing it the configuration as an argument",
        ["In every Background", "In the Java runner", "In the login feature itself"],
        "It runs once per run and its cache serves every feature and thread.",
    ),
    "c13-10": en(
        "Wrong credentials return a 500 with «NullPointerException». Is that correct?",
        "No: it should be a clean 401, without internal traces",
        ["Yes, it is an error", "Yes, if the message is clear", "It depends on the client"],
        "Bad credentials are an expected client error; a 500 with stack traces also leaks internal details.",
    ),
    "c13-11": en(
        "A scenario needs data that another scenario in the same feature creates. Best solution?",
        "Create the data in the scenario itself (or with a utility invoked with call)",
        ["Always run the scenarios in the same order", "Store it in a global variable with karate.set", "Merge the two scenarios into one long one"],
        "Scenarios must be independent: in parallel or on their own, the order is not guaranteed.",
    ),
    "c13-12": en(
        "Which header carries an OAuth2 token on every request?",
        "Authorization: Bearer <token>",
        ["x-api-key: <token>", "Token: <token>", "Cookie: token=<token>"],
        "It is the standard Bearer scheme.",
    ),
    # ------------------------------------------------------------ 14 · Errors, async and mocks
    "c14-01": en(
        "In a negative case, what is worth checking besides the status?",
        "The error code: two different errors can share a status",
        ["Nothing else", "That the body is empty", "The response time"],
        "ACCOUNT_NOT_FOUND and TRANSFER_NOT_FOUND are both 404: the code tells which one it is.",
    ),
    "c14-02": en(
        "A 404 arrives as { timestamp, status, error, path } and the contract says { code, message, traceId }. Is it a bug?",
        "Yes: it breaks the common error format even though the status is correct",
        ["No: the status is the expected one", "Only if the message is in English", "No, it is Spring's standard format"],
        "Partners read code and traceId: a different format breaks their error handling.",
    ),
    "c14-03": en(
        "What does this snippet do?",
        "It repeats the GET until the status is COMPLETED or the attempts run out",
        ["It does a GET and waits 3 seconds", "It repeats the GET forever", "It fails if the first GET is not COMPLETED"],
        "retry until goes before method and repeats the request at the configured interval.",
        code=_RETRY,
    ),
    "c14-04": en(
        "With nothing configured, how much does retry until retry?",
        "3 attempts, every 3 seconds",
        ["10 attempts, every second", "Until it passes", "1 attempt"],
        "It is changed with configure retry = { count, interval }.",
    ),
    "c14-05": en(
        "A transfer to another bank gives «too many retry attempts: 10» with a 1 s interval; the contract says it takes up to 8 s, and internal transfers pass. What do you do?",
        "Check the last response: if it is still PROCESSING beyond the contract, it is a bug",
        ["Raise it to 100 attempts", "Add a 30 s sleep", "Remove that test"],
        "If it does not finish within the contract's time, the problem is in the API, not in the wait.",
    ),
    "c14-06": en(
        "An amount sent as text («10,50») returns a 500. What should it return?",
        "A 400 validation error pointing to the field",
        ["500 is fine", "200, ignoring the amount", "404"],
        "Incorrect client input is a 4xx; a 5xx signals a server failure.",
    ),
    "c14-07": en(
        "How do you check that a 503 comes with a Retry-After header containing a number?",
        "match responseHeaders['Retry-After'][0] == '#regex [0-9]+'",
        ["match response.Retry-After == '#number'", "header Retry-After = '#number'", "status 503 is enough"],
        "Response headers live in responseHeaders, each one as a list.",
    ),
    "c14-08": en(
        "What starts a Karate mock from a test?",
        "karate.start({ mock: 'mocks/paynexo.feature', port: 8090 })",
        ["call read('mocks/paynexo.feature')", "karate.mock('paynexo')", "Runner.mock(8090)"],
        "karate.start spins up a server with the mock feature and returns its port.",
    ),
    "c14-09": en(
        "In this mock, which response does a request with merchant DENEGADO get?",
        "APPROVED: the first scenario that matches wins",
        ["DECLINED: the most specific scenario wins", "Both", "An ambiguity error"],
        "Order matters: specific cases go at the top and the general one at the end.",
        code=_MOCK,
    ),
    "c14-10": en(
        "How does a mock simulate a third party that takes 5 seconds?",
        "* def responseDelay = 5000",
        ["* sleep 5000", "* def responseStatus = 504", "* configure timeout = 5000"],
        "responseDelay delays the mock's response (ms).",
    ),
    "c14-11": en(
        "Your mock approves everything it receives and the suite is green. What is the risk?",
        "That we send requests the real third party would reject, without noticing",
        ["None", "That the mock is slow", "That the runner fails"],
        "The mock should validate the request like the third party does (karate.match with a schema) to keep an eye on the contract.",
    ),
    "c14-12": en(
        "What does karate.match(request, schema) return?",
        "An object { pass, message }, without failing the scenario",
        ["true or false", "It throws an error if it does not match", "The schema"],
        "That is why it is useful in a mock's conditions.",
    ),
    # ------------------------------------------------------------ 15 · Pipeline and framework
    "c15-01": en(
        "With this runner, the pipeline says BUILD SUCCESS even when scenarios fail. Why?",
        "Nobody checks getFailCount(): an assertEquals is missing",
        ["parallel(4) hides the failures", ".outputCucumberJson(true) is missing", "The ~@ignore tag excludes the failed ones"],
        "parallel returns results; without an assert, the JUnit test always passes.",
        code=_RUNNER,
    ),
    "c15-02": en(
        "What does .tags(\"@payments\", \"~@slow\") run?",
        "The @payments scenarios that are not @slow",
        ["@payments, or those that are not @slow", "Only the @slow ones", "Nothing: it is an error"],
        "Each argument adds a condition (AND); a comma inside one argument is OR.",
    ),
    "c15-03": en(
        "Which scenarios go into the smoke run of every pull request?",
        "The essential and fast ones",
        ["All of them", "The ones that fail often", "The performance ones"],
        "The smoke run gives a fast signal; the full regression goes in another job.",
    ),
    "c15-04": en(
        "In parallel, a test checks the exact balance of ACC-1001, which other tests also use. What will happen?",
        "It will pass or fail depending on the execution order",
        ["It will always pass", "It will always fail", "Karate locks it"],
        "Shared data + parallel = flaky test. The fix: each scenario gets its own data.",
    ),
    "c15-05": en(
        "A scenario with its own data fails only in parallel and always passes when run alone. What do you suspect?",
        "A problem in the application with concurrent requests",
        ["That the test is badly written", "That the pipeline is slow", "Nothing: it is normal"],
        "If the test is isolated, different behaviour under concurrency points to the API: it is a bug.",
    ),
    "c15-06": en(
        "A test fails one run out of three. What do you do first?",
        "Investigate what changes between runs",
        ["Retry it until it passes", "Tag it @ignore", "Delete it"],
        "Retrying it or switching it off hides the cause, which may be in the test or in the application.",
    ),
    "c15-07": en(
        "Which Runner option generates the JSON that tools such as Xray import?",
        ".outputCucumberJson(true)",
        [".outputHtml(true)", ".reportXray(true)", ".json(true)"],
        "For JUnit XML there is .outputJunitXml(true).",
    ),
    "c15-08": en(
        "The same error schema is copied into five features. Best option?",
        "A schemas/error.json file read with read() from each feature",
        ["Leave it as it is", "Copy it into karate-config.js as text", "Remove the schemas"],
        "A single file: if the contract changes, it is changed in one place.",
    ),
    "c15-09": en(
        "What makes a feature a good reusable utility?",
        "It has @ignore, does a single thing and takes arguments",
        ["It has many scenarios", "It lives in the runner's folder", "It uses print for debugging"],
        "For example, common/test-account.feature with the balance as an argument.",
    ),
    "c15-10": en(
        "When reviewing a PR with tests, what is the most useful question?",
        "What would fail if the API broke?",
        ["Does it pass on your machine?", "How many scenarios does it have?", "Does it use the latest version of Karate?"],
        "A test that cannot fail protects nothing.",
    ),
    "c15-11": en(
        "A PR contains «header Authorization = 'Bearer kbt_3f9a…'» copied from the console. What do you tell the author?",
        "That it expires and it is a secret: the token is requested in the login or in karate-config.js",
        ["That it is fine if it passes", "To put it in a comment", "To use a longer token"],
        "It works today on one machine; tomorrow it returns 401. And a secret does not belong in the code.",
    ),
    "c15-12": en(
        "Which convention makes the pipeline jobs pick the right scenarios?",
        "Every scenario carries @smoke or @regression",
        ["Names in English", "One feature per person", "Comments on every step"],
        "Runners select by tags: a scenario without a tag may be left out.",
    ),
}
