import { m07Funciones } from '../m07-funciones'
import { COMMON_EN, missionEn } from './missionEn'

const FUNCTION = { 0: { message: 'This task is done by creating a function: `CREATE FUNCTION name(…) RETURNS … AS $$ … $$`.' } }
const TRIGGER = { 0: { message: 'This task is done with a trigger: `CREATE TRIGGER … EXECUTE FUNCTION …`.' } }

/** Course 7: Advanced SQL · Mission 7 — Functions and triggers. English version of ../m07-funciones.ts. */
export const m07FuncionesEn = missionEn(m07Funciones, {
  ...COMMON_EN,
  title: 'Functions and triggers',
  subtitle: 'Functions in SQL and PL/pgSQL, RETURNS TABLE and BEFORE and AFTER triggers.',
  dayLabel: 'Wednesday · month 4',
  verdicts: {
    good: {
      title: 'Logic where the data lives',
      body: "A customer's balance in one call, a card's payments as a table, the risk level calculated the same for everyone, every balance change audited, savings without negatives and the merchants' change date set by itself. And no trigger that swallows rows or calls itself.",
    },
    ok: { title: 'Functions, halfway there', body: 'You already write functions and triggers, but a task or a trap fell by the wayside. Check the debrief.' },
    bad: { title: 'Logic repeated everywhere', body: 'Several tasks were left undone. Replay the mission with the functions and triggers cheat sheet at hand.' },
  },
  briefing: {
    title: 'Month 4 · Functions and triggers',
    paragraphs: [
      "Wednesday. Some calculations each team does its own way, and some things should happen **every time** a value changes. Today you put them in the database: functions that can be called from any query and triggers that fire by themselves.",
      "We're still on the **test copy**. Inés checks each task by calling your functions or changing data inside a test that she then undoes.",
    ],
    goals: [
      'Write a function in SQL that returns a value.',
      'Write a function that returns a table (RETURNS TABLE).',
      'Write a function in PL/pgSQL with variables and IF.',
      'Audit changes with an AFTER trigger.',
      'Validate or complete the row with a BEFORE trigger.',
      'Avoid the two classic mistakes: RETURN NULL and the trigger that calls itself.',
    ],
  },
  docs: {
    chuleta_funciones: {
      title: 'Cheat sheet: functions and triggers',
      updatedLabel: 'Inés Moreno · Data',
      body: `## Functions
\`\`\`
-- In SQL: the result of the last query
CREATE FUNCTION name(p_x integer) RETURNS numeric
LANGUAGE sql AS $$ SELECT … WHERE col = p_x $$;

-- Returning rows
CREATE FUNCTION name(p_x integer)
RETURNS TABLE (id integer, importe numeric) LANGUAGE sql AS $$ SELECT … $$;

-- In PL/pgSQL: variables, IF, RETURN
CREATE FUNCTION name(p_x integer) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v numeric;
BEGIN
  v := …;
  IF v < 10 THEN RETURN 'a'; ELSIF … THEN … ELSE RETURN 'c'; END IF;
END $$;
\`\`\`
To change it: \`CREATE OR REPLACE FUNCTION\` (same parameters and result type).

## Triggers
\`\`\`
CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  … OLD.col (before) … NEW.col (after) …
  RETURN NEW;
END $$;

CREATE TRIGGER t BEFORE|AFTER INSERT OR UPDATE [OF col] ON table
FOR EACH ROW EXECUTE FUNCTION f();
\`\`\`
| | BEFORE | AFTER |
|---|---|---|
| Can change NEW | yes | no |
| Can stop the row | yes (\`RAISE EXCEPTION\`) | yes (\`RAISE EXCEPTION\`) |
| For | validating, completing | auditing, notifying |

To stop with an error: \`RAISE EXCEPTION 'message %', value;\` (code P0001).`,
    },
  },
  sqlLab: {
    starter: '-- Test environment: the calculation every team repeats today\nSELECT cliente_id, SUM(saldo) AS saldo_total\nFROM cuentas\nGROUP BY cliente_id\nORDER BY cliente_id;',
    retos: {
      saldo_cliente: {
        title: 'saldo_cliente(customer)',
        description: "Create the function **`saldo_cliente(p_cliente integer)`** that returns the **sum of the balance** of the customer's accounts, and **0** if they have no accounts.",
        hint: '`CREATE FUNCTION saldo_cliente(p_cliente integer) RETURNS numeric LANGUAGE sql AS $$ SELECT COALESCE(SUM(saldo), 0) FROM cuentas WHERE cliente_id = p_cliente $$;`',
        requires: FUNCTION,
      },
      pagos_de: {
        title: 'pagos_de(card), as a table',
        description: "Create **`pagos_de(p_tarjeta integer)`**, which returns that card's payments as a table with the columns **`id`**, **`importe`** and **`pagado_en`**, so you can run `SELECT … FROM pagos_de(5)`.",
        hint: '`CREATE FUNCTION pagos_de(p_tarjeta integer) RETURNS TABLE (id integer, importe numeric, pagado_en timestamp) LANGUAGE sql AS $$ SELECT p.id, p.importe, p.pagado_en FROM pagos_tarjeta p WHERE p.tarjeta_id = p_tarjeta $$;`',
        requires: { ...FUNCTION, 1: { message: 'Make it return rows: `RETURNS TABLE (id integer, importe numeric, pagado_en timestamp)`.' } },
      },
      nivel_riesgo: {
        title: 'nivel_riesgo(customer)',
        description: "Create **`nivel_riesgo(p_cliente integer)`** in **PL/pgSQL** that returns `'alto'` (high) if the customer's total balance is **under €1,000**, `'medio'` (medium) if it is **under €10,000** and `'bajo'` (low) otherwise. You can use `saldo_cliente`.",
        hint: "`DECLARE s numeric; BEGIN s := saldo_cliente(p_cliente); IF s < 1000 THEN RETURN 'alto'; ELSIF s < 10000 THEN RETURN 'medio'; ELSE RETURN 'bajo'; END IF; END`",
        requires: { ...FUNCTION, 1: { message: 'Write it in PL/pgSQL: `LANGUAGE plpgsql`.' } },
      },
      auditoria: {
        title: 'Every balance change, recorded',
        description: 'Create the table **`auditoria_saldos`** (`id serial`, `cuenta_id`, `saldo_anterior`, `saldo_nuevo`, `cambiado_en timestamp DEFAULT now()`) and a **trigger** that records a row every time the **balance** of an account **changes**. A change in other columns is not recorded.',
        hint: '`CREATE FUNCTION auditar_saldo() RETURNS trigger … INSERT INTO auditoria_saldos (cuenta_id, saldo_anterior, saldo_nuevo) VALUES (OLD.id, OLD.saldo, NEW.saldo); RETURN NEW; …` and `CREATE TRIGGER … AFTER UPDATE OF saldo ON cuentas FOR EACH ROW EXECUTE FUNCTION auditar_saldo();`',
        requires: TRIGGER,
      },
      ahorro_positivo: {
        title: 'No savings account in the red',
        description: 'Create a **BEFORE trigger** on `cuentas` that, when **inserting or changing** a **savings** account (`ahorro`) with a **negative** balance, stops with an error (`RAISE EXCEPTION`). Current accounts (`corriente`) can go negative.',
        hint: "`IF NEW.tipo = 'ahorro' AND NEW.saldo < 0 THEN RAISE EXCEPTION 'Negative balance in savings account %', NEW.id; END IF; RETURN NEW;` and `CREATE TRIGGER … BEFORE INSERT OR UPDATE ON cuentas FOR EACH ROW …`",
        requires: TRIGGER,
      },
      actualizado_en: {
        title: "The merchants' change date, by itself",
        description: 'Add the column **`actualizado_en`** (timestamp) to `comercios` and a **trigger** that sets it to the current time **every time a merchant is changed**, without anyone having to write it.',
        hint: '`ALTER TABLE comercios ADD COLUMN actualizado_en timestamp;` and a **BEFORE UPDATE** trigger whose function does `NEW.actualizado_en := now(); RETURN NEW;`',
        requires: TRIGGER,
      },
    },
  },
  bugs: {
    'C-MARTA': { title: "Marta's report copies and pastes the payments query in ten places", explanation: 'Without a function, each report repeats (and changes) the query.', technique: 'RETURNS TABLE and SELECT … FROM pagos_de(…).' },
    'C-CARMEN': { title: 'Risk and the app give the same customer different risk levels', explanation: 'Each one calculated the level with its own limits.', technique: 'A PL/pgSQL function everyone uses.' },
    'C-NURIA': { title: 'A customer disputes a balance change and nobody knows when it happened', explanation: 'Balance changes left no trace.', technique: 'AFTER UPDATE OF saldo trigger that records OLD and NEW.' },
    'C-DIEGO': { title: 'A script leaves a savings account in the red', explanation: 'The rule was only in the app.', technique: 'BEFORE trigger with RAISE EXCEPTION.' },
    'C-LAURA': { title: "The regression tests don't know which merchants changed", explanation: 'Nobody filled in the change date.', technique: 'BEFORE UPDATE trigger with NEW.actualizado_en := now().' },
    'C-RETURN': { title: 'Merchant changes disappear without an error', explanation: 'A BEFORE trigger that returns NULL discards the row.', technique: 'RETURN NEW in row-level BEFORE triggers.' },
    'C-BUCLE': { title: 'Any change in cuentas gives "stack depth limit exceeded"', explanation: 'An AFTER UPDATE trigger runs an UPDATE on its own table and calls itself.', technique: 'Change NEW in a BEFORE trigger, or limit it with WHEN.' },
  },
  prevention: {
    title: 'At the end of the day',
    intro: "What happened with Wednesday's functions and triggers.",
    preventedLabel: "Problems that didn't happen",
    appearedLabel: 'Problems that showed up',
    rules: {
      0: { label: "Marta's reports", explanation: 'One function instead of ten copies.' },
      1: { label: "Carmen's risk", explanation: 'A single calculation for everyone.' },
      2: { label: "Nuria's disputes", explanation: 'Every balance change, recorded.' },
      3: { label: "Diego's accounts", explanation: 'Savings without negatives.' },
      4: { label: "Laura's regression", explanation: 'Automatic change date.' },
      5: { label: 'RETURN NEW', explanation: 'Rows are not lost.' },
      6: { label: 'No loops', explanation: 'No trigger calls itself.' },
    },
  },
  concepts: {
    sql_function: { title: 'Functions in SQL', summary: 'CREATE FUNCTION … LANGUAGE sql: returns the result of the last query; it is called like any function.' },
    returns_table: { title: 'RETURNS TABLE', summary: 'A function that returns rows and is used in the FROM like a table.' },
    plpgsql: { title: 'PL/pgSQL', summary: 'Variables (DECLARE), assignments (:=), IF/ELSIF/ELSE and RETURN.' },
    trigger_after: { title: 'AFTER triggers', summary: 'They fire after the change; with OLD and NEW you audit what changed.' },
    trigger_before: { title: 'BEFORE triggers', summary: 'They fire before saving: they can change NEW or stop with RAISE EXCEPTION.' },
    trigger_return: { title: 'What a trigger returns', summary: 'A row-level BEFORE returns NEW to save it; NULL discards it without an error.' },
    trigger_loop: { title: 'Triggers that call themselves', summary: 'An UPDATE on the same table inside the trigger fires it again.' },
  },
  seniorTips: [
    'Read the functions and triggers cheat sheet in the wiki.',
    'Inés: RETURNS numeric LANGUAGE sql AS $$ SELECT COALESCE(SUM(saldo), 0) FROM cuentas WHERE cliente_id = p_cliente $$.',
    'Marta: RETURNS TABLE (id integer, importe numeric, pagado_en timestamp) and a SELECT with the alias p. so the names don\'t clash.',
    "Carmen: LANGUAGE plpgsql, DECLARE s numeric; s := saldo_cliente(p_cliente); IF … ELSIF … ELSE … END IF.",
    'Nuria: CREATE TABLE auditoria_saldos (…), a function that inserts OLD.id, OLD.saldo, NEW.saldo and CREATE TRIGGER … AFTER UPDATE OF saldo ON cuentas.',
    "Diego: BEFORE INSERT OR UPDATE ON cuentas; IF NEW.tipo = 'ahorro' AND NEW.saldo < 0 THEN RAISE EXCEPTION …; RETURN NEW.",
    'Laura: ADD COLUMN actualizado_en timestamp and BEFORE UPDATE with NEW.actualizado_en := now(); RETURN NEW.',
    'With Inés: RETURN NEW in BEFORE triggers, and never an UPDATE of the same table inside its trigger.',
  ],
  lessons: {
    sql_function: {
      question: 'How do I write a function in SQL?',
      body: `\`\`\`
CREATE FUNCTION saldo_cliente(p_cliente integer) RETURNS numeric
LANGUAGE sql AS $$
  SELECT COALESCE(SUM(saldo), 0) FROM cuentas WHERE cliente_id = p_cliente
$$;

SELECT id, nombre, saldo_cliente(id) FROM clientes;
\`\`\`

The body goes between \`$$\` (so you don't have to escape quotes). It returns the result of the last query. The \`p_\` prefix avoids mixing up the parameter with a column. To change it, \`CREATE OR REPLACE FUNCTION\`.`,
    },
    returns_table: {
      question: 'How do I make a function that returns rows?',
      body: `With \`RETURNS TABLE\`, and it is used in the \`FROM\`:

\`\`\`
CREATE FUNCTION pagos_de(p_tarjeta integer)
RETURNS TABLE (id integer, importe numeric, pagado_en timestamp)
LANGUAGE sql AS $$
  SELECT p.id, p.importe, p.pagado_en FROM pagos_tarjeta p WHERE p.tarjeta_id = p_tarjeta
$$;

SELECT COUNT(*), SUM(importe) FROM pagos_de(5);
\`\`\`

It's like a view with parameters. The columns of \`RETURNS TABLE\` have the same names as the table's: use an alias (\`p.id\`) so there is no ambiguity.`,
    },
    plpgsql: {
      question: 'What does PL/pgSQL add?',
      body: `Variables, conditions and loops:

\`\`\`
CREATE FUNCTION nivel_riesgo(p_cliente integer) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE s numeric;
BEGIN
  s := saldo_cliente(p_cliente);
  IF s < 1000 THEN RETURN 'alto';
  ELSIF s < 10000 THEN RETURN 'medio';
  ELSE RETURN 'bajo';
  END IF;
END $$;
\`\`\`

If it fits in a query (here, a \`CASE\`), \`LANGUAGE sql\` is simpler. PL/pgSQL pays off when there are steps, variables or errors to raise.`,
    },
    trigger_after: {
      question: 'How do I record every balance change?',
      body: `A function that returns \`trigger\` and a trigger that calls it:

\`\`\`
CREATE FUNCTION auditar_saldo() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO auditoria_saldos (cuenta_id, saldo_anterior, saldo_nuevo)
  VALUES (OLD.id, OLD.saldo, NEW.saldo);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_auditar_saldo AFTER UPDATE OF saldo ON cuentas
FOR EACH ROW EXECUTE FUNCTION auditar_saldo();
\`\`\`

\`OLD\` is the row before and \`NEW\` after. \`UPDATE OF saldo\` makes it fire only if the statement changes that column. To fire only if the value really changes: \`WHEN (OLD.saldo IS DISTINCT FROM NEW.saldo)\`.`,
    },
    trigger_before: {
      question: 'What is a BEFORE trigger for?',
      body: `It fires **before** the row is saved, so it can:

- **Complete it**: \`NEW.actualizado_en := now();\`
- **Stop it**: \`RAISE EXCEPTION 'Negative balance in account %', NEW.id;\` (error P0001, and the whole statement is undone).

\`\`\`
CREATE TRIGGER trg_ahorro BEFORE INSERT OR UPDATE ON cuentas
FOR EACH ROW EXECUTE FUNCTION impedir_negativo();
\`\`\`

A simple rule on the row itself also fits in a CHECK. The trigger pays off when you have to look at other tables or give your own message.`,
    },
    trigger_return: {
      question: "What does a trigger's function have to return?",
      body: `In a **BEFORE … FOR EACH ROW** trigger, what you return is what gets saved:

| Returns | Happens |
|---|---|
| \`NEW\` | the row is saved (with your changes) |
| \`NULL\` | the row is **not saved**, without an error ("UPDATE 0") |
| nothing | error: "control reached end of trigger procedure without RETURN" |

In an AFTER trigger the value is ignored, but you still have to write \`RETURN NEW\` (or \`NULL\`).`,
    },
    trigger_loop: {
      question: 'Why can a trigger call itself?',
      body: `If the function of an \`AFTER UPDATE ON cuentas\` trigger runs an \`UPDATE cuentas …\`, that UPDATE fires the trigger again, which runs the UPDATE again… until "stack depth limit exceeded".

How to avoid it:

- To change the row itself, a **BEFORE** trigger that modifies \`NEW\` (not an UPDATE).
- Limit when it fires: \`UPDATE OF column\` or \`WHEN (…)\`.
- As a last resort, \`pg_trigger_depth()\` to avoid repeating.`,
    },
  },
  quiz: {
    pre: {
      a7pre_sql: { question: 'What does a `LANGUAGE sql` function return?', options: ['Always a table', 'The result of its last query', 'Nothing', 'The number of rows'], explanation: 'Of the type RETURNS says.' },
      a7pre_table: { question: 'How is a function with `RETURNS TABLE` used?', options: ['SELECT pagos_de', 'SELECT … FROM pagos_de(5)', 'CALL pagos_de(5)', 'EXECUTE pagos_de'], explanation: 'In the FROM, like a table.' },
      a7pre_plpgsql: { question: 'In PL/pgSQL, how do you assign a value to a variable?', options: ['s = 5', 's := 5', 'SET s 5', 'LET s = 5'], explanation: ':= (= also works in recent versions, but := is the usual one).' },
      a7pre_oldnew: { question: 'In an UPDATE trigger, what are OLD and NEW?', options: ['Two tables', 'The row before and after the change', 'Two functions', 'The first and the last trigger'], explanation: 'In INSERT there is only NEW; in DELETE, only OLD.' },
      a7pre_before: { question: "What can a BEFORE trigger do that an AFTER one can't?", options: ['Read OLD', 'Change NEW before saving it', 'Raise errors', 'Nothing'], explanation: 'What a BEFORE returns is what gets saved.' },
      a7pre_raise: { question: 'What does `RAISE EXCEPTION` do inside a trigger?', options: ['Writes a warning and carries on', 'Stops the statement with an error and undoes it', 'Deletes the row', 'Restarts the trigger'], explanation: 'Code P0001.' },
    },
    post: {
      a7post_null: { question: 'A BEFORE UPDATE trigger returns NULL. What happens to the UPDATE?', options: ["It's saved", "The row doesn't change, without an error", 'Error', 'The row is deleted'], explanation: '"UPDATE 0" and nobody notices.' },
      a7post_noreturn: { question: "The trigger's function ends without RETURN. What happens?", options: ['It returns NEW', 'Error when the trigger fires', 'It returns NULL', 'Nothing'], explanation: '"control reached end of trigger procedure without RETURN".' },
      a7post_loop: { question: 'An AFTER UPDATE ON cuentas trigger runs `UPDATE cuentas …`. What happens?', options: ['Nothing special', 'It fires again endlessly until a stack error', 'PostgreSQL detects it and ignores it', 'It only fires once'], explanation: 'To change the row itself, BEFORE and NEW.' },
      a7post_of: { question: 'What does `AFTER UPDATE OF saldo` do?', options: ['Fires with any UPDATE', 'Fires only if the statement changes the saldo column', 'Fires only if the balance goes down', 'Fires before the UPDATE'], explanation: 'For "if the value really changes", WHEN (OLD.saldo IS DISTINCT FROM NEW.saldo).' },
      a7post_table: { question: 'In `RETURNS TABLE (id …)` and the query uses `id` from pagos_tarjeta. What should you do?', options: ['Nothing', 'Alias the table (p.id) so it is not ambiguous', 'Remove the id column', 'Use SELECT *'], explanation: 'The names in RETURNS TABLE behave like variables.' },
      a7post_plpgsql: { question: 'When does PL/pgSQL pay off over LANGUAGE sql?', options: ['Always', 'When there are variables, steps or errors to raise', 'Never', 'Only in triggers'], explanation: 'If it fits in a query, SQL is simpler.' },
    },
  },
  scenes: {
    mail_ines: {
      subject: 'Logic where the data lives',
      body: "Good morning.\n\nToday we put logic **inside** the database: functions anyone can call from a query and triggers that fire by themselves when a value changes. We're still on the test copy.\n\nTo start, a function every team ends up writing by hand:\n\n- **`saldo_cliente(p_cliente integer)`**: the sum of the balance of the customer's accounts, and **0** if they have none.\n\nInés",
    },
    ines_ok: {
      body: "saldo_cliente(1) = 2,376.40 and saldo_cliente(38) = 0. Without the COALESCE, 38 would give NULL, and so would any calculation made with it.",
    },
    marta_pagos: {
      body: 'Hi! I have the "payments of a card" query copied in ten reports and each one is already a bit different. Can you make me **`pagos_de(p_tarjeta integer)`** that returns the payments as a table, with **`id`**, **`importe`** and **`pagado_en`**? Then I just run `SELECT … FROM pagos_de(5)`.',
    },
    marta_thanks: { body: 'Card 5: twelve payments and €4,288.05. Ten fewer copies. Thanks!' },
    carmen_riesgo: {
      body: "Hi. Risk and the app calculate each customer's **risk level** with different limits. I want a single formula, in the database: **`nivel_riesgo(p_cliente integer)`** in **PL/pgSQL**, `'alto'` (high) if their total balance is under €1,000, `'medio'` (medium) if it is under €10,000 and `'bajo'` (low) otherwise.",
    },
    carmen_thanks: { body: 'Three high, twenty-five medium and twelve low. And now the app and we use the same thing. Thanks.' },
    ines_return: {
      subject: '11:00 · Inés: "UPDATE 0"',
      body: '**Inés:** Rubén added a trigger so that merchants always have the city with an initial capital:\n\n`… BEGIN NEW.ciudad := initcap(NEW.ciudad); RETURN NULL; END …` with `BEFORE UPDATE ON comercios FOR EACH ROW`.\n\nSince then nobody manages to change a merchant: the console says "UPDATE 0" and gives no error at all. What is going on?',
      choices: {
        new: {
          text: "That in a row-level **BEFORE** trigger, what the function returns is what gets saved: with `RETURN NULL` the row **is discarded** without an error. It has to be `RETURN NEW`.",
          reply: "Exactly. It's one of the sneakiest bugs: there is no error, just changes that never arrive.",
          effects: { 2: { text: 'A row-level BEFORE trigger returns NEW; NULL discards the row.' } },
        },
        after: {
          text: 'That he should change it to AFTER and keep the RETURN NULL.',
          reply: "With AFTER the row is saved, but the change to NEW is useless by then: the initcap wouldn't apply. It's a BEFORE with RETURN NEW.",
          effects: { 0: { text: "Switching to AFTER doesn't fix the trigger and breaks what it was meant to do." } },
        },
        perm: {
          text: "That it's a permissions problem on the merchants table.",
          reply: 'Without permissions there would be an error. Here the row reaches the trigger and the trigger says "don\'t save it".',
          effects: { 0: { text: 'You looked for the bug outside the trigger.' } },
        },
      },
    },
    nuria_auditoria: {
      body: "Hi. When a customer disputes that their balance changed, nobody knows **when or from what to what**. Can you make the database record it? A table **`auditoria_saldos`** (`id serial`, `cuenta_id`, `saldo_anterior`, `saldo_nuevo`, `cambiado_en timestamp DEFAULT now()`) and a new row every time the **balance** of an account **changes**. If other things about the account change, it's not needed.",
    },
    nuria_thanks: { body: 'I tried changing a balance and it was recorded with the before and after. Finally! Thanks.' },
    diego_ahorro: {
      body: "Hey. The app doesn't let a **savings** account go negative, but a closing script managed it last month. I want the database to prevent it: a **BEFORE trigger** on `cuentas` that, when **creating or changing** a savings account with a negative balance, stops with an error. Current accounts can go negative.",
    },
    diego_thanks: { body: 'Savings to -5: error. Current to -5: goes through. And normal changes still work. Thanks!' },
    laura_actualizado: {
      body: "Hi. For the regression tests I need to know **which merchants have changed** and when. Can you add to `comercios` a column **`actualizado_en`** (timestamp) that sets itself to the current time every time a merchant is changed? So it doesn't depend on the app remembering.",
    },
    laura_thanks: { body: 'I change a merchant and the date appears by itself. Now I can filter the ones that changed since the last regression run. Thanks!' },
    ines_bucle: {
      subject: '15:00 · Inés: "stack depth limit exceeded"',
      body: '**Inés:** Diego wanted to mark the date of the last movement of each account and did this:\n\n`CREATE TRIGGER trg_ultimo AFTER UPDATE ON cuentas FOR EACH ROW EXECUTE FUNCTION marcar_ultimo();`\n\nwith `marcar_ultimo()` running `UPDATE cuentas SET ultimo_cambio = now() WHERE id = NEW.id`. Now any change in cuentas gives "stack depth limit exceeded". What do you tell him?',
      choices: {
        before: {
          text: 'That the `UPDATE cuentas` inside **fires the same trigger again**, which runs the UPDATE again, endlessly. To change the row itself: a **BEFORE UPDATE** trigger that does `NEW.ultimo_cambio := now(); RETURN NEW;`, without any UPDATE.',
          reply: "That's it. Inside a table's trigger, never an UPDATE on that same table. If it's the row itself, you change NEW.",
          effects: { 3: { text: 'To change the row itself, BEFORE and NEW; never an UPDATE on the same table.' } },
        },
        stack: {
          text: 'That he should raise `max_stack_depth` so it fits.',
          reply: "It's an infinite loop: with more stack it takes longer to fail, but it fails all the same.",
          effects: { 0: { text: 'You gave more memory to an infinite loop.' } },
        },
        statement: {
          text: 'That he should change it to `FOR EACH STATEMENT`.',
          reply: 'A statement-level trigger that runs an UPDATE on its table also fires again. The problem is the UPDATE inside.',
          effects: { 0: { text: 'You changed the kind of trigger without removing the loop.' } },
        },
      },
    },
    closing: {
      subject: '17:00 · End of the day with Inés',
      body: '**Inés:** Functions and triggers. What are you taking away?',
      choices: {
        lesson: {
          text: 'That a function avoids copying the same calculation in ten places (and RETURNS TABLE uses it like a table); that PL/pgSQL pays off when there are variables or errors; that an AFTER trigger is for auditing with OLD and NEW and a BEFORE one for completing or stopping the row; that a BEFORE returns NEW (NULL discards it); and that a trigger never runs an UPDATE on its own table.',
          reply: 'Very good. Tomorrow, making all this fast: indexes and plans.',
        },
        everything: {
          text: "That it's best to put all the app's logic in triggers.",
          reply: 'And nobody knows why a value changes. Triggers for what must always happen; the rest, in the app. Check the debrief.',
          effects: { 0: { text: 'You came away with putting everything in triggers.' } },
        },
      },
    },
  },
})
