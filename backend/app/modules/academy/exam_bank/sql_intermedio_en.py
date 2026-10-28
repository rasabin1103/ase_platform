"""Intermediate SQL course final test · English version (same ids as sql_intermedio.py; correct answer first).

The SQL snippets are the same as in Spanish: tables and columns keep their
Spanish names in both languages, as in the course.
"""

from app.modules.academy.exam_bank.model import BankText, en
from app.modules.academy.exam_bank.sql_intermedio import QUESTIONS

_CODE = {question.id: question.code for question in QUESTIONS}

EN: dict[str, BankText] = {
    # ------------------------------------------------------- 41 · Subqueries and CTEs
    # 41.1 · The query inside the query (mission 0)
    "c41-01": en(
        "What does this query return?",
        "The transfers whose amount is above the average of all of them, calculated by the query itself.",
        [
            "An error: AVG can't be used inside a WHERE in any way.",
            "The average of the transfers.",
            "The transfers sorted by amount.",
        ],
        "The subquery in brackets returns a value (the average) and the outer query compares each row with it.",
        code=_CODE["c41-01"],
    ),
    "c41-02": en(
        "This query gives the error «more than one row returned by a subquery used as an expression». How is it fixed?",
        "Changing = to IN, because the subquery returns a list of customers.",
        [
            "Adding LIMIT 1 to the subquery.",
            "Putting the subquery in quotes.",
            "Changing = to LIKE.",
        ],
        "With = the subquery has to return a single value. LIMIT 1 would remove the error but return an arbitrary customer.",
        code=_CODE["c41-02"],
    ),
    "c41-03": en(
        "What is a correlated subquery?",
        "A subquery that uses columns of the outer query and is evaluated for each row.",
        [
            "A subquery that always goes in the FROM.",
            "A subquery that returns several columns.",
            "A subquery that runs only once at the start.",
        ],
        "For example, the maximum of the transfers with the same status as the outer row (t2.estado = t.estado).",
    ),
    "c41-04": en(
        "A customer has two active accounts. How many times do they appear in each query?",
        "Twice in the first one and once in the second.",
        [
            "Once in both.",
            "Twice in both.",
            "Once in the first one and twice in the second.",
        ],
        "The JOIN gives one row per customer–account pair; IN (or EXISTS) only asks whether they have any.",
        code=_CODE["c41-04"],
    ),
    "c41-05": en(
        "You want the average number of transfers sent per account. Which query is correct?",
        "SELECT AVG(n) FROM (SELECT cuenta_origen_id, COUNT(*) AS n FROM transferencias GROUP BY cuenta_origen_id) AS envios;",
        [
            "SELECT AVG(COUNT(*)) FROM transferencias GROUP BY cuenta_origen_id;",
            "SELECT COUNT(*) / AVG(*) FROM transferencias;",
            "SELECT AVG(cuenta_origen_id) FROM transferencias;",
        ],
        "An aggregate of an aggregate is done in two steps: the count per account in a derived table and the average outside. AVG(COUNT(*)) gives an error.",
    ),
    "c41-06": en(
        "What does this subquery in the SELECT give a customer who has no tickets?",
        "0, and the customer still comes out.",
        [
            "NULL.",
            "The customer doesn't come out in the result.",
            "An error.",
        ],
        "COUNT(*) of zero rows is 0; a subquery in the SELECT doesn't remove rows from the outer query.",
        code=_CODE["c41-06"],
    ),
    # 41.2 · Step by step (mission 1)
    "c41-07": en(
        "What does this query do?",
        "It calculates the total balance of each customer in a step called saldos and returns the ones above 20,000.",
        [
            "It creates a table saldos in the database.",
            "It gives an error: WITH can only be used with INSERT.",
            "It returns every customer with their balance.",
        ],
        "WITH names a step that the final query uses as a table. It doesn't create anything in the database.",
        code=_CODE["c41-07"],
    ),
    "c41-08": en(
        "What is the right way to write two steps?",
        "WITH a AS (…), b AS (… FROM a …) SELECT … FROM b;",
        [
            "WITH a AS (…) WITH b AS (…) SELECT … FROM b;",
            "WITH a, b AS (…) SELECT … FROM b;",
            "WITH a AS (…); WITH b AS (…); SELECT … FROM b;",
        ],
        "A single WITH at the start and the steps separated by commas. Each step can use the previous ones.",
    ),
    "c41-09": en(
        "You run the first query and then the second one. What happens with the second?",
        "It gives an error: the WITH only existed inside the first query.",
        [
            "It returns the same balances.",
            "It returns an empty table.",
            "It works only if you haven't closed the console.",
        ],
        "The WITH ends with its query. To reuse it all the time, it is saved as a view.",
        code=_CODE["c41-09"],
    ),
    "c41-10": en(
        "One customer has two accounts (€1,000 and €3,000) and another has one (€2,000). What does the average balance per customer give, and what does AVG(saldo) over the accounts give?",
        "€3,000 per customer and €2,000 per account.",
        [
            "€2,000 in both cases.",
            "€3,000 in both cases.",
            "€2,000 per customer and €3,000 per account.",
        ],
        "Per customer: totals 4,000 and 2,000, average 3,000. Per account: (1,000 + 3,000 + 2,000) / 3. First the data has to be brought to one row per customer.",
    ),
    "c41-11": en(
        "What advantage does this query have over writing the balance calculation twice?",
        "The calculation is written only once and used in the FROM and in the average.",
        [
            "None: it does the same and is longer.",
            "It sorts the result automatically.",
            "It saves the balances for tomorrow.",
        ],
        "A WITH step can be used several times in the same query; if the definition changes, it is touched in one place.",
        code=_CODE["c41-11"],
    ),
    "c41-12": en(
        "When is a WITH better than a subquery?",
        "When there are several steps or a step is used more than once.",
        [
            "Never: WITH is always slower.",
            "Only when the subquery returns a single value.",
            "Only with tables that have a primary key.",
        ],
        "For something simple, a subquery; for several named steps, WITH, which reads from top to bottom.",
    ),
    # ------------------------------------------------------- 42 · Dates, texts and sets
    # 42.1 · Dates and texts (mission 2)
    "c42-01": en(
        "What does DATE_TRUNC('month', TIMESTAMP '2025-03-19 09:35') return?",
        "2025-03-01 00:00:00",
        [
            "3",
            "2025-03",
            "2025-03-19",
        ],
        "It cuts the date down to the first instant of the month and is still a date: it is used to group by month.",
    ),
    "c42-02": en(
        "The data goes from January 2025 to February 2026. This query gives 41 and the other months are around 20. What's going on?",
        "It counts the payments of February 2025 and of February 2026: you have to filter with a date range.",
        [
            "February had twice as many payments.",
            "EXTRACT counts each payment twice.",
            "A GROUP BY is missing.",
        ],
        "EXTRACT(MONTH) is the month without the year. For a specific month: pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'.",
        code=_CODE["c42-02"],
    ),
    "c42-03": en(
        "Which condition keeps the weekend payments?",
        "EXTRACT(ISODOW FROM pagado_en) IN (6, 7)",
        [
            "EXTRACT(DAY FROM pagado_en) IN (6, 7)",
            "EXTRACT(MONTH FROM pagado_en) IN (6, 7)",
            "pagado_en::text LIKE '%saturday%'",
        ],
        "ISODOW goes from 1 (Monday) to 7 (Sunday). DAY is the day of the month.",
    ),
    "c42-04": en(
        "This report comes out sorted «01/2025, 01/2026, 02/2025…». How is it fixed?",
        "Grouping and sorting by DATE_TRUNC('month', pagado_en) and using TO_CHAR only to display.",
        [
            "With ORDER BY 1 DESC.",
            "Changing the format to 'MM-YYYY'.",
            "Removing the GROUP BY.",
        ],
        "TO_CHAR returns text and text is sorted character by character. You sort by the date and format at the end.",
        code=_CODE["c42-04"],
    ),
    "c42-05": en(
        "The replica is a snapshot of 1 March 2026. Which condition gives the customers with at least one year with the bank?",
        "fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'",
        [
            "fecha_alta <= CURRENT_DATE - INTERVAL '1 year'",
            "fecha_alta >= DATE '2026-03-01' - INTERVAL '1 year'",
            "EXTRACT(YEAR FROM fecha_alta) = 1",
        ],
        "CURRENT_DATE changes every day and the result would stop matching the snapshot. One year with the bank: signed up on 1/3/2025 or before.",
    ),
    "c42-06": en(
        "What does this query return?",
        "The merchants whose name has spaces at the start or at the end, with the clean name next to it.",
        [
            "All the merchants with the name in capitals.",
            "The merchants without a name.",
            "An error: TRIM can't be compared.",
        ],
        "TRIM removes the spaces at the ends; if the name changes when they are removed, it had them.",
        code=_CODE["c42-06"],
    ),
    # 42.2 · Putting results together (mission 3)
    "c42-07": en(
        "What is the difference between UNION and UNION ALL?",
        "UNION removes the repeated rows; UNION ALL keeps them all.",
        [
            "None.",
            "UNION ALL sorts the result.",
            "UNION only works for numbers.",
        ],
        "UNION is «a list of distinct values»; UNION ALL, «all the rows». To add up movements, UNION ALL.",
    ),
    "c42-08": en(
        "There are two movements of €17.55 in January. What happens to this sum?",
        "One of the two is missing: UNION leaves a single row of 17.55.",
        [
            "It adds up correctly.",
            "It adds 17.55 three times.",
            "It gives an error because the tables are different.",
        ],
        "When only the amount is selected, two different movements look like the same row. With UNION ALL both come out.",
        code=_CODE["c42-08"],
    ),
    "c42-09": en(
        "What does this query return?",
        "The merchants with payments both in 2025 and in 2026.",
        [
            "The merchants with payments in 2025 or in 2026.",
            "The merchants with payments in 2025 and none in 2026.",
            "An error: INTERSECT needs a JOIN.",
        ],
        "INTERSECT returns what is in both lists.",
        code=_CODE["c42-09"],
    ),
    "c42-10": en(
        "What does this query return?",
        "The destination accounts that appear in transferencias but don't exist in cuentas.",
        [
            "The accounts that have never received a transfer.",
            "All the destination accounts.",
            "The accounts that have sent and received.",
        ],
        "A EXCEPT B: what is in the first list and not in the second. It is an integrity check.",
        code=_CODE["c42-10"],
    ),
    "c42-11": en(
        "This query gives no error. What problem does it have?",
        "In the second query the columns are in a different order: UNION pairs by position and mixes amounts with ids.",
        [
            "None: UNION pairs the columns by name.",
            "That UNION removes the repeated transfers.",
            "That an ORDER BY is missing in each query.",
        ],
        "Since both columns are numbers, PostgreSQL doesn't complain. The queries have to have the same columns in the same order.",
        code=_CODE["c42-11"],
    ),
    "c42-12": en(
        "In a query with UNION ALL, where do the column names come from and where does the ORDER BY go?",
        "The names, from the first query; the ORDER BY, only once at the end.",
        [
            "The names, from the last query; one ORDER BY in each query.",
            "The names have to be repeated with AS in all of them; ORDER BY is not allowed.",
            "The names, from the largest table; the ORDER BY, before the UNION ALL.",
        ],
        "The final ORDER BY sorts the whole result.",
    ),
    # ------------------------------------------------------- 43 · Reports and rankings
    # 43.1 · Reports in one query (mission 4)
    "c43-01": en(
        "What does this query return?",
        "One row per category with the number of accepted and rejected payments in two columns.",
        [
            "One row per category and status.",
            "The total payments of each category twice.",
            "An error: FILTER only works with WHERE.",
        ],
        "Each aggregate with FILTER only counts the rows that meet its condition: the statuses become columns.",
        code=_CODE["c43-01"],
    ),
    "c43-02": en(
        "There are 29 rejected out of 306 payments. What does this query return?",
        "9, because integer division throws away the decimals.",
        [
            "9.48",
            "9.5",
            "0.09",
        ],
        "100, COUNT(*) and the total are integers. With 100.0 * … you get 9.48 (9.5 rounded to one decimal).",
        code=_CODE["c43-02"],
    ),
    "c43-03": en(
        "What does this expression return in each category?",
        "The total number of payments of the category, because the 0 of the ELSE is counted too.",
        [
            "The number of rejected payments.",
            "Always 0.",
            "NULL.",
        ],
        "COUNT counts what is not NULL. With COUNT, the CASE goes without ELSE; or you use SUM(CASE … THEN 1 ELSE 0 END), or FILTER.",
        code=_CODE["c43-03"],
    ),
    "c43-04": en(
        "Which query gives the percentage of each status over the total, with one decimal?",
        "SELECT estado, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) FROM pagos_tarjeta GROUP BY estado;",
        [
            "SELECT estado, ROUND(COUNT(*) / 100, 1) FROM pagos_tarjeta GROUP BY estado;",
            "SELECT estado, ROUND(100 * COUNT(*), 1) FROM pagos_tarjeta GROUP BY estado;",
            "SELECT estado, AVG(estado) FROM pagos_tarjeta GROUP BY estado;",
        ],
        "Part over total, times 100.0 (a decimal before dividing), and ROUND at the end.",
    ),
    "c43-05": en(
        "A category has no payments in 2026. What does its total_2026 column give?",
        "NULL; with COALESCE(…, 0) it would give 0.",
        [
            "0",
            "The 2025 total.",
            "An error.",
        ],
        "SUM of no rows is NULL.",
        code=_CODE["c43-05"],
    ),
    "c43-06": en(
        "What does this query return?",
        "A single row with three numbers.",
        [
            "One row per segment.",
            "One row per customer.",
            "An error, because GROUP BY is missing.",
        ],
        "Without GROUP BY, the aggregates summarise the whole table in one row: the typical query of an indicators dashboard.",
        code=_CODE["c43-06"],
    ),
    # 43.2 · The ranking (mission 5)
    "c43-07": en(
        "Amounts 100, 100 and 80, from highest to lowest. What do ROW_NUMBER, RANK and DENSE_RANK give?",
        "ROW_NUMBER 1, 2, 3; RANK 1, 1, 3; DENSE_RANK 1, 1, 2.",
        [
            "All three give 1, 1, 2.",
            "ROW_NUMBER 1, 1, 3; RANK 1, 2, 3; DENSE_RANK 1, 1, 2.",
            "All three give 1, 2, 3.",
        ],
        "They only differ in ties: ROW_NUMBER breaks the tie, RANK leaves a gap and DENSE_RANK doesn't.",
    ),
    "c43-08": en(
        "Why does this query give an error?",
        "Window functions are calculated after the WHERE: you have to calculate it in a WITH and filter outside.",
        [
            "Because ROW_NUMBER needs GROUP BY.",
            "Because an alias for ROW_NUMBER is missing.",
            "Because PARTITION BY doesn't accept integer columns.",
        ],
        "Order of execution: FROM, WHERE, GROUP BY, HAVING, windows, ORDER BY. In the WHERE the window doesn't exist yet.",
        code=_CODE["c43-08"],
    ),
    "c43-09": en(
        "What does PARTITION BY ciudad do in this window?",
        "It restarts the numbering in each city.",
        [
            "It filters the merchants of one city.",
            "It sorts the result by city.",
            "It merges all the merchants of a city into one row.",
        ],
        "It's like a GROUP BY that doesn't merge the rows: a ranking per city.",
        code=_CODE["c43-09"],
    ),
    "c43-10": en(
        "Six customers tie with the highest number of payments and you reward the ones with ROW_NUMBER() <= 3. What happens?",
        "Only three of the six come out, picked without a criterion; with RANK or DENSE_RANK all six come out.",
        [
            "All six come out.",
            "None comes out.",
            "It gives an error because of the ties.",
        ],
        "ROW_NUMBER breaks ties at random. In a top N you have to decide what to do with ties.",
    ),
    "c43-11": en(
        "Which query gives the last payment of each card, with its id and amount?",
        "Number with ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) in a WITH and keep number 1.",
        [
            "SELECT tarjeta_id, MAX(pagado_en) FROM pagos_tarjeta GROUP BY tarjeta_id;",
            "SELECT * FROM pagos_tarjeta ORDER BY pagado_en DESC LIMIT 1;",
            "SELECT DISTINCT tarjeta_id, id, importe FROM pagos_tarjeta;",
        ],
        "MAX gives the date, not the whole row; LIMIT 1 gives a single payment in total.",
    ),
    "c43-12": en(
        "39 customers split with NTILE(4) OVER (ORDER BY saldo_total DESC). How many are there in each group?",
        "10, 10, 10 and 9.",
        [
            "9, 10, 10 and 10.",
            "13, 13, 13 and 0.",
            "It depends on each one's balance.",
        ],
        "NTILE splits in order into groups as equal as possible; the first ones take the leftover rows.",
    ),
    # ------------------------------------------------------- 44 · Trends and joins
    # 44.1 · Trends (mission 6)
    "c44-01": en(
        "What does the acumulado column return?",
        "The total of that month plus that of all the previous months.",
        [
            "The grand total repeated in every row.",
            "The total of the previous month.",
            "The average of the months.",
        ],
        "With ORDER BY inside the OVER, the window goes from the start to the current row.",
        code=_CODE["c44-01"],
    ),
    "c44-02": en(
        "In this query the running total comes out the same in every row. What is missing?",
        "An ORDER BY inside the OVER.",
        [
            "An ORDER BY at the end of the query.",
            "A GROUP BY mes.",
            "A PARTITION BY total.",
        ],
        "OVER () is the whole table: each row sees the total. Useful for percentages, not for running totals.",
        code=_CODE["c44-02"],
    ),
    "c44-03": en(
        "What does LAG(total) OVER (ORDER BY mes) return in the first row?",
        "NULL, because there is no previous row.",
        [
            "0.",
            "The total of the last row.",
            "The total of the row itself.",
        ],
        "LAG brings the value of the previous row according to the ORDER BY of the OVER.",
    ),
    "c44-04": en(
        "A category had no payments in June. What does this change compare July with?",
        "With May: LAG takes the previous row, and there is no June row.",
        [
            "With June, at 0.",
            "With July of the previous year.",
            "It gives NULL in July.",
        ],
        "LAG knows nothing about calendars. You have to check the previous period or fill in the months with generate_series.",
        code=_CODE["c44-04"],
    ),
    "c44-05": en(
        "Which window gives the 3-month moving average (the month and the two before it)?",
        "AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)",
        [
            "AVG(total) OVER (ORDER BY mes)",
            "AVG(total) OVER (PARTITION BY mes)",
            "AVG(LAG(total, 3)) OVER ()",
        ],
        "The ROWS BETWEEN frame says which rows go into the window. Without a frame, with ORDER BY, it would be the cumulative average.",
    ),
    "c44-06": en(
        "What makes this running total start again in January of each year?",
        "The PARTITION BY year inside the OVER.",
        [
            "The ORDER BY mes.",
            "The DATE_TRUNC, which always restarts in January.",
            "Nothing: the running total doesn't restart.",
        ],
        "Each year is its own window; within it, the ORDER BY accumulates.",
        code=_CODE["c44-06"],
    ),
    # 44.2 · Tricky joins (mission 7)
    "c44-07": en(
        "This query returns 0 rows. Why?",
        "It asks for the same account to be both the origin and the destination; you have to join cuentas twice, with two aliases.",
        [
            "Because there are no transfers between customers.",
            "Because a LEFT JOIN is missing.",
            "Because AND can't be used in an ON.",
        ],
        "One alias per role: JOIN cuentas ao ON ao.id = t.cuenta_origen_id and LEFT JOIN cuentas ad ON ad.id = t.cuenta_destino_id.",
        code=_CODE["c44-07"],
    ),
    "c44-08": en(
        "Why is the destination of a transfer joined with LEFT JOIN?",
        "Because it can go to another bank (empty destination) and the transfer has to come out anyway.",
        [
            "Because LEFT JOIN is faster.",
            "Because LEFT JOIN is always used with the second table.",
            "So that no repeated transfers come out.",
        ],
        "With a normal JOIN the transfers with an empty cuenta_destino_id would disappear.",
    ),
    "c44-09": en(
        "What does a FULL OUTER JOIN between the January and February counts per merchant keep?",
        "The merchants of both months, also the ones that only appear in one of them.",
        [
            "Only the merchants with payments in both months.",
            "Only the January ones.",
            "Every combination of January merchants with February merchants.",
        ],
        "The unmatched rows come out with NULL on the other side: COALESCE for the key and for the zeros.",
    ),
    "c44-10": en(
        "A CROSS JOIN between 2 card types and 8 categories gives…",
        "16 rows: every combination.",
        [
            "10 rows.",
            "8 rows.",
            "An error: the ON is missing.",
        ],
        "CROSS JOIN has no ON. It is used to build every combination and then join the data with LEFT JOIN.",
    ),
    "c44-11": en(
        "With this calendar 11 months come out instead of 14. Why?",
        "The right-hand table's filter is in the WHERE and removes the months without payments; it has to go in the ON.",
        [
            "Because generate_series skips the months without data.",
            "Because a COALESCE is missing.",
            "Because you have to use FULL OUTER JOIN.",
        ],
        "In the empty months c.categoria is NULL and doesn't meet the WHERE: the LEFT JOIN turns into a normal JOIN.",
        code=_CODE["c44-11"],
    ),
    "c44-12": en(
        "What does generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2025-03-01', INTERVAL '1 month') return?",
        "Three rows: 1 January, 1 February and 1 March 2025.",
        [
            "One row with an interval of two months.",
            "Two rows: January and February.",
            "The payments of those months.",
        ],
        "It includes the start and the end. It is used as a calendar so periods without data appear.",
    ),
    # ------------------------------------------------------- 45 · Data quality and views
    # 45.1 · Data that doesn't add up (mission 8)
    "c45-01": en(
        "You write the rule «a blocked card can't have accepted payments» as a query. If the rule holds, what does it return?",
        "Zero rows.",
        [
            "Every payment.",
            "One row with the value 1.",
            "An error.",
        ],
        "The query looks for the violations: each row it returns is a case that has to be reviewed.",
    ),
    "c45-02": en(
        "What does this query return?",
        "The leftover copies of each group of identical payments, without the one with the lowest id.",
        [
            "All the duplicate payments, the originals too.",
            "One payment from each group of duplicates.",
            "The payments that have no duplicates.",
        ],
        "ROW_NUMBER numbers each group of identical rows; n > 1 are the copies. If they are deleted, each group keeps one row.",
        code=_CODE["c45-02"],
    ),
    "c45-03": en(
        "There are 3 groups of duplicate payments, with two rows each. What does this DELETE do?",
        "It deletes 6 payments: the copies and the originals too.",
        [
            "It deletes the 3 copies and keeps the originals.",
            "It deletes nothing.",
            "It deletes every payment in the table.",
        ],
        "The subquery returns every row of each repeated group. You have to delete only the ones with ROW_NUMBER > 1 and rehearse it first as a SELECT.",
        code=_CODE["c45-03"],
    ),
    "c45-04": en(
        "What does this query return?",
        "The highest payment of each merchant.",
        [
            "The lowest payment of each merchant.",
            "All the payments sorted by merchant.",
            "The distinct merchants.",
        ],
        "DISTINCT ON leaves one row per merchant: the first according to the ORDER BY, which starts with the columns of the DISTINCT ON.",
        code=_CODE["c45-04"],
    ),
    "c45-05": en(
        "Why doesn't SELECT DISTINCT * remove the duplicate payments from pagos_tarjeta?",
        "Because each copy has a different id, so the rows are not identical.",
        [
            "Because DISTINCT doesn't work with dates.",
            "Because there are NULL values in the table.",
            "It does remove them.",
        ],
        "You have to decide which columns define «the same» (here, all except the id).",
    ),
    "c45-06": en(
        "A report overcounts because of the duplicate payments and they «fix» it with a DISTINCT. What problem remains?",
        "The data is still wrong: the other reports count the copies and nobody knows they exist; it has to be reported and fixed at the source.",
        [
            "None, the number is already right.",
            "That DISTINCT is slow.",
            "That the report loses columns.",
        ],
        "A QA doesn't hide dirty data in their query: they report it with the query that proves it and leave a rule that warns if it comes back.",
    ),
    # 45.2 · Your reusable report (mission 9)
    "c45-07": en(
        "What does a view store?",
        "The query, which runs with the data of the moment every time the view is used.",
        [
            "A copy of the data from when it was created.",
            "An index of the table.",
            "Nothing: it disappears when the query ends.",
        ],
        "That's why a view is always up to date, unlike a table created with CREATE TABLE … AS SELECT.",
    ),
    "c45-08": en(
        "You create this table on Monday and on Tuesday several balances change. What does the table have on Wednesday?",
        "Monday's balances: it's a snapshot that doesn't update.",
        [
            "The updated balances.",
            "Nothing: it empties when the data changes.",
            "An error when you query it.",
        ],
        "To have up-to-date data, a view. If speed is needed, a materialized view with REFRESH, which makes it clear that it's a snapshot.",
        code=_CODE["c45-08"],
    ),
    "c45-09": en(
        "What is the second column of this view called?",
        "sum, because it has no alias; you have to write SUM(saldo) AS saldo_total.",
        [
            "saldo",
            "saldo_total",
            "The view gives an error when it is created.",
        ],
        "The column names of a view come from the query: everything calculated needs an alias.",
        code=_CODE["c45-09"],
    ),
    "c45-10": en(
        "DROP VIEW saldos_cliente gives an error because kpi_clientes depends on it. What do you do?",
        "Check which views depend on it before deciding; DROP … CASCADE would drop them too.",
        [
            "DROP VIEW saldos_cliente CASCADE straight away, because it only drops that view.",
            "Drop the cuentas table.",
            "Nothing: it's a PostgreSQL bug.",
        ],
        "Views can be built on top of each other; CASCADE takes all the dependent ones with it.",
    ),
    "c45-11": en(
        "What does EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7 do?",
        "It shows the execution plan, with the tables underneath the view, without running the query.",
        [
            "It runs the query and shows the real time.",
            "It explains in words what each column means.",
            "It creates an index on the view.",
        ],
        "The view is replaced by its query: clientes and cuentas appear in the plan.",
    ),
    "c45-12": en(
        "You want to measure how long a DELETE takes without deleting anything. What do you run?",
        "BEGIN; EXPLAIN ANALYZE DELETE …; ROLLBACK;",
        [
            "EXPLAIN ANALYZE DELETE …;",
            "EXPLAIN DELETE …; COMMIT;",
            "A DELETE can't be measured.",
        ],
        "EXPLAIN ANALYZE actually runs it to measure: with a DELETE, it deletes. The ROLLBACK undoes it.",
    ),
}
