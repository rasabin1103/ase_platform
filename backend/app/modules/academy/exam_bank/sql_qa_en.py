"""SQL for QA course final test · English version (same ids as sql_qa.py; correct answer first).

The SQL snippets are the same as in Spanish: tables and columns keep their
Spanish names in both languages, as in the course.
"""

from app.modules.academy.exam_bank.model import BankText, en
from app.modules.academy.exam_bank.sql_qa import QUESTIONS

_CODE = {question.id: question.code for question in QUESTIONS}

EN: dict[str, BankText] = {
    # ------------------------------------------------------- 61 · What the app did and the edges
    # 61.1 · What the app did (mission 0)
    "c61-01": en(
        'The app says "Transfer completed". What does QA check with SQL?',
        "That the database holds exactly what was requested: the row, its amounts, its ledger entries and its audit record.",
        [
            "Nothing else: if the screen says it went well, it went well.",
            "Only that the transfers table has one more row than before.",
            "That the message on the screen is well written.",
        ],
        "The screen tells what the app thinks happened. The database is what really happened.",
    ),
    "c61-02": en(
        "The app requested a €30 transfer and the query returns one row. What has it found?",
        "A transfer stored with an amount different from the one the app requested.",
        [
            "A transfer that wasn't stored.",
            "A duplicated transfer.",
            "Nothing: the query always returns the run's transfers.",
        ],
        "The condition `t.importe <> e.importe` only lets through the rows where the database doesn't match what was requested.",
        code=_CODE["c61-02"],
    ),
    "c61-03": en(
        "In double-entry bookkeeping, what must every completed transfer meet?",
        "Two ledger entries whose amounts add up to zero.",
        [
            "One entry with the transfer amount.",
            "As many entries as the customer has accounts.",
            "No entries: entries are only for deposits.",
        ],
        "A debit on the source and a credit on the destination: −X and +X. If one is missing, the sum isn't zero.",
    ),
    "c61-04": en(
        "Which query finds the run's transfers that have no row in `auditoria`?",
        "NOT EXISTS (SELECT 1 FROM auditoria a WHERE a.registro_id = t.id AND a.tabla = 'transferencias')",
        [
            "JOIN auditoria a ON a.registro_id = t.id WHERE a.id IS NULL",
            "t.id NOT IN (SELECT tabla FROM auditoria)",
            "COUNT(*) FROM auditoria = 0",
        ],
        "With a plain JOIN, the ones without an audit record disappear before the WHERE. NOT EXISTS asks exactly what you're looking for.",
    ),
    "c61-05": en(
        'Rubén checks the run by counting: "there were 1000 transfers before and now 1006, one per case". What is he missing?',
        "Checking each row's values: a wrongly stored amount also counts as one.",
        [
            "Nothing: if the number matches, the run is correct.",
            "Counting the accounts too.",
            "Doing it twice to be sure.",
        ],
        "Counting proves how many rows there are, not what's in them.",
    ),
    "c61-06": en(
        "Two test runs share the same database. How do you isolate what one of them did?",
        "By a value that identifies it, like the reference the app used in the concepto, not by dates or approximate ids.",
        [
            "With the last rows by id.",
            "With today's rows.",
            "Deleting everything from the other run first.",
        ],
        "Dates and ids mix up overlapping runs. A reference of its own for each case tells you which row belongs to whom.",
    ),
    # 61.2 · The edges (mission 1)
    "c61-07": en(
        "`pagado_en` is a timestamp. Which payments does this condition leave out?",
        "Those on 28 February after 00:00.",
        [
            "None.",
            "Those on 1 February.",
            "Those on 28 February at exactly 00:00.",
        ],
        "`'2026-02-28'` becomes `2026-02-28 00:00`. The safe range is `>= '2026-02-01' AND < '2026-03-01'`.",
        code=_CODE["c61-07"],
    ),
    "c61-08": en(
        "What does `COUNT(segmento)` count?",
        "The rows where `segmento` isn't empty.",
        [
            "Every row.",
            "The distinct segments.",
            "The rows where `segmento` is empty.",
        ],
        "COUNT(column) ignores NULLs; COUNT(*) counts rows. The difference is how many are empty.",
    ),
    "c61-09": en(
        "To add up the payments of customers who have some incident, someone does a JOIN with `incidencias`. One customer has three. What happens?",
        "Their payments are added three times.",
        [
            "Nothing: the JOIN only checks whether it exists.",
            "The customer disappears.",
            "It gives an error about repeated rows.",
        ],
        'A JOIN repeats each payment for each incident. For "has any" you use EXISTS.',
    ),
    "c61-10": en(
        "Two sign-ups with `Ana@Kobalto.es ` and `ana@kobalto.es`. Which grouping detects them as repeated?",
        "GROUP BY lower(trim(email))",
        [
            "GROUP BY email",
            "GROUP BY upper(email)",
            "GROUP BY length(email)",
        ],
        "Both differences have to be normalised: case and spaces.",
    ),
    "c61-11": en(
        "The commission is 1.5 % of each payment, rounded to cents. Which query gives what is really charged?",
        "SUM(ROUND(importe * 0.015, 2))",
        [
            "ROUND(SUM(importe) * 0.015, 2)",
            "SUM(importe) * 0.015",
            "ROUND(AVG(importe) * 0.015, 2)",
        ],
        "If it's rounded payment by payment, you round payment by payment. Rounding the total gives a different figure when there are many payments.",
    ),
    "c61-12": en(
        "Percentage of rejections per card, including those without payments. What avoids division by zero?",
        "NULLIF(COUNT(p.id), 0) in the divisor.",
        [
            "COALESCE in the numerator.",
            "A WHERE COUNT(*) > 0.",
            "Nothing: PostgreSQL returns 0.",
        ],
        "NULLIF turns the 0 into NULL and the division gives NULL instead of an error.",
    ),
    # ------------------------------------------------------- 62 · Test data and zero-row queries
    # 62.1 · Test data (mission 2)
    "c62-01": en(
        "What does `generate_series(9001, 9100)` do?",
        "It returns one row for each number from 9001 to 9100.",
        [
            "It creates a sequence for the id.",
            "It inserts a hundred rows into the table.",
            "It returns a single row with the range.",
        ],
        "With INSERT … SELECT … FROM generate_series you create a hundred rows at once.",
    ),
    "c62-02": en(
        "Why does test data use ids from 9000 and `@kobalto.test` emails?",
        "To recognise it and delete it without touching other people's data.",
        [
            "Because low ids are forbidden.",
            "So it runs faster.",
            "Because the app doesn't accept other domains.",
        ],
        "Identifiable data: it can be found, cleaned up and not confused with real data.",
    ),
    "c62-03": en(
        'A rule says "more than €3000 needs review". Which amounts does QA create?',
        "2999.99, 3000.00 and 3000.01.",
        [
            "3000.00.",
            "1000, 5000 and 10000.",
            "A random amount from each thousand.",
        ],
        "Just below, at the limit and just above: that's where a `>` is mistaken for a `>=`.",
    ),
    "c62-04": en(
        "To clean up the test data, in which order do you delete?",
        "First the children (transfers, incidents), then accounts and finally customers.",
        [
            "Customers first: they drag the rest along.",
            "The order doesn't matter.",
            "With TRUNCATE on every table.",
        ],
        "Foreign keys prevent deleting a parent that still has children. And TRUNCATE would also take everyone else's data.",
    ),
    "c62-05": en(
        "For a test environment, `clientes_anonimos` is created from production. Which columns are changed?",
        "The ones that identify the person, like name and email, with made-up values.",
        [
            "None: it's an internal environment.",
            "Only the id.",
            "All of them, including city and segment.",
        ],
        "You remove what identifies and keep what's needed for testing (city, segment).",
    ),
    "c62-06": en(
        "The test accounts are created like this. What advantage does it have over writing 100 VALUES?",
        "Each account comes from its customer: there's no need to repeat ids and none can be left without a customer.",
        [
            "None: it's the same.",
            "It skips the table's rules.",
            "They don't need deleting afterwards.",
        ],
        "INSERT … SELECT builds data from other data; the SELECT can be run first to see what will go in.",
        code=_CODE["c62-06"],
    ),
    # 62.2 · Queries that must return zero (mission 3)
    "c62-07": en(
        'A check query "must return zero rows". What does it mean if it returns some?',
        "Each row is a case that breaks the rule.",
        [
            "That the query is badly written.",
            "That it has to be run again.",
            "Nothing: a few rows are normal.",
        ],
        "The rule is written in reverse: what shouldn't exist. Zero rows is the expected result.",
    ),
    "c62-08": en(
        "What does this query find?",
        "Transfers whose destination is an account that doesn't exist.",
        [
            "Transfers without a destination.",
            "Accounts without transfers.",
            "Transfers to blocked accounts.",
        ],
        "NOT EXISTS on the key: the destination points to something that isn't there.",
        code=_CODE["c62-08"],
    ),
    "c62-09": en(
        "To find duplicate payments, why `o.id < p.id`?",
        "So that each duplicate comes out once (the copy) and no payment is compared with itself.",
        [
            "So it runs faster.",
            "Because the original always has the highest id.",
            "It isn't needed: the result is the same without it.",
        ],
        "Without it, each payment matches itself and they all look duplicated.",
        code=_CODE["c62-09"],
    ),
    "c62-10": en(
        'Rubén checks "no incident is closed before it is opened" with `SELECT COUNT(*) … WHERE cerrada_en < abierta_en` and stores "OK" if it returns 0. What would improve the test?',
        "Returning the rows that break the rule, so you know which ones they are if it fails.",
        [
            "Nothing: COUNT is faster.",
            "Removing the WHERE.",
            "Using COUNT(cerrada_en).",
        ],
        "A number says something fails; the rows say what fails.",
    ),
    "c62-11": en(
        "A check query returns 200 rows and almost all of them are correct. What's wrong with it?",
        "It's noisy: the condition doesn't express the rule well and nobody will look at its results.",
        [
            "Nothing: better too many than too few.",
            "The database is wrong.",
            "It needs a LIMIT.",
        ],
        "A useful check only returns what really breaks the rule.",
    ),
    "c62-12": en(
        "Which query finds approved loans that have no instalments?",
        "WHERE p.estado = 'aprobado' AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.prestamo_id = p.id)",
        [
            "JOIN cuotas c ON c.prestamo_id = p.id WHERE c.id IS NULL",
            "WHERE p.estado = 'aprobado' AND p.id NOT IN (SELECT id FROM cuotas)",
            "GROUP BY p.id HAVING COUNT(*) = 0",
        ],
        "The plain JOIN has already removed the ones without instalments; NOT IN compares with the instalment's id, not the loan's; and COUNT(*) is never 0 in a group.",
    ),
    # ------------------------------------------------------- 63 · Reconciliations and migrations
    # 63.1 · Reconciling two sources (mission 4)
    "c63-01": en(
        "Reconciling the app's payments with the processor's settlements. What are you looking for?",
        "What's missing, what's extra, what doesn't match and what's repeated, on both sides.",
        [
            "Only that the totals match.",
            "Only the missing payments.",
            "That both tables have the same number of rows.",
        ],
        "Totals can match with errors that cancel each other out.",
    ),
    "c63-02": en(
        "The February totals of the app and the processor match. Is it reconciled?",
        "Not necessarily: a missing payment and an extra one with the same amount cancel each other out.",
        [
            "Yes.",
            "Yes, if the number of rows matches too.",
            "No: totals never match.",
        ],
        "You have to compare row by row on the key.",
    ),
    "c63-03": en(
        "To see the days that don't add up, with days that may be missing on either side, which JOIN do you use?",
        "FULL OUTER JOIN on the date.",
        [
            "JOIN on the date.",
            "LEFT JOIN from the app.",
            "CROSS JOIN.",
        ],
        "The FULL JOIN keeps the days that are only on one side; COALESCE sets them to 0.",
    ),
    "c63-04": en(
        "What does this query find?",
        "Payments settled more than once.",
        [
            "Payments that haven't been settled.",
            "Settlements without a payment.",
            "Payments with two different amounts.",
        ],
        "Group by the key and keep the ones that appear more than once.",
        code=_CODE["c63-04"],
    ),
    "c63-05": en(
        "The processor rounds and there are one-cent differences that Finance accepts. How do you compare amounts?",
        "abs(l.importe - p.importe) > 0.01 (with the agreed tolerance).",
        [
            "l.importe <> p.importe",
            "ROUND(l.importe) <> ROUND(p.importe)",
            "l.importe > p.importe",
        ],
        "The tolerance is agreed and written into the query; without it, every cent is a false alarm. Rounding to euros hides real differences.",
    ),
    "c63-06": en(
        "A refunded payment appears as settled. Which query detects it?",
        "Settlements joined to their payments where the payment's status isn't 'aceptado'.",
        [
            "Settlements without a payment.",
            "Payments without a settlement.",
            "Accepted payments with two settlements.",
        ],
        "Being on both sides isn't enough: you have to check whether it should be there.",
    ),
    # 63.2 · Validating a migration (mission 5)
    "c63-07": en(
        "Source and target have 40 customers. Is the migration complete?",
        "Not necessarily: one may be missing and another extra.",
        [
            "Yes.",
            "Yes, if the ids are consecutive.",
            "Yes, if there are no errors in the log.",
        ],
        "The keys are compared in both directions.",
    ),
    "c63-08": en(
        "What does `'x' <> NULL` give?",
        "NULL, and in a WHERE the row doesn't come out.",
        [
            "true.",
            "false, and the row doesn't come out.",
            "An error.",
        ],
        "That's why, for validating, IS DISTINCT FROM.",
    ),
    "c63-09": en(
        "Rule: \"empty segment → 'sin_segmento'\". Which expression gives the expected value?",
        "COALESCE(c.segmento, 'sin_segmento')",
        [
            "NULLIF(c.segmento, 'sin_segmento')",
            "c.segmento || 'sin_segmento'",
            "c.segmento",
        ],
        "COALESCE replaces NULL with the default value.",
    ),
    "c63-10": en(
        "The target stores `ciudad_id`. How is it validated?",
        "Resolving the id in `ciudades` (with a LEFT JOIN) and comparing the name with the source city.",
        [
            "Comparing the number with the name.",
            "Counting how many cities there are on both sides.",
            "It can't be validated.",
        ],
        "The LEFT JOIN avoids losing ids that don't exist in the cities table.",
    ),
    "c63-11": en(
        "−€245.30 migrated to cents must be…",
        "−24530.",
        [
            "24530.",
            "−245.",
            "−2453.",
        ],
        "The conversion keeps the sign and doesn't lose decimals.",
    ),
    "c63-12": en(
        "What does this query return?",
        "The source customers missing from the target. For the extra ones you need the other order.",
        [
            "The extra customers in the target.",
            "The missing and the extra ones.",
            "The matching customers.",
        ],
        "EXCEPT gives what is in the first query and not in the second.",
        code=_CODE["c63-12"],
    ),
    # ------------------------------------------------------- 64 · Reports and states
    # 64.1 · Testing a report (mission 6)
    "c64-01": en(
        "Where does a report's expected result come from?",
        "From the specification, with a query written independently.",
        [
            "From the report itself.",
            "From last month's report.",
            "From whatever Product says in the meeting.",
        ],
        "An oracle copied from the report has its same errors and the test always passes.",
    ),
    "c64-02": en(
        "The report filters `WHERE estado <> 'rechazado'` and must count only accepted payments. What does it let through?",
        "Refunded payments.",
        [
            "Nothing.",
            "Rejected ones.",
            "Those from another month.",
        ],
        "Better to say what you do want: `estado = 'aceptado'`.",
    ),
    "c64-03": en(
        "In the oracle, why `COUNT(p.id)` and not `COUNT(*)`?",
        "So a merchant without payments counts 0 and not 1.",
        [
            "Because it's faster.",
            "It doesn't matter.",
            "Because COUNT(*) doesn't work with LEFT JOIN.",
        ],
        "With a LEFT JOIN, the merchant without payments has one row with p.id NULL. COUNT(*) counts it.",
        code=_CODE["c64-03"],
    ),
    "c64-04": en(
        "In a LEFT JOIN from merchants to payments, where does `p.estado = 'aceptado'` go?",
        "In the ON.",
        [
            "In the WHERE.",
            "In the GROUP BY.",
            "It doesn't matter.",
        ],
        "In the WHERE it would remove the merchants without payments and the LEFT JOIN would behave like a JOIN.",
    ),
    "c64-05": en(
        "A merchant has two rows in `comercio_categorias` and the report joins with that table. What happens to it?",
        "Its payments come out twice and its total doubles.",
        [
            "Nothing.",
            "It disappears from the report.",
            "It appears in two categories with its total split.",
        ],
        "Before trusting a JOIN, count the rows per key in the joined table.",
    ),
    "c64-06": en(
        "Diego tested the report with three merchants with accepted payments mid-month and they added up. What hasn't he tested?",
        "Refunds, the last day of the month, merchants without payments and merchants with several categories.",
        [
            "Nothing: three cases are enough.",
            "The total.",
            "The merchants' names.",
        ],
        "One case for each class of data the report treats differently.",
    ),
    # 64.2 · States and transitions (mission 7)
    "c64-07": en(
        "Which row does `DISTINCT ON (orden_id)` return with `ORDER BY orden_id, cambiado_en DESC`?",
        "The most recent one for each order.",
        [
            "The first one for each order.",
            "A random one.",
            "All of them.",
        ],
        "The ORDER BY decides which row of each group stays.",
    ),
    "c64-08": en(
        "`LAG(estado) OVER (ORDER BY cambiado_en)` without PARTITION BY. What happens when looking for transitions?",
        "One order's last state becomes the next order's \"from\" and jumps that don't exist show up.",
        [
            "Nothing.",
            "It gives an error.",
            "Only the first row is lost.",
        ],
        "You need PARTITION BY orden_id.",
    ),
    "c64-09": en(
        "What does this query find?",
        "The history steps that aren't among the allowed transitions.",
        [
            "Orders without history.",
            "Stuck orders.",
            "Transitions nobody has used.",
        ],
        "Each row is a jump, a step back or a repeated step.",
        code=_CODE["c64-09"],
    ),
    "c64-10": en(
        'The test data is a snapshot from 2 March. What do you use as "now" in a stuck-orders test?',
        "A fixed date: TIMESTAMP '2026-03-02 12:00' (or a parameter).",
        [
            "now().",
            "CURRENT_DATE.",
            "The date of the last order.",
        ],
        "With now(), the result changes every day and the test stops being repeatable.",
    ),
    "c64-11": en(
        "An order was closed without writing to the history. Which query finds it?",
        "From `ordenes`, NOT EXISTS in `ordenes_historial`.",
        [
            "From `ordenes_historial`, with LAG.",
            "The history's last-state one.",
            "The disallowed-transitions one.",
        ],
        "Anything that starts from the history can't see what has no history.",
    ),
    "c64-12": en(
        "What does `MIN(cambiado_en) FILTER (WHERE estado = 'creada')` do?",
        "It calculates the minimum only over the rows in state creada.",
        [
            "It filters the rows of the whole query.",
            "It counts the created orders.",
            "It gives an error without GROUP BY.",
        ],
        "The FILTER only affects that aggregate; in the same query another aggregate can filter another state.",
    ),
    # ------------------------------------------------------- 65 · Rules and performance
    # 65.1 · Testing the database's rules (mission 8)
    "c65-01": en(
        "`probar(…)` returns 23514. Which rule fired?",
        "A CHECK.",
        [
            "NOT NULL.",
            "A foreign key.",
            "UNIQUE.",
        ],
        "23514 CHECK, 23502 NOT NULL, 23503 foreign key, 23505 UNIQUE.",
    ),
    "c65-02": en(
        "Rule: amount from 1,000 to 60,000, both included. Which cases are tested?",
        "999.99, 1000, 60000 and 60000.01.",
        [
            "5000.",
            "Only 1000 and 60000.",
            "0 and 100000.",
        ],
        "Just inside and just outside each boundary.",
    ),
    "c65-03": en(
        "`CHECK (plazo_meses IN (12, 24, 36, 48, 60))` and a NULL term. Does the row get in?",
        "Yes: the CHECK only rejects what is false, and NULL isn't.",
        [
            "No: it gives 23514.",
            "No: it gives 23502.",
            "It's stored as 12.",
        ],
        "What is required needs NOT NULL, and NULL is a test case in every required column.",
    ),
    "c65-04": en(
        "What does this query return if the `revisada_en` trigger is only `BEFORE INSERT`?",
        "false.",
        [
            "true.",
            "An error.",
            "NULL.",
        ],
        "The UPDATE doesn't fire the trigger, so `revisada_en` doesn't change. efecto() undoes everything after reading.",
        code=_CODE["c65-04"],
    ),
    "c65-05": en(
        "Rubén's rule tests pass the first time and fail the second with 23505. Why?",
        "They do real INSERTs and the first run left its rows.",
        [
            "The rule is wrong.",
            "PostgreSQL caches errors.",
            "Bad luck.",
        ],
        "Each test is undone: a transaction with ROLLBACK, or functions like probar and efecto.",
    ),
    "c65-06": en(
        '"A customer can only have one open application." Which cases test the rule?',
        "A second open one for the same customer (must fail), and a cancelled one for the same customer and an open one for another (must get in).",
        [
            "An open one for a new customer.",
            "Ten open ones for different customers.",
            "A cancelled one.",
        ],
        "A rule across rows is tested with two rows that clash and with the ones that must not clash.",
    ),
    # 65.2 · Performance regressions (mission 9)
    "c65-07": en(
        "To know whether a query is slower in the new version, what do you compare?",
        "The mean time per call.",
        [
            "The total time.",
            "The number of calls.",
            "The query text.",
        ],
        "The total time also goes up if the query is called more times.",
    ),
    "c65-08": en(
        "A query goes from 2 to 60 calls per request with the same mean per call. What is it?",
        "An N+1 in the code.",
        [
            "A slow query.",
            "A missing index.",
            "More load in the test.",
        ],
        "It's fixed in the code (a JOIN or an IN), not with an index.",
    ),
    "c65-09": en(
        "`llamadas` and `peticiones` are integers. What does `30750 / 1500` return?",
        "20.",
        [
            "20.5.",
            "21.",
            "An error.",
        ],
        "Between integers division truncates: `llamadas::numeric / peticiones`.",
    ),
    "c65-10": en(
        "With `ROUND(100 * t / SUM(t) OVER (), 1) … ORDER BY t DESC LIMIT 3`, over which rows is the percentage calculated?",
        "Over all of them: the window is calculated before the LIMIT.",
        [
            "Over the three that are shown.",
            "Over the first one.",
            "It depends on the ORDER BY.",
        ],
        "That's why the three percentages don't add up to 100.",
    ),
    "c65-11": en(
        "Where do you check that an index exists?",
        "In the catalog, `pg_indexes`.",
        [
            "In the query log.",
            "In the app.",
            "Running the query twice.",
        ],
        "A migration that doesn't create an index gives no error; it only makes the query slower.",
    ),
    "c65-12": en(
        "A performance test with 50 rows per table says everything takes 1 ms. What does it prove?",
        "Almost nothing: with few rows any plan is fast. You have to measure with production volume.",
        [
            "That there's no regression.",
            "That no indexes are missing.",
            "That there's no N+1.",
        ],
        "Plans change with table size.",
    ),
}
