import { useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../components/ui/cn'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'
import {
  IMPROVEMENT_GOALS,
  PREFERENCE_LEVELS,
  PREFERENCE_ROLES,
  PREFERENCE_TECHNOLOGIES,
  WORK_MODES,
  skipMyPreferencesProfile,
  submitMyPreferencesProfile,
  type ImprovementGoal,
  type PreferenceLevel,
  type PreferenceRole,
  type PreferenceTechnology,
  type WorkMode,
} from '../../api/userPreferences.api'

// Skippable "tell us about yourself" survey, shown once after registration
// (see ConsumerRouteGuard.tsx, gated by MeResponse.needs_preferences_survey).
// Deliberately not named/routed as "onboarding" — that word already means
// the unrelated organization-setup flow (OnboardingPage.tsx, /onboarding).

function OptionPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm transition',
        selected
          ? 'border-ase-brand/50 bg-ase-brand/15 text-ase-brand font-semibold'
          : 'border-white/10 bg-white/[0.03] text-ase-text2 hover:border-white/20 hover:bg-white/[0.06]',
      )}
    >
      {children}
    </button>
  )
}

export function PreferencesSurveyPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { loadCurrentUser } = useAuth()

  const [role, setRole] = useState<PreferenceRole | null>(null)
  const [goals, setGoals] = useState<ImprovementGoal[]>([])
  const [workMode, setWorkMode] = useState<WorkMode | null>(null)
  const [technologies, setTechnologies] = useState<PreferenceTechnology[]>([])
  const [level, setLevel] = useState<PreferenceLevel | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  const toggleGoal = (g: ImprovementGoal) =>
    setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))

  const toggleTech = (tech: PreferenceTechnology) =>
    setTechnologies((cur) => (cur.includes(tech) ? cur.filter((x) => x !== tech) : [...cur, tech]))

  const isComplete = Boolean(role) && goals.length > 0 && Boolean(workMode) && technologies.length > 0 && Boolean(level)

  const finishAndGoToDashboard = async () => {
    await loadCurrentUser()
    navigate('/dashboard', { replace: true })
  }

  const submitMutation = useMutation({
    mutationFn: submitMyPreferencesProfile,
    onSuccess: finishAndGoToDashboard,
  })

  const skipMutation = useMutation({
    mutationFn: skipMyPreferencesProfile,
    onSuccess: finishAndGoToDashboard,
  })

  const handleSubmit = () => {
    if (!role || !workMode || !level || goals.length === 0 || technologies.length === 0) {
      setShowValidation(true)
      return
    }
    submitMutation.mutate({
      role,
      improvement_goals: goals,
      work_mode: workMode,
      technologies,
      level,
    })
  }

  const isBusy = submitMutation.isPending || skipMutation.isPending

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Badge variant="info" className="w-fit">
          <Sparkles className="mr-1 inline h-3.5 w-3.5" strokeWidth={1.75} />
          {t('preferencesSurvey.badge')}
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text">
          {t('preferencesSurvey.title')}
        </h1>
        <p className="mt-1 text-sm text-ase-text2">{t('preferencesSurvey.subtitle')}</p>
      </div>

      <Card className="space-y-8 p-6">
        <div>
          <h2 className="text-sm font-semibold text-ase-text">{t('preferencesSurvey.questions.role.title')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PREFERENCE_ROLES.map((option) => (
              <OptionPill key={option} selected={role === option} onClick={() => setRole(option)}>
                {t(`preferencesSurvey.questions.role.options.${option}`)}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ase-text">
            {t('preferencesSurvey.questions.improvementGoals.title')}
          </h2>
          <p className="mt-0.5 text-xs text-ase-muted">{t('preferencesSurvey.questions.improvementGoals.hint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {IMPROVEMENT_GOALS.map((option) => (
              <OptionPill key={option} selected={goals.includes(option)} onClick={() => toggleGoal(option)}>
                {t(`preferencesSurvey.questions.improvementGoals.options.${option}`)}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ase-text">{t('preferencesSurvey.questions.workMode.title')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {WORK_MODES.map((option) => (
              <OptionPill key={option} selected={workMode === option} onClick={() => setWorkMode(option)}>
                {t(`preferencesSurvey.questions.workMode.options.${option}`)}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ase-text">
            {t('preferencesSurvey.questions.technologies.title')}
          </h2>
          <p className="mt-0.5 text-xs text-ase-muted">{t('preferencesSurvey.questions.technologies.hint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PREFERENCE_TECHNOLOGIES.map((option) => (
              <OptionPill key={option} selected={technologies.includes(option)} onClick={() => toggleTech(option)}>
                {t(`preferencesSurvey.questions.technologies.options.${option}`)}
              </OptionPill>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ase-text">{t('preferencesSurvey.questions.level.title')}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PREFERENCE_LEVELS.map((option) => (
              <OptionPill key={option} selected={level === option} onClick={() => setLevel(option)}>
                {t(`preferencesSurvey.questions.level.options.${option}`)}
              </OptionPill>
            ))}
          </div>
        </div>

        {showValidation && !isComplete ? (
          <p className="text-xs text-ase-error">{t('preferencesSurvey.requiredHint')}</p>
        ) : null}
        {submitMutation.isError ? (
          <p className="text-xs text-ase-error">{t('preferencesSurvey.submitError')}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" disabled={isBusy} onClick={() => skipMutation.mutate()}>
            {t('preferencesSurvey.skip')}
          </Button>
          <Button disabled={isBusy} onClick={handleSubmit}>
            {submitMutation.isPending ? t('preferencesSurvey.submitting') : t('preferencesSurvey.submit')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
