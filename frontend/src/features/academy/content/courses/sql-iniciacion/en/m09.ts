import { kobaltoDataWorldEn } from '../../../worlds/kobaltoData.en'
import { m09CrearTabla } from '../m09-crear-tabla'
import { missionEn } from './missionEn'

/** Course 5: SQL from scratch · Mission 9 — Your own table. English version of ../m09-crear-tabla.ts. */
export const m09CrearTablaEn = missionEn(
  m09CrearTabla,
  {
    title: 'Your own table',
    subtitle: 'CREATE TABLE with types and rules: PRIMARY KEY, NOT NULL, DEFAULT, CHECK, UNIQUE and FOREIGN KEY.',
    playerRole: 'Junior QA · Kobalto',
    dayLabel: 'Friday · week 2',
    appLabel: 'SQL console',
    wikiLabel: 'Wiki · Data',
    verdicts: {
      good: {
        title: 'Tables with rules',
        body: 'Laura leaves the spreadsheet, Diego stores his runs without orphans, Carmen has a list without duplicates and nobody is going to store amounts as text. Ready for the practical exam.',
      },
      ok: { title: 'Tables with a hole or two', body: 'You already create tables, but a rule or a task fell by the wayside. Check the debrief.' },
      bad: {
        title: 'Tables without rules',
        body: 'Several tasks were left undone. Replay the mission: CREATE TABLE with PRIMARY KEY, NOT NULL, CHECK, UNIQUE and REFERENCES.',
      },
    },
    briefing: {
      title: 'Week 2 · Your own table',
      paragraphs: [
        'Friday of week 2, last day of the course. Today you create new tables in the test environment and give them rules so bad data cannot get in.',
        'The tasks are checked the way QA would do it: by looking at the table definition and trying to insert data that should not get in (leaving no trace). If the rules reject it, the task is done.',
      ],
      goals: [
        'Create tables with CREATE TABLE and the right type for each column.',
        'Add a primary key, mandatory columns and default values.',
        'Limit values with CHECK and add rules with ALTER TABLE.',
        'Relate tables with foreign keys and avoid duplicates with UNIQUE.',
        'Delete a table with DROP TABLE, knowing what it implies.',
      ],
    },
    docs: {
      chuleta_tablas: {
        title: 'Cheat sheet: creating tables with rules',
        updatedLabel: 'Inés Moreno · Data',
        body: `## Shape
\`\`\`
CREATE TABLE example (
  id         integer PRIMARY KEY,
  nombre     text NOT NULL,
  tipo       text NOT NULL CHECK (tipo IN ('a', 'b')),
  estado     text NOT NULL DEFAULT 'nuevo',
  cliente_id integer UNIQUE REFERENCES clientes(id),
  importe    numeric(12,2),
  creado_en  date NOT NULL
);
\`\`\`

## Rules
- \`PRIMARY KEY\`: unique and mandatory.
- \`NOT NULL\`: mandatory · \`DEFAULT\`: value if none is given.
- \`CHECK (condition)\`: allowed values.
- \`UNIQUE\`: no repeats.
- \`REFERENCES table(column)\`: it has to exist in the other table.

## Changing and deleting
- \`ALTER TABLE t ADD CHECK (…);\` · \`ALTER TABLE t ADD COLUMN c text;\`
- \`DROP TABLE t;\` — no way back.

## Types
\`integer\`, \`numeric(12,2)\`, \`text\`, \`date\`, \`timestamp\`, \`boolean\`.`,
      },
    },
    sqlLab: {
      starter: '-- Test environment: create your tables\nCREATE TABLE etiquetas (\n  id integer PRIMARY KEY,\n  nombre text NOT NULL\n);',
      retos: {
        etiquetas: {
          title: 'Table etiquetas',
          description: 'Create **etiquetas**: `id` (integer, primary key) and `nombre` (text, mandatory).',
          hint: '`CREATE TABLE etiquetas (id integer PRIMARY KEY, nombre text NOT NULL);`',
        },
        casos_prueba: {
          title: 'Table casos_prueba',
          description: 'Create **casos_prueba**: `id` (integer, primary key), `titulo` (text, mandatory), `prioridad` (text, mandatory) and `estado` (text, mandatory, default **pendiente**).',
          hint: "`estado text NOT NULL DEFAULT 'pendiente'`. The columns, in that order.",
        },
        prioridad: {
          title: 'Only alta, media or baja',
          description: 'Make `casos_prueba.prioridad` accept only **alta**, **media** or **baja**.',
          hint: "`ALTER TABLE casos_prueba ADD CHECK (prioridad IN ('alta', 'media', 'baja'));`",
        },
        ejecuciones: {
          title: 'Table ejecuciones',
          description: 'Create **ejecuciones**: `id` (integer, primary key), `caso_id` (integer, mandatory, references `casos_prueba(id)`), `resultado` (text, mandatory, only **ok** or **fallo**) and `ejecutada_en` (date, mandatory).',
          hint: "`caso_id integer NOT NULL REFERENCES casos_prueba(id)` and `resultado text NOT NULL CHECK (resultado IN ('ok', 'fallo'))`.",
        },
        vigilancia: {
          title: 'Table lista_vigilancia',
          description: 'Create **lista_vigilancia**: `id` (integer, primary key), `cliente_id` (integer, mandatory, references `clientes(id)`, **without repeating**) and `motivo` (text, mandatory).',
          hint: '`cliente_id integer NOT NULL UNIQUE REFERENCES clientes(id)`.',
        },
        poblar: {
          title: 'The first three cases',
          description: 'Insert into **casos_prueba** the cases 1 `Login con usuario válido` (alta), 2 `Transferencia sin saldo` (alta) and 3 `Cambiar idioma` (baja), **without giving the status**.',
          hint: "`INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (1, 'Login con usuario válido', 'alta'), (2, …), (3, …);`",
        },
        drop: {
          title: 'Delete the rehearsal table',
          description: 'Delete the table **etiquetas** with `DROP TABLE`.',
          hint: '`DROP TABLE etiquetas;`',
        },
      },
    },
    bugs: {
      'C-HOJA': {
        title: 'Laura is still keeping the test cases in a spreadsheet',
        explanation: 'The casos_prueba table was not created as requested.',
        technique: 'CREATE TABLE with NOT NULL and DEFAULT.',
      },
      'C-PRIORIDADES': {
        title: 'Priorities like “urgente” or “Alta” get in',
        explanation: 'Without CHECK, everyone writes the priority their own way.',
        technique: 'CHECK (prioridad IN (…)), also with ALTER TABLE.',
      },
      'C-HUERFANAS': {
        title: "Runs of cases that don't exist are stored",
        explanation: 'Without a foreign key, nothing prevents orphan results.',
        technique: 'REFERENCES casos_prueba(id).',
      },
      'C-VIGILANCIA': {
        title: 'The watch list accepts made-up and repeated customers',
        explanation: 'Without UNIQUE or a foreign key, the list is not reliable.',
        technique: 'UNIQUE + REFERENCES.',
      },
      'C-SIN-CASOS': { title: 'On Monday the cases table is empty', explanation: "Laura doesn't have her first three cases.", technique: 'INSERT relying on the DEFAULT.' },
      'C-SOLO-APP': {
        title: 'A script inserts invalid data that the app would have rejected',
        explanation: 'The rules were only in the app.',
        technique: 'Rules in the database as the last line of defense.',
      },
      'C-TEXTO': {
        title: "Amounts and dates stored as text that can't be added or sorted",
        explanation: 'A text type accepts anything.',
        technique: 'numeric and date.',
      },
    },
    prevention: {
      title: 'At the end of the week',
      intro: "How the tables were left on Friday.",
      preventedLabel: "Problems that didn't happen",
      appearedLabel: 'Problems that showed up',
      rules: {
        0: { label: 'Test cases in a table', explanation: 'NOT NULL and DEFAULT.' },
        1: { label: 'Clean priorities', explanation: 'CHECK.' },
        2: { label: 'Runs without orphans', explanation: 'Foreign key.' },
        3: { label: 'Reliable list', explanation: 'UNIQUE and foreign key.' },
        4: { label: 'First cases', explanation: 'INSERT with DEFAULT.' },
        5: { label: 'Rules in the database', explanation: 'Not only in the app.' },
        6: { label: 'Right types', explanation: 'numeric and date, not text.' },
      },
    },
    concepts: {
      create_table: { title: 'CREATE TABLE', summary: 'Defines a table: columns, types and rules.' },
      data_types: { title: 'Data types', summary: 'integer, numeric, text, date…: the type already validates, sorts and calculates.' },
      primary_key: { title: 'PRIMARY KEY', summary: 'Identifies each row: unique and mandatory.' },
      not_null_default: { title: 'NOT NULL and DEFAULT', summary: 'Mandatory column and default value when none is given.' },
      check_constraint: { title: 'CHECK', summary: 'Limits the allowed values; it can be added with ALTER TABLE.' },
      foreign_key: { title: 'FOREIGN KEY', summary: 'REFERENCES: the value has to exist in the other table.' },
      unique: { title: 'UNIQUE', summary: 'Prevents repeated values in a column that is not the key.' },
      constraints_why: { title: 'Why rules in the database', summary: 'They protect the data wherever the change comes from; they are tested with bad data.' },
      drop_alter: { title: 'ALTER TABLE and DROP TABLE', summary: 'Changing a table definition or deleting it entirely (no way back).' },
    },
    seniorTips: [
      'Read the cheat sheet on creating tables in the wiki.',
      'Inés: CREATE TABLE etiquetas (id integer PRIMARY KEY, nombre text NOT NULL);',
      "Laura: CREATE TABLE casos_prueba (id integer PRIMARY KEY, titulo text NOT NULL, prioridad text NOT NULL, estado text NOT NULL DEFAULT 'pendiente');",
      "Laura: ALTER TABLE casos_prueba ADD CHECK (prioridad IN ('alta', 'media', 'baja'));",
      "Diego: … caso_id integer NOT NULL REFERENCES casos_prueba(id), resultado text NOT NULL CHECK (resultado IN ('ok', 'fallo')), ejecutada_en date NOT NULL.",
      'Carmen: … cliente_id integer NOT NULL UNIQUE REFERENCES clientes(id), motivo text NOT NULL.',
      'Laura: INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (1, …), (2, …), (3, …);',
      'Inés: DROP TABLE etiquetas;',
      'With Inés: rules in the database, not only in the app; numeric and date, not text.',
    ],
    lessons: {
      create: {
        question: 'How do I create a table?',
        body: `\`\`\`
CREATE TABLE etiquetas (
  id     integer PRIMARY KEY,
  nombre text NOT NULL
);
\`\`\`

Each column has a **name**, a **type** and, optionally, **rules**. Separated by commas (the last one without a comma).`,
      },
      types: {
        question: 'Which type do I choose?',
        body: `The most common ones:

- \`integer\`: whole numbers (ids, quantities).
- \`numeric(12,2)\`: amounts with exact decimals.
- \`text\`: text.
- \`date\`: dates · \`timestamp\`: date and time.
- \`boolean\`: true or false.

The type is already a rule: a \`date\` column won't take “31/02”, and \`numeric\` can be added and sorted properly.`,
      },
      pk: {
        question: 'What is the primary key?',
        body: `The column that **identifies each row**: it can't be repeated or empty.

\`id integer PRIMARY KEY\`

It is what the foreign keys of other tables point to.`,
      },
      not_null: {
        question: 'How do I make a column mandatory? And a default value?',
        body: `- \`NOT NULL\`: the column can't be left empty.
- \`DEFAULT value\`: what is stored if the INSERT doesn't mention it.

\`estado text NOT NULL DEFAULT 'pendiente'\`

Together: there is always a status, and if you don't say one, “pendiente”.`,
      },
      check: {
        question: 'How do I limit the allowed values?',
        body: `With \`CHECK\` and a condition:

\`prioridad text NOT NULL CHECK (prioridad IN ('alta', 'media', 'baja'))\`

If the table already exists, it is added with \`ALTER TABLE\`:

\`ALTER TABLE casos_prueba ADD CHECK (prioridad IN ('alta', 'media', 'baja'));\`

(If there were already rows that don't meet the rule, it wouldn't let you add it.)`,
      },
      fk: {
        question: 'How do I make a column point to another table?',
        body: `With a **foreign key**:

\`caso_id integer NOT NULL REFERENCES casos_prueba(id)\`

PostgreSQL won't let you store a \`caso_id\` that doesn't exist in \`casos_prueba\`, nor delete a case that has runs. It is what was missing in \`transferencias.cuenta_destino_id\`.`,
      },
      unique: {
        question: "How do I avoid duplicates in a column that isn't the key?",
        body: `With \`UNIQUE\`:

\`cliente_id integer NOT NULL UNIQUE REFERENCES clientes(id)\`

The same customer can't appear twice. It is what would have prevented the duplicate email of customers 12 and 27.`,
      },
      why: {
        question: 'Why rules in the database if the app already validates?',
        body: `Because the app is not the only one that writes: so do scripts, migrations, other applications and people with a console. The table rules protect the data **always**.

And they are **tested** like anything else: try to insert a value that is not allowed, an empty one, a duplicate or a reference that doesn't exist, and check that the database rejects it.`,
      },
      drop: {
        question: 'How do I change or delete a table?',
        body: `- \`ALTER TABLE t ADD COLUMN c text;\` · \`ALTER TABLE t ADD CHECK (…);\`
- \`DROP TABLE t;\`: deletes the table **with all its data**. No recycle bin and no ROLLBACK if you were not in a transaction.

If another table references it with a foreign key, PostgreSQL won't let you delete it.`,
      },
    },
    quiz: {
      pre: {
        s9pre_create: {
          question: 'Which statement creates a new table?',
          options: ['NEW TABLE', 'CREATE TABLE', 'INSERT TABLE', 'MAKE TABLE'],
          explanation: 'CREATE TABLE name (columns).',
        },
        s9pre_pk: {
          question: 'What does a PRIMARY KEY guarantee?',
          options: ['That the column sorts itself', 'That it is not repeated or empty', 'That it is a number', 'Nothing, it is just a name'],
          explanation: 'It identifies each row: unique and not null.',
        },
        s9pre_notnull: {
          question: "What does `DEFAULT 'pendiente'` do?",
          options: ['Forces you to write “pendiente”', "Puts “pendiente” if the INSERT doesn't mention that column", 'Forbids the value “pendiente”', 'Changes all the rows to “pendiente”'],
          explanation: 'It is the default value.',
        },
        s9pre_check: {
          question: 'How do you allow only “alta”, “media” or “baja”?',
          options: ["CHECK (prioridad IN ('alta', 'media', 'baja'))", 'UNIQUE (prioridad)', "DEFAULT 'alta'", 'NOT NULL'],
          explanation: 'CHECK with the condition.',
        },
        s9pre_fk: {
          question: 'What does `caso_id integer REFERENCES casos_prueba(id)` prevent?',
          options: ['caso_id being repeated', "Storing a caso_id that doesn't exist in casos_prueba", 'caso_id being NULL', 'Nothing'],
          explanation: 'The foreign key requires that what is referenced exists.',
        },
        s9pre_types: {
          question: 'Which type would you use for an amount in euros with cents?',
          options: ['text', 'integer', 'numeric(12,2)', 'boolean'],
          explanation: 'numeric stores exact decimals and can be added.',
        },
      },
      post: {
        s9post_unique: {
          question: 'How do you prevent a customer from appearing twice in the watch list?',
          options: ['UNIQUE on cliente_id', 'NOT NULL on cliente_id', 'DEFAULT on cliente_id', 'A sorted index'],
          explanation: 'UNIQUE prevents duplicates.',
        },
        s9post_why: {
          question: 'The app already validates the priority. Why a CHECK in the table?',
          options: ['For nothing', 'Because scripts, migrations and other apps also write to the database', 'So the app runs faster', 'Because it is mandatory in SQL'],
          explanation: 'The table rule protects the data wherever the change comes from.',
        },
        s9post_test: {
          question: 'How do you test that a table rejects bad data?',
          options: ['By reading the CREATE TABLE', 'By trying to insert values that are not allowed, empty ones, duplicates and non-existent references', 'With a SELECT *', "It can't be tested"],
          explanation: 'Negative cases: the database must reject them.',
        },
        s9post_alter: {
          question: 'The table already exists and you want to add a CHECK. What do you use?',
          options: ['ALTER TABLE … ADD CHECK (…)', 'UPDATE … SET CHECK', 'CREATE CHECK', 'INSERT INTO CHECK'],
          explanation: 'ALTER TABLE modifies the definition of a table.',
        },
        s9post_drop: {
          question: 'What does `DROP TABLE etiquetas` do?',
          options: ['Empties the table and leaves it', 'Deletes the table and all its data', 'Deletes the last row', 'Hides it'],
          explanation: 'The table and its data disappear.',
        },
        s9post_types: {
          question: 'You store dates as text “dd/mm/yyyy”. What problem will you have?',
          options: ['None', 'They sort badly and impossible dates like “31/02/2026” are accepted', 'They take up less space', "They can't be read"],
          explanation: 'The date type sorts correctly and rejects invalid dates.',
        },
      },
    },
    scenes: {
      mail_ines: {
        subject: 'Last day: your own tables',
        body: "Last day of the second week!\n\nUntil now you used tables someone else had created. Today you create them yourself, with `CREATE TABLE`, and give them **rules**: which columns there are, of what type, which are mandatory, which values are allowed and what they point to. The rules are what stops bad data from getting in.\n\nYou are still in the test environment. To warm up:\n\n- Create the table **etiquetas** with two columns: `id` (integer, primary key) and `nombre` (text, mandatory).\n\nInés",
      },
      ines_ok: {
        body: "Table created, and with rules: it doesn't accept two rows with the same `id` or an empty `nombre`. I checked it by trying to insert bad data. That is how a table is tested.",
      },
      laura_casos: {
        body: "Hi. I want to stop keeping the test cases in a spreadsheet. Can you create the table **casos_prueba** for me?\n\n- `id`: integer, primary key.\n- `titulo`: text, mandatory.\n- `prioridad`: text, mandatory.\n- `estado`: text, mandatory, and if none is given, **pendiente**.",
      },
      laura_casos_thanks: { body: 'Great! And if I do not put the status, it stays as “pendiente”. Just what I wanted.' },
      laura_prioridad: {
        body: "I forgot: the **priority** can only be **alta**, **media** or **baja**. In the spreadsheet everyone put what they wanted (“urgente”, “Alta”, “A”…) and there was no way to filter. Can you add that to the table?",
      },
      laura_prioridad_thanks: { body: "I tried to insert “urgente” and the database wouldn't let me. Perfect!" },
      ines_reglas: {
        subject: '11:00 · Inés: “The app already validates that”',
        body: "**Inés:** Diego says that putting rules in the database is duplicating work: “the app already validates that the priority is alta, media or baja”. What do you answer?",
        choices: {
          constraints: {
            text: "That the app isn't the only thing writing to the database: so do scripts, migrations, other applications and people with a console like mine. Rules in the table protect the data wherever the change comes from. Last week's transfer to account 999 got in precisely because `cuenta_destino_id` had no foreign key.",
            reply: "Exactly. The app's validation is there to give the user a good message; the database rule is the last line of defense.",
            effects: { 3: { text: 'Rules in the database protect the data even when the change does not come from the app.' } },
          },
          app: {
            text: "That he's right: if the app validates, the rest is redundant.",
            reply: 'Until someone inserts with a script. Last week\'s 999 got in that way.',
            effects: { 0: { text: "You relied only on the app's validation." } },
          },
          slow: {
            text: 'That rules make the database slower and it is better to avoid them.',
            reply: 'Their cost is minimal compared with cleaning up corrupt data. And a foreign key even helps you understand the model.',
            effects: { 0: { text: 'You sacrificed integrity for a speed that was not at stake.' } },
          },
        },
      },
      diego_ejecuciones: {
        body: "OK, you've convinced me. To store the results of the automated tests I need the table **ejecuciones**:\n\n- `id`: integer, primary key.\n- `caso_id`: integer, mandatory, pointing to `casos_prueba(id)`.\n- `resultado`: text, mandatory, only **ok** or **fallo**.\n- `ejecutada_en`: date, mandatory.",
      },
      diego_thanks: { body: "Tested: it won't let me store a run of a case that doesn't exist. This way there won't be orphan results. Thanks!" },
      carmen_vigilancia: {
        body: 'Hi. Risk needs a **lista_vigilancia** of customers:\n\n- `id`: integer, primary key.\n- `cliente_id`: integer, mandatory, pointing to `clientes(id)` and **not repeated** (a customer is on the list only once).\n- `motivo`: text, mandatory.',
      },
      carmen_thanks: { body: 'No made-up customers and no duplicates. Now I can trust the list. Thanks.' },
      laura_poblar: {
        body: 'Last one: insert my first three cases into **casos_prueba**, without giving the status (let it take the default):\n\n- id **1**: `Login con usuario válido`, alta.\n- id **2**: `Transferencia sin saldo`, alta.\n- id **3**: `Cambiar idioma`, baja.',
      },
      laura_poblar_thanks: { body: "Three cases, all three “pendiente”. I'll start using it on Monday. Thanks!" },
      ines_drop: {
        body: "By the way: the **etiquetas** table was just a rehearsal. Delete it entirely with `DROP TABLE`. And notice there's no way back: in production, a `DROP TABLE` is about the most dangerous thing you can write.",
      },
      ines_tipos: {
        subject: '15:00 · Inés: “What if I store everything as text?”',
        body: "**Inés:** Diego proposes that, in the next table, the **amounts** and the **dates** be stored as `text`, “that way anything fits: €15.50, 03/02/2026…”. What do you tell him?",
        choices: {
          types: {
            text: "That for exactly that reason, no: if anything fits, anything gets in. With `numeric` you can add and compare amounts, and with `date` dates sort properly and a “31/02” is rejected. As text, “10” comes before “9” when sorting and SUM doesn't even work.",
            reply: "That's it. The type is the first rule of a column: choose the one that describes the data.",
            effects: { 2: { text: 'The right type (numeric, date…) validates, sorts and calculates; text accepts anything.' } },
          },
          text: {
            text: "That it's a good idea: this way there are no errors when inserting.",
            reply: 'No errors when inserting… and plenty later, when adding, sorting and comparing.',
            effects: { 0: { text: 'You preferred that anything gets in.' } },
          },
          later: {
            text: "That they'll be converted when needed.",
            reply: 'Converting dirty data is much more expensive than not letting it in.',
            effects: { 0: { text: 'You left for later what the type solves from the start.' } },
          },
        },
      },
      closing: {
        subject: '17:00 · End of the two weeks with Inés',
        body: '**Inés:** Two weeks. You started with a `SELECT *` and today you design tables with rules. What are you taking away from today?',
        choices: {
          lesson: {
            text: 'That CREATE TABLE defines columns and types; that PRIMARY KEY, NOT NULL, DEFAULT, UNIQUE, CHECK and FOREIGN KEY prevent bad data wherever the change comes from; that a table is tested by trying to insert bad data; and that DROP TABLE has no way back.',
            reply: 'Perfect. You now have everything you need for the practical exam. Good luck!',
          },
          app: {
            text: "That it's better to keep the rules in the app, which is more flexible.",
            reply: 'The app is one of the doors, not the only one. Check the debrief.',
            effects: { 0: { text: 'You came away with validating only in the app.' } },
          },
        },
      },
    },
  },
  kobaltoDataWorldEn({ marta: 'Product Owner · Payments', diego: 'Backend developer · Transfers', nuria: 'Customer Support', laura: 'QA Lead' }),
)
