// Skippable post-registration "tell us about yourself" survey — merged as
// root key `preferencesSurvey`. Deliberately not called "onboarding"
// anywhere (see backend/app/models/user_preferences_profile.py for why).
// Question copy (title fields below) must stay verbatim per the original
// request: "¿Cuál es tu rol?", "¿Qué quieres mejorar?", "¿Trabajas
// individualmente o en equipo?", "¿Qué tecnologías utilizas?", "¿Qué nivel
// tienes?" — the English strings are natural translations of the same five.

export const preferencesSurveyEn = {
  badge: 'Personalize your experience',
  title: 'Tell us a bit about you',
  subtitle:
    'This helps us recommend better courses, books, products and resources from the catalog. It only takes a minute, and you can skip it.',
  skip: 'Skip for now',
  submit: 'Save and continue',
  submitting: 'Saving…',
  submitError: 'Could not save your answers. Please try again.',
  requiredHint: 'Pick at least one option for each question.',
  questions: {
    role: {
      title: 'What is your role?',
      options: {
        qa_manual: 'Manual QA',
        qa_automation: 'QA Automation / SDET',
        qa_lead_manager: 'QA Lead / Manager',
        developer: 'Developer',
        devops: 'DevOps / CI-CD',
        product_manager: 'Product Owner / PM',
        other: 'Other',
      },
    },
    improvementGoals: {
      title: 'What do you want to improve?',
      hint: 'Choose as many as apply',
      options: {
        test_automation: 'Test automation',
        qa_strategy_process: 'QA strategy and process',
        cicd_devops: 'CI/CD and DevOps',
        programming_skills: 'Programming skills',
        team_management: 'Team management',
        certifications: 'Certification prep',
        other: 'Other',
      },
    },
    workMode: {
      title: 'Do you work individually or in a team?',
      options: {
        individual: 'Individually / freelance',
        small_team: 'Small team (2-10 people)',
        large_team: 'Large team / company',
      },
    },
    technologies: {
      title: 'What technologies do you use?',
      hint: 'Choose as many as apply',
      options: {
        selenium: 'Selenium',
        cypress: 'Cypress',
        playwright: 'Playwright',
        appium: 'Appium',
        postman_api: 'Postman / API testing',
        jmeter_performance: 'JMeter / performance',
        python: 'Python',
        java: 'Java',
        javascript_typescript: 'JavaScript / TypeScript',
        jira: 'Jira',
        other: 'Other',
      },
    },
    level: {
      title: 'What is your level?',
      options: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
      },
    },
  },
}

export const preferencesSurveyEs = {
  badge: 'Personaliza tu experiencia',
  title: 'Cuéntanos un poco sobre ti',
  subtitle:
    'Esto nos ayuda a recomendarte mejores cursos, libros, productos y recursos del catálogo. Solo lleva un minuto y puedes omitirlo.',
  skip: 'Omitir por ahora',
  submit: 'Guardar y continuar',
  submitting: 'Guardando…',
  submitError: 'No se pudieron guardar tus respuestas. Inténtalo de nuevo.',
  requiredHint: 'Elige al menos una opción en cada pregunta.',
  questions: {
    role: {
      title: '¿Cuál es tu rol?',
      options: {
        qa_manual: 'QA Manual',
        qa_automation: 'QA Automatización / SDET',
        qa_lead_manager: 'QA Lead / Manager',
        developer: 'Desarrollador/a',
        devops: 'DevOps / CI-CD',
        product_manager: 'Product Owner / PM',
        other: 'Otro',
      },
    },
    improvementGoals: {
      title: '¿Qué quieres mejorar?',
      hint: 'Elige todas las que apliquen',
      options: {
        test_automation: 'Automatización de pruebas',
        qa_strategy_process: 'Estrategia y procesos de QA',
        cicd_devops: 'CI/CD y DevOps',
        programming_skills: 'Habilidades de programación',
        team_management: 'Gestión de equipos',
        certifications: 'Preparación de certificaciones',
        other: 'Otro',
      },
    },
    workMode: {
      title: '¿Trabajas individualmente o en equipo?',
      options: {
        individual: 'Individual / autónomo',
        small_team: 'Equipo pequeño (2-10 personas)',
        large_team: 'Equipo grande / empresa',
      },
    },
    technologies: {
      title: '¿Qué tecnologías utilizas?',
      hint: 'Elige todas las que apliquen',
      options: {
        selenium: 'Selenium',
        cypress: 'Cypress',
        playwright: 'Playwright',
        appium: 'Appium',
        postman_api: 'Postman / API testing',
        jmeter_performance: 'JMeter / rendimiento',
        python: 'Python',
        java: 'Java',
        javascript_typescript: 'JavaScript / TypeScript',
        jira: 'Jira',
        other: 'Otro',
      },
    },
    level: {
      title: '¿Qué nivel tienes?',
      options: {
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
      },
    },
  },
}
