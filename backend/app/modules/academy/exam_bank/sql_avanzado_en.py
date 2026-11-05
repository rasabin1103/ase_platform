"""Advanced SQL course final test · English version (same ids as sql_avanzado.py; correct answer first).

The SQL snippets are the same as in Spanish: tables and columns keep their
Spanish names in both languages, as in the course.
"""

from app.modules.academy.exam_bank.model import BankText, en
from app.modules.academy.exam_bank.sql_avanzado import QUESTIONS

_CODE = {question.id: question.code for question in QUESTIONS}

EN: dict[str, BankText] = {
    # ------------------------------------------------------- 51 · Hierarchies and windows
    # 51.1 · Who reports to whom (mission 0)
    "c51-01": en(
        "What does this query return?",
        "Everyone who reports to 6, at any level, with 1 for direct reports, 2 for the next level…",
        [
            "Only the people who report directly to 6.",
            "The chain of managers from 6 up to the CEO.",
            "An error: a CTE can't be used inside itself.",
        ],
        "The part above the UNION ALL is the starting point; the part below repeats, joining empleados with the rows the CTE already has, until no new rows come out.",
        code=_CODE["c51-01"],
    ),
    "c51-02": en(
        "In a recursive query, what makes it stop?",
        "A round of the recursive part returning no new rows.",
        [
            "Reaching 100 rounds.",
            "The LIMIT the top part always has.",
            "The table having no more rows to read.",
        ],
        "Each round only uses the rows from the previous round; when the recursive part returns zero rows, it ends.",
    ),
    "c51-03": en(
        "To get the chain of managers from person 28 up to the CEO, which condition goes in the recursive part?",
        "e.id = c.jefe_id (the next one is the manager of the row I already have).",
        [
            "e.jefe_id = c.id (the people who report to the row I already have).",
            "e.id = c.id",
            "e.jefe_id IS NULL",
        ],
        "Going up, you look for each row's manager; going down, for the people who have it as manager. Changing direction means changing which column is matched with which.",
        code=_CODE["c51-03"],
    ),
    "c51-04": en(
        "A recursive query on invitations never ends: customer 36 invited 39 and 39 invited 36. What fixes it reliably?",
        "Keeping the path in an array and not going on through a customer already in it (WHERE NOT e.cliente_id = ANY(path)).",
        [
            "Changing UNION ALL to UNION, even though each row carries the level.",
            "Adding ORDER BY to the recursive part.",
            "Putting LIMIT 1 in the top part.",
        ],
        "UNION only removes identical rows; if each row carries a different level, they never repeat and the cycle goes on. The path travelled is what detects the loop.",
    ),
    "c51-05": en(
        "Why does the «nivel» column of a recursive query start with a fixed value (1) in the top part and is q.nivel + 1 in the bottom part?",
        "Because each new row calculates its level from the row of the previous round it was joined with.",
        [
            "Because PostgreSQL numbers the rounds by itself.",
            "Because the bottom part can't have constants.",
            "Because nivel is a reserved word.",
        ],
        "Recursion has no counter of its own: any value you want to accumulate (level, path, total) is calculated from the previous row.",
    ),
    "c51-06": en(
        "This query gives «recursive query column 2 has type integer in non-recursive term but type numeric overall». What is going on?",
        "The column has different types in the two parts: the top one has to be cast (0::numeric) so they match.",
        [
            "The word RECURSIVE is missing.",
            "You can't add up inside a recursive query.",
            "UNION ALL has to be changed to UNION.",
        ],
        "The top part sets each column's type; if the bottom part produces another type (here numeric because of the salary), they have to be made equal with a cast.",
        code=_CODE["c51-06"],
    ),
    # 51.2 · Windows in depth (mission 1)
    "c51-07": en(
        "Why doesn't the «ultimo» column give the card's last payment, but the row's own one?",
        "Because with ORDER BY the default frame only goes up to the current row; you need ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.",
        [
            "Because LAST_VALUE doesn't allow PARTITION BY.",
            "Because a GROUP BY tarjeta_id is missing.",
            "Because you have to order with DESC.",
        ],
        "The default frame with ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW: for LAST_VALUE, the last one in the frame is the current row.",
        code=_CODE["c51-07"],
    ),
    "c51-08": en(
        "For the average of the last 7 calendar days (even if some days have no payments), which frame do you use on a table with one row per day with data?",
        "RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW, ordering by the date.",
        [
            "ROWS BETWEEN 6 PRECEDING AND CURRENT ROW",
            "ROWS BETWEEN 7 PRECEDING AND 7 FOLLOWING",
            "PARTITION BY fecha",
        ],
        "ROWS counts rows: if days are missing, 6 rows back can be 10 days. RANGE with an interval looks at the date's value.",
    ),
    "c51-09": en(
        "What does NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) return?",
        "The second highest amount of each merchant, on all its rows.",
        [
            "The amount of the table's second row.",
            "The two highest amounts of each merchant.",
            "The merchant with the second highest amount.",
        ],
        "NTH_VALUE gives the n-th value of the frame; with the whole frame, it is the same on every row of the merchant.",
    ),
    "c51-10": en(
        "What is the WINDOW clause for?",
        "To define a named window once and use it in several functions: OVER w.",
        [
            "To filter the result of the window functions.",
            "To limit the number of rows in each partition.",
            "To create a view with window functions.",
        ],
        "SELECT AVG(x) OVER w, MAX(x) OVER w … WINDOW w AS (PARTITION BY … ORDER BY …): less repetition and fewer mistakes.",
    ),
    "c51-11": en(
        "What does PERCENT_RANK() OVER (ORDER BY saldo) return?",
        "Each row's relative position between 0 (the first) and 1 (the last).",
        [
            "The percentage of the total balance each row has.",
            "The 50th percentile of the balance.",
            "The row number divided by 100.",
        ],
        "PERCENT_RANK = (rank − 1) / (rows − 1). For «the top 10 %», CUME_DIST or PERCENT_RANK ≥ 0.9.",
    ),
    "c51-12": en(
        "You want the average of each day with the previous and the next one (three rows, centred). Which frame?",
        "ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING",
        [
            "ROWS BETWEEN 2 PRECEDING AND CURRENT ROW",
            "RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW",
            "ROWS BETWEEN CURRENT ROW AND 2 FOLLOWING",
        ],
        "The frame can look ahead with FOLLOWING. On the first and the last day, the average is of two rows.",
    ),
    # ------------------------------------------------------- 52 · Streaks, percentiles and subtotals
    # 52.1 · Streaks and percentiles (mission 2)
    "c52-01": en(
        "In the «gaps and islands» technique, why does date − ROW_NUMBER() identify each streak of consecutive days?",
        "Because within a streak the date and the row number move forward together and the subtraction gives the same value; after a gap, it changes.",
        [
            "Because ROW_NUMBER restarts in each streak.",
            "Because subtracting dates always gives zero.",
            "Because it sorts the dates from highest to lowest.",
        ],
        "Days 1, 2, 3 with rows 1, 2, 3 give the same group; day 5 with row 4 gives another. Then you group by that value.",
    ),
    "c52-02": en(
        "A customer has two events on the same day and the streak comes out split. What do you change?",
        "Keep one event per day first (DISTINCT of the date) or use DENSE_RANK instead of ROW_NUMBER.",
        [
            "Change ROW_NUMBER to RANK.",
            "Order by id instead of by date.",
            "Remove the PARTITION BY.",
        ],
        "With repeated dates, ROW_NUMBER moves forward twice on the same day and the subtraction changes. With one day per row (or DENSE_RANK), it lines up again.",
    ),
    "c52-03": en(
        "What is the difference between PERCENTILE_CONT(0.5) and PERCENTILE_DISC(0.5)?",
        "CONT interpolates between the two middle values if needed; DISC always returns a value that exists in the data.",
        [
            "CONT is for numbers and DISC for text, with no other difference.",
            "DISC calculates the mean and CONT the median.",
            "None: they are synonyms.",
        ],
        "With 4 values (10, 20, 30, 40), CONT gives 25 and DISC gives 20.",
    ),
    "c52-04": en(
        "Where does the ORDER BY of a median go in PostgreSQL?",
        "PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe)",
        [
            "PERCENTILE_CONT(importe, 0.5) ORDER BY importe",
            "PERCENTILE_CONT(0.5) OVER (ORDER BY importe), always",
            "MEDIAN(importe)",
        ],
        "It is an ordered-set aggregate: the order goes in WITHIN GROUP. PostgreSQL has no MEDIAN.",
    ),
    "c52-05": en(
        "The mean of the payments is €121 and the median €38. What does that say about the data?",
        "That a few very high payments pull the mean up; the typical payment is closer to €38.",
        [
            "That there is a mistake in the calculation.",
            "That half of the payments are above €121.",
            "That there are no payments below €38.",
        ],
        "The mean is dragged by the extremes; the median isn't. That's why «the typical one» is better described by the median.",
    ),
    "c52-06": en(
        "For the time between one payment and the next of the same card, what do you use?",
        "LEAD(pagado_en) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) - pagado_en",
        [
            "MAX(pagado_en) - MIN(pagado_en) GROUP BY tarjeta_id",
            "LAG(pagado_en) OVER (ORDER BY pagado_en) - pagado_en",
            "pagado_en - ROW_NUMBER() OVER (PARTITION BY tarjeta_id)",
        ],
        "LEAD looks at the next row of the partition. Without PARTITION BY, cards would get mixed up.",
    ),
    # 52.2 · Totals and subtotals (mission 3)
    "c52-07": en(
        "Which rows does GROUP BY ROLLUP (categoria, ciudad) add to a GROUP BY categoria, ciudad?",
        "A subtotal for each category (empty city) and the grand total (both empty).",
        [
            "A subtotal per city and another per category.",
            "Only the grand total.",
            "Every possible combination, including the ones that don't exist.",
        ],
        "ROLLUP drops columns from the right: (categoria, ciudad), (categoria) and (). CUBE would do every combination.",
    ),
    "c52-08": en(
        "Some merchants have no city. In the ROLLUP, how do you tell the «unknown city» row from the subtotal row?",
        "With GROUPING(ciudad): it is 1 in the subtotal row and 0 in the row of a truly NULL city.",
        [
            "With COALESCE(ciudad, 'Total').",
            "With WHERE ciudad IS NOT NULL.",
            "You can't: both come out the same.",
        ],
        "COALESCE would also label the unknown city «Total». GROUPING says whether the column was aggregated in that row.",
    ),
    "c52-09": en(
        "What does GROUP BY GROUPING SETS ((estado, tipo), (estado), ()) do?",
        "It groups by status and type, also by status alone and also the total, in a single result.",
        [
            "It groups only by the sets that have data.",
            "The same as GROUP BY estado, tipo.",
            "It gives an error: () is not valid.",
        ],
        "GROUPING SETS says exactly which groupings you want; ROLLUP and CUBE are shortcuts for common sets.",
    ),
    "c52-10": en(
        "You add up the amount of a ROLLUP report and get twice the real total. What happened?",
        "You also added the subtotal and total rows; you have to keep only the detail rows (GROUPING(...) = 0) or only the total row.",
        [
            "ROLLUP duplicates the table's rows.",
            "A DISTINCT is missing inside the SUM.",
            "The grand total is always double.",
        ],
        "The subtotal rows already contain the detail rows. Adding up the whole ROLLUP result counts each amount several times.",
    ),
    "c52-11": en(
        "What does this query return?",
        "The two biggest transfers sent by each customer; customers without transfers don't appear.",
        [
            "The two biggest transfers of the whole bank.",
            "An error: a subquery in the FROM can't use columns of another table in the FROM.",
            "Every transfer of each customer.",
        ],
        "LATERAL lets the subquery use c.id from the table on its left: it runs once per customer.",
        code=_CODE["c52-11"],
    ),
    "c52-12": en(
        "With LATERAL, how do you also get the customers without any row in the subquery?",
        "LEFT JOIN LATERAL (…) x ON true",
        [
            "CROSS JOIN LATERAL",
            "JOIN LATERAL … ON false",
            "You can't with LATERAL.",
        ],
        "Like any LEFT JOIN: if the subquery returns nothing, the left row comes out with NULL.",
    ),
    # ------------------------------------------------------- 53 · JSON and changing data
    # 53.1 · JSON and arrays (mission 4)
    "c53-01": en(
        "datos is {\"dispositivo\": \"ios\"}. What do datos->'dispositivo' and datos->>'dispositivo' return?",
        "\"ios\" as jsonb (with quotes) and ios as text.",
        [
            "ios in both cases.",
            "\"ios\" in both cases.",
            "NULL and ios.",
        ],
        "-> returns jsonb; ->> returns text. To display or compare with text, ->>.",
    ),
    "c53-02": en(
        "This query returns €51 transfers. Why?",
        "Because ->> returns text and '51.2' > '300' is true comparing character by character; you have to cast: (datos->>'importe')::numeric > 300.",
        [
            "Because €51 is stored wrong in the JSON.",
            "Because an index on datos is missing.",
            "Because -> and ->> are the same.",
        ],
        "Everything that comes out with ->> is text. Before comparing or adding numbers, cast it.",
        code=_CODE["c53-02"],
    ),
    "c53-03": en(
        "How do you get, as text, the service inside detalle: {\"detalle\": {\"servicio\": \"core\"}}?",
        "datos->'detalle'->>'servicio' (or datos #>> '{detalle,servicio}')",
        [
            "datos->>'detalle'->>'servicio'",
            "datos.detalle.servicio",
            "datos->>'servicio'",
        ],
        "Every arrow except the last one has to return JSON to keep going down.",
    ),
    "c53-04": en(
        "What does datos ? 'version' ask?",
        "Whether the JSON has the key version at the first level, whatever its value.",
        [
            "Whether version is true.",
            "Whether version is NULL.",
            "The value of version.",
        ],
        "With {\"version\": null}, ? gives true and datos->>'version' IS NULL also gives true: they are not the same.",
    ),
    "c53-05": en(
        "Which query returns the customers that have sms in the canales array?",
        "SELECT cliente_id FROM preferencias WHERE 'sms' = ANY(canales);",
        [
            "SELECT cliente_id FROM preferencias WHERE canales = 'sms';",
            "SELECT cliente_id FROM preferencias WHERE canales LIKE '%sms%';",
            "SELECT cliente_id FROM preferencias WHERE canales ? 'sms';",
        ],
        "ANY compares with each element of the array. canales @> ARRAY['sms'] also works.",
    ),
    "c53-06": en(
        "A customer has intereses = {viajes, inversion, deporte}. How many rows does this query give them?",
        "Three, one per interest.",
        [
            "One, with the three interests.",
            "None: unnest only works in the SELECT.",
            "Nine.",
        ],
        "unnest turns the array into rows, and the comma (a CROSS JOIN LATERAL) joins them with their customer.",
        code=_CODE["c53-06"],
    ),
    # 53.2 · Changing data carefully (mission 5)
    "c53-07": en(
        "What does RETURNING id, limite_diario at the end of an UPDATE add?",
        "It returns, like a SELECT, the rows it changed with those columns already updated.",
        [
            "It undoes the change if there are no rows.",
            "It returns the rows before the change.",
            "It counts the changed rows.",
        ],
        "It works in INSERT, UPDATE and DELETE, and saves the checking query.",
    ),
    "c53-08": en(
        "The source of this UPDATE has two rows for card 7 (1,500 and 2,500). What happens?",
        "Card 7 ends up with one of the two values, either one, without any warning.",
        [
            "It ends up with 2,500, the last one.",
            "It gives a repeated key error.",
            "Both are applied and the sum remains.",
        ],
        "UPDATE … FROM trusts the source. You have to check first that it doesn't repeat keys; MERGE, on the other hand, would give an error.",
        code=_CODE["c53-08"],
    ),
    "c53-09": en(
        "This sync finishes without an error, but the names don't change. Why?",
        "Because comercios.nombre is the value that was already there; the new one is EXCLUDED.nombre.",
        [
            "Because a COMMIT is missing.",
            "Because ON CONFLICT only works for DO NOTHING.",
            "Because id is not the primary key.",
        ],
        "In DO UPDATE, EXCLUDED is the row you were trying to insert.",
        code=_CODE["c53-09"],
    ),
    "c53-10": en(
        "To delete the repeated payments and keep the one with the lowest id, which condition goes at the end?",
        "p.id > o.id",
        [
            "p.id <> o.id",
            "p.id < o.id",
            "p.id = o.id",
        ],
        "With <> both rows of each pair would be deleted. With p.id > o.id only the one with the highest id.",
        code=_CODE["c53-10"],
    ),
    "c53-11": en(
        "What does this statement do?",
        "It moves the incidents closed before 2026 to the archive: deletes them from incidencias and inserts them into incidencias_archivo, all or nothing.",
        [
            "It copies the incidents to the archive without deleting them.",
            "It deletes the incidents and leaves the archive empty.",
            "It gives an error: a WITH can't contain a DELETE.",
        ],
        "A DELETE … RETURNING inside a WITH hands the deleted rows to the outer INSERT, in a single statement.",
        code=_CODE["c53-11"],
    ),
    "c53-12": en(
        "What are the balances like after this?",
        "The savings accounts with €10 more; the current accounts, as they were.",
        [
            "Every account with €10 more.",
            "All as they were: the ROLLBACK undoes everything.",
            "The current accounts with €10 more and the savings ones as they were.",
        ],
        "ROLLBACK TO SAVEPOINT undoes only what was done since the savepoint; the COMMIT confirms what came before.",
        code=_CODE["c53-12"],
    ),
    # ------------------------------------------------------- 54 · Rules, functions and triggers
    # 54.1 · Rules in the database (mission 6)
    "c54-01": en(
        "You add a CHECK and get «check constraint … is violated by some row». What do you do?",
        "Find the rows that don't meet it, fix that data and add the rule again.",
        [
            "Add it with NOT VALID and forget about it.",
            "Drop the table and create it again with the rule.",
            "Remove the rule: if the data doesn't meet it, it's no use.",
        ],
        "NOT VALID leaves the bad data in; it only makes sense for huge tables and with the fix and VALIDATE CONSTRAINT right behind.",
    ),
    "c54-02": en(
        "CHECK (cerrada_en >= abierta_en). Can an incident with a NULL cerrada_en be stored?",
        "Yes: the CHECK only fails if the condition is false, and with NULL it is unknown.",
        [
            "No: NULL is not greater than or equal to anything.",
            "Only if abierta_en is NULL too.",
            "Only if the column has a DEFAULT.",
        ],
        "That's why CHECKs accept NULL unless the column is NOT NULL. Writing cerrada_en IS NULL OR … makes it clearer.",
    ),
    "c54-03": en(
        "You want each account to have at most one active card, but as many blocked ones as needed. What do you create?",
        "CREATE UNIQUE INDEX … ON tarjetas (cuenta_id) WHERE estado = 'activa';",
        [
            "ALTER TABLE tarjetas ADD UNIQUE (cuenta_id);",
            "ALTER TABLE tarjetas ADD UNIQUE (cuenta_id, estado);",
            "ALTER TABLE tarjetas ADD CHECK (estado = 'activa');",
        ],
        "The partial index only looks at the active ones. UNIQUE (cuenta_id, estado) would also prevent two blocked ones on the same account.",
    ),
    "c54-04": en(
        "The foreign key of cuotas.prestamo_id is ON DELETE CASCADE. What happens when a loan is deleted?",
        "Its instalments are deleted too.",
        [
            "It gives an error if it has instalments.",
            "The instalments keep a NULL prestamo_id.",
            "The loan's customer is deleted.",
        ],
        "By default (NO ACTION) it would give error 23503; SET NULL would leave the instalments orphaned.",
    ),
    "c54-05": en(
        "Where is ON DELETE CASCADE a bad idea?",
        "On cuentas.cliente_id: deleting a customer would take their accounts, cards and transfers with it.",
        [
            "On cuotas.prestamo_id.",
            "On an order's lines towards their order.",
            "Nowhere: CASCADE is always safer.",
        ],
        "CASCADE fits where the child makes no sense without the parent. The history of the money has a life of its own.",
    ),
    "c54-06": en(
        "The app gets error 23505. Which rule fired?",
        "A UNIQUE or the primary key.",
        [
            "A CHECK.",
            "A foreign key.",
            "A NOT NULL.",
        ],
        "23514 CHECK, 23505 UNIQUE, 23503 foreign key, 23502 NOT NULL.",
    ),
    # 54.2 · Functions and triggers (mission 7)
    "c54-07": en(
        "What does saldo_cliente(38) return if customer 38 has no accounts?",
        "0, thanks to the COALESCE.",
        [
            "NULL.",
            "An error: there are no rows.",
            "An empty row.",
        ],
        "SUM of no rows is NULL; COALESCE turns it into 0.",
        code=_CODE["c54-07"],
    ),
    "c54-08": en(
        "How is a function declared with RETURNS TABLE (id integer, importe numeric) used?",
        "In the FROM, like a table: SELECT * FROM pagos_de(5);",
        [
            "Only in the SELECT: SELECT pagos_de(5);",
            "With CALL pagos_de(5);",
            "With EXECUTE pagos_de(5);",
        ],
        "A function that returns rows behaves like a view with parameters.",
    ),
    "c54-09": en(
        "Since this trigger exists, no UPDATE on comercios changes anything and there is no error. Why?",
        "Because a row-level BEFORE trigger that returns NULL discards the row; it has to return NEW.",
        [
            "Because initcap doesn't exist.",
            "Because BEFORE triggers can't change NEW.",
            "Because a COMMIT is missing inside the trigger.",
        ],
        "In a BEFORE … FOR EACH ROW, what the function returns is what gets saved.",
        code=_CODE["c54-09"],
    ),
    "c54-10": en(
        "To record each balance change with the value before and after, what do you use in the trigger?",
        "OLD.saldo and NEW.saldo in an AFTER UPDATE (OF saldo) ON cuentas trigger.",
        [
            "Only NEW.saldo in a BEFORE INSERT trigger.",
            "A query on cuentas inside the trigger.",
            "OLD and NEW only exist in DELETEs.",
        ],
        "In an UPDATE there is OLD (before) and NEW (after). In INSERT only NEW; in DELETE only OLD.",
    ),
    "c54-11": en(
        "This trigger makes any change in cuentas fail with «stack depth limit exceeded». What fixes it?",
        "A BEFORE UPDATE trigger that does NEW.ultimo_cambio := now(); RETURN NEW; without any UPDATE.",
        [
            "Raising max_stack_depth.",
            "Changing it to FOR EACH STATEMENT and keeping the UPDATE.",
            "Adding a COMMIT after the UPDATE.",
        ],
        "The UPDATE inside fires the trigger again endlessly. To change the row itself, you change NEW in a BEFORE trigger.",
        code=_CODE["c54-11"],
    ),
    "c54-12": en(
        "What does RAISE EXCEPTION 'Saldo negativo en la cuenta %', NEW.id; do in a BEFORE trigger?",
        "It stops the statement with an error (P0001) and undoes all of it.",
        [
            "It writes a warning and saves the row anyway.",
            "It saves the row with a 0 balance.",
            "It deletes the account.",
        ],
        "An exception inside the trigger aborts the statement that fired it. % is replaced by the value that follows.",
    ),
    # ------------------------------------------------------- 55 · Indexes and performance
    # 55.1 · Indexes and plans (mission 8)
    "c55-01": en(
        "What does EXPLAIN ANALYZE add to EXPLAIN?",
        "It runs the query and shows the real times and rows next to the estimated ones.",
        [
            "It creates the missing indexes.",
            "It updates the table's statistics.",
            "Nothing: it's another name for EXPLAIN.",
        ],
        "Careful with an UPDATE or a DELETE: EXPLAIN ANALYZE really runs it.",
    ),
    "c55-02": en(
        "With the index (cuenta_id, fecha), which query makes the worst use of it?",
        "WHERE fecha >= '2026-02-01' (without the account).",
        [
            "WHERE cuenta_id = 5",
            "WHERE cuenta_id = 5 AND fecha >= '2026-02-01'",
            "WHERE cuenta_id = 5 ORDER BY fecha",
        ],
        "A composite index is sorted by its first column: it works for its prefix. The date alone is not a prefix.",
    ),
    "c55-03": en(
        "There's an index on fecha and this query is still a Seq Scan. How do you rewrite it?",
        "WHERE fecha >= '2026-02-01' AND fecha < '2026-03-01'",
        [
            "WHERE EXTRACT(MONTH FROM fecha)::int = 2 AND EXTRACT(YEAR FROM fecha)::int = 2026",
            "WHERE fecha::text LIKE '2026-02%'",
            "WHERE date_trunc('month', fecha) = '2026-02-01'",
        ],
        "A function on the column prevents using the index, which is sorted by the column as it is. A range can use it.",
        code=_CODE["c55-03"],
    ),
    "c55-04": en(
        "There's an index on concepto. Does WHERE LOWER(concepto) = 'recibo agua' use it?",
        "No: you need an index on the expression LOWER(concepto).",
        [
            "Yes, always.",
            "Only after an ANALYZE.",
            "Only if the table has few rows.",
        ],
        "The index stores concepto as it is. To search by LOWER(concepto), CREATE INDEX … ON movimientos (LOWER(concepto)).",
    ),
    "c55-05": en(
        "Why doesn't concepto LIKE '%agua%' use a normal index on concepto?",
        "Because it starts with %: the index is sorted from the start of the text and doesn't know where to begin.",
        [
            "Because LIKE never uses indexes.",
            "Because statistics are missing.",
            "Because agua has few letters.",
        ],
        "LIKE 'agua%' can (with text_pattern_ops or the C collation). To search in the middle of the text: trigram indexes (pg_trgm).",
    ),
    "c55-06": en(
        "Diego wants an index on every column of movimientos «just in case». What is the main cost?",
        "Every INSERT, UPDATE and DELETE has to maintain all those indexes, and they take space even if nobody uses them.",
        [
            "None: indexes only affect reads.",
            "The queries that don't use them become slower.",
            "PostgreSQL doesn't allow more than three indexes per table.",
        ],
        "Indexes are paid for when writing. They are created for real queries and checked with EXPLAIN; the unused ones are not needed (pg_stat_user_indexes).",
    ),
    # 55.2 · Performance (mission 9)
    "c55-07": en(
        "How many rows does ORDER BY id LIMIT 20 OFFSET 50000 read?",
        "About 50,020: it reads and discards the first 50,000.",
        [
            "20, if there's an index on id.",
            "50,000.",
            "The whole table, always.",
        ],
        "The index can't «jump» positions. That's why deep pages get slower and slower.",
    ),
    "c55-08": en(
        "The page the user sees ends at id 30000. How do you ask for the next one without OFFSET?",
        "WHERE id > 30000 ORDER BY id LIMIT 20",
        [
            "WHERE id = 30001 LIMIT 20",
            "ORDER BY id LIMIT 30020",
            "WHERE id < 30000 ORDER BY id DESC LIMIT 20",
        ],
        "Keyset pagination: every page costs the same and doesn't shift if new rows come in.",
    ),
    "c55-09": en(
        "This query returns 0 rows, even though there are accounts that have received no transfers. Why?",
        "Because cuenta_destino_id has some NULL, and with a NULL in the list NOT IN is never true.",
        [
            "Because a DISTINCT is missing in the subquery.",
            "Because NOT IN doesn't allow subqueries.",
            "Because the subquery has to be sorted.",
        ],
        "id NOT IN (…, NULL) is equivalent to … AND id <> NULL, which is unknown. NOT EXISTS doesn't have that problem.",
        code=_CODE["c55-09"],
    ),
    "c55-10": en(
        "Why EXISTS instead of a JOIN for «the accounts with any pending transaction»?",
        "Because it returns each account once and stops looking when it finds the first pending one.",
        [
            "Because a JOIN can't filter by status.",
            "Because EXISTS sorts the result.",
            "Because EXISTS also returns the transactions.",
        ],
        "The JOIN would repeat the account for each pending one and force you to use DISTINCT.",
    ),
    "c55-11": en(
        "You load 500 new transactions. What does the materialized view resumen_mensual show?",
        "What it had before the load, until REFRESH MATERIALIZED VIEW resumen_mensual is run.",
        [
            "The new transactions too, instantly.",
            "Nothing: it empties when the table changes.",
            "An error until it is created again.",
        ],
        "A materialized view stores the result; it doesn't find out about changes by itself.",
    ),
    "c55-12": en(
        "What does this query return?",
        "One row per account: its transaction with the highest id.",
        [
            "The transactions without repeats.",
            "The transaction with the highest id of the whole table.",
            "An error: DISTINCT ON needs GROUP BY.",
        ],
        "DISTINCT ON keeps the first row of each group according to the ORDER BY, which has to start with the same columns.",
        code=_CODE["c55-12"],
    ),
}
