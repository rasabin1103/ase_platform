import { describe, expect, it } from 'vitest'
import type { AppEvent } from '../engine/types'
import { agreementsFor, storiesFor, analyzeFlow, INITIAL_SPRINT } from './kobalto-sprint/sprintLogic'
import { decisionLabels, testsFor, applyDecisions, INITIAL_SUITE, TESTS } from './kobalto-suite/suiteLogic'
import { commentLabels, hunksFor, submitReview, INITIAL_PR } from './kobalto-pr/prLogic'
import { commentsFor, sectionsFor as rfcSections, squadsFor, sendRfc, INITIAL_RFC } from './kobalto-rfc/rfcLogic'
import { conditionsFor, criteriaFor, optionsFor, pilotsFor, saveCriteria, INITIAL_VENDOR } from './kobalto-vendor/vendorLogic'
import { membersFor, tasksFor, topicsFor, confirmAssignments, INITIAL_TEAM } from './kobalto-team/teamLogic'
import { examplesFor, stepsFor, savePrep, INITIAL_PREP } from './kobalto-oneonone/oneOnOneLogic'
import { candidatesFor, requirementsFor, stepsFor as hiringSteps, saveProfile, INITIAL_HIRING } from './kobalto-hiring/hiringLogic'
import { leversFor, areaFor, savePlan, INITIAL_CAPACITY } from './kobalto-capacity/capacityLogic'
import { actionsFor, causesFor, timelineFor, savePostmortem, INITIAL_PM } from './kobalto-postmortem/postmortemLogic'
import { factsFor, metricsFor, sectionsFor as stratSections, saveStrategy, INITIAL_STRATEGY } from './kobalto-strategy/strategyLogic'

/** Todo lo que no es texto (ids, números, banderas) debe ser idéntico entre idiomas. */
const strip = (v: unknown): unknown => JSON.parse(JSON.stringify(v, (k, x) => (typeof x === 'string' && !/^(id|best|kind|column|good|squad|tool|when)$/.test(k) && k !== '' && !/^[a-z_0-9.]+$/.test(x) ? '·' : x)))

describe('Gestión QA · apps en inglés', () => {
  const pairs: [string, unknown, unknown][] = [
    ['sprint stories', storiesFor('es'), storiesFor('en')],
    ['sprint agreements', agreementsFor('es'), agreementsFor('en')],
    ['suite tests', TESTS, testsFor('en')],
    ['pr hunks', hunksFor('es'), hunksFor('en')],
    ['rfc sections', rfcSections('es'), rfcSections('en')],
    ['rfc comments', commentsFor('es'), commentsFor('en')],
    ['rfc squads', squadsFor('es'), squadsFor('en')],
    ['vendor options', optionsFor('es'), optionsFor('en')],
    ['vendor criteria', criteriaFor('es'), criteriaFor('en')],
    ['vendor pilots', pilotsFor('es'), pilotsFor('en')],
    ['vendor conditions', conditionsFor('es'), conditionsFor('en')],
    ['team members', membersFor('es'), membersFor('en')],
    ['team tasks', tasksFor('es'), tasksFor('en')],
    ['team topics', topicsFor('es'), topicsFor('en')],
    ['1:1 examples', examplesFor('es'), examplesFor('en')],
    ['1:1 steps', stepsFor('es'), stepsFor('en')],
    ['hiring candidates', candidatesFor('es'), candidatesFor('en')],
    ['hiring requirements', requirementsFor('es'), requirementsFor('en')],
    ['hiring steps', hiringSteps('es'), hiringSteps('en')],
    ['capacity levers', leversFor('es'), leversFor('en')],
    ['postmortem causes', causesFor('es'), causesFor('en')],
    ['postmortem actions', actionsFor('es'), actionsFor('en')],
    ['strategy metrics', metricsFor('es'), metricsFor('en')],
    ['strategy sections', stratSections('es'), stratSections('en')],
  ]
  it.each(pairs)('%s keep the same structure and numbers', (_n, es, en) => {
    expect(strip(en)).toEqual(strip(es))
    expect(JSON.stringify(en)).not.toBe(JSON.stringify(es))
  })

  it('list-shaped tables have the same length', () => {
    expect(timelineFor('en')).toHaveLength(timelineFor('es').length)
    expect(areaFor('en')).toHaveLength(areaFor('es').length)
    expect(factsFor('en')).toHaveLength(factsFor('es').length)
    expect(Object.keys(decisionLabels('en'))).toEqual(Object.keys(decisionLabels('es')))
    expect(Object.keys(commentLabels('en'))).toEqual(Object.keys(commentLabels('es')))
  })

  it('actions emit the same flags in both languages and English summaries', () => {
    const same = (a: { event: AppEvent }, b: { event: AppEvent }) => {
      expect(b.event.flags).toEqual(a.event.flags)
      expect(b.event.cost).toBe(a.event.cost)
      expect(b.event.summary).not.toBe(a.event.summary)
    }
    same(analyzeFlow(INITIAL_SPRINT), analyzeFlow(INITIAL_SPRINT, 'en'))
    same(applyDecisions(INITIAL_SUITE), applyDecisions(INITIAL_SUITE, 'en'))
    same(submitReview(INITIAL_PR), submitReview(INITIAL_PR, 'en'))
    same(sendRfc(INITIAL_RFC), sendRfc(INITIAL_RFC, 'en'))
    same(saveCriteria(INITIAL_VENDOR), saveCriteria(INITIAL_VENDOR, 'en'))
    same(confirmAssignments(INITIAL_TEAM), confirmAssignments(INITIAL_TEAM, 'en'))
    same(savePrep(INITIAL_PREP), savePrep(INITIAL_PREP, 'en'))
    same(saveProfile(INITIAL_HIRING), saveProfile(INITIAL_HIRING, 'en'))
    same(savePlan(INITIAL_CAPACITY), savePlan(INITIAL_CAPACITY, 'en'))
    same(savePostmortem(INITIAL_PM), savePostmortem(INITIAL_PM, 'en'))
    same(saveStrategy(INITIAL_STRATEGY), saveStrategy(INITIAL_STRATEGY, 'en'))
  })
})
