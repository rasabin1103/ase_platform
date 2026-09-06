import { apiClient } from './client'

// Fixed vocabularies — mirror backend/app/modules/user_preferences/schemas.py
// exactly. Kept as plain string unions (not enums) so the survey UI can map
// each value straight to an i18n key without an extra lookup table.

export type PreferenceRole =
  | 'qa_manual'
  | 'qa_automation'
  | 'qa_lead_manager'
  | 'developer'
  | 'devops'
  | 'product_manager'
  | 'other'

export type ImprovementGoal =
  | 'test_automation'
  | 'qa_strategy_process'
  | 'cicd_devops'
  | 'programming_skills'
  | 'team_management'
  | 'certifications'
  | 'other'

export type WorkMode = 'individual' | 'small_team' | 'large_team'

export type PreferenceTechnology =
  | 'selenium'
  | 'cypress'
  | 'playwright'
  | 'appium'
  | 'postman_api'
  | 'jmeter_performance'
  | 'python'
  | 'java'
  | 'javascript_typescript'
  | 'jira'
  | 'other'

export type PreferenceLevel = 'beginner' | 'intermediate' | 'advanced'

export const PREFERENCE_ROLES: PreferenceRole[] = [
  'qa_manual',
  'qa_automation',
  'qa_lead_manager',
  'developer',
  'devops',
  'product_manager',
  'other',
]

export const IMPROVEMENT_GOALS: ImprovementGoal[] = [
  'test_automation',
  'qa_strategy_process',
  'cicd_devops',
  'programming_skills',
  'team_management',
  'certifications',
  'other',
]

export const WORK_MODES: WorkMode[] = ['individual', 'small_team', 'large_team']

export const PREFERENCE_TECHNOLOGIES: PreferenceTechnology[] = [
  'selenium',
  'cypress',
  'playwright',
  'appium',
  'postman_api',
  'jmeter_performance',
  'python',
  'java',
  'javascript_typescript',
  'jira',
  'other',
]

export const PREFERENCE_LEVELS: PreferenceLevel[] = ['beginner', 'intermediate', 'advanced']

export type PreferencesProfile = {
  role: PreferenceRole | null
  improvement_goals: ImprovementGoal[] | null
  work_mode: WorkMode | null
  technologies: PreferenceTechnology[] | null
  level: PreferenceLevel | null
  completed_at: string | null
  skipped_at: string | null
  is_resolved: boolean
}

export type PreferencesProfileSubmitRequest = {
  role: PreferenceRole
  improvement_goals: ImprovementGoal[]
  work_mode: WorkMode
  technologies: PreferenceTechnology[]
  level: PreferenceLevel
}

export async function getMyPreferencesProfile(): Promise<PreferencesProfile | null> {
  const { data } = await apiClient.get<PreferencesProfile | null>('/preferences-profile/me')
  return data
}

export async function submitMyPreferencesProfile(
  payload: PreferencesProfileSubmitRequest,
): Promise<PreferencesProfile> {
  const { data } = await apiClient.put<PreferencesProfile>('/preferences-profile/me', payload)
  return data
}

export async function skipMyPreferencesProfile(): Promise<PreferencesProfile> {
  const { data } = await apiClient.post<PreferencesProfile>('/preferences-profile/me/skip')
  return data
}
