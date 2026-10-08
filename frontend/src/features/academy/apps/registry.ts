import type { ComponentType } from 'react'
import type { RunState } from '../engine/types'
import type { ToolProps } from '../tools/types'
import { KobaltoTransferApp } from './kobalto/KobaltoTransferApp'
import { KobaltoScheduleApp } from './kobalto-scheduled/KobaltoScheduleApp'
import { KobaltoLoanApp } from './kobalto-loans/KobaltoLoanApp'
import { KobaltoPaymentsApp } from './kobalto-payments/KobaltoPaymentsApp'
import { KobaltoCardsApp } from './kobalto-cards/KobaltoCardsApp'
import { KobaltoReleaseApp } from './kobalto-release/KobaltoReleaseApp'
import { KobaltoPyramidApp } from './kobalto-pyramid/KobaltoPyramidApp'
import { KobaltoIncidentApp } from './kobalto-incident/KobaltoIncidentApp'
import { KobaltoInspectionApp } from './kobalto-inspection/KobaltoInspectionApp'
import { KobaltoGherkinApp } from './kobalto-gherkin/KobaltoGherkinApp'
import { KobaltoProcessApp } from './kobalto-process/KobaltoProcessApp'
import { KobaltoCoverageApp } from './kobalto-coverage/KobaltoCoverageApp'
import { KobaltoExploreApp } from './kobalto-explore/KobaltoExploreApp'
import { KobaltoPlanApp } from './kobalto-plan/KobaltoPlanApp'

export type AppProps = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }

/** Apps bajo prueba reutilizables entre misiones (Mission.appId). */
export const APP_COMPONENTS: Record<string, ComponentType<AppProps>> = {
  'kobalto-transfers': KobaltoTransferApp as ComponentType<AppProps>,
  'kobalto-scheduled': KobaltoScheduleApp as ComponentType<AppProps>,
  'kobalto-loans': KobaltoLoanApp as ComponentType<AppProps>,
  'kobalto-payments': KobaltoPaymentsApp as ComponentType<AppProps>,
  'kobalto-cards': KobaltoCardsApp as ComponentType<AppProps>,
  'kobalto-release': KobaltoReleaseApp as ComponentType<AppProps>,
  'kobalto-pyramid': KobaltoPyramidApp as ComponentType<AppProps>,
  'kobalto-incident': KobaltoIncidentApp as ComponentType<AppProps>,
  'kobalto-inspection': KobaltoInspectionApp as ComponentType<AppProps>,
  'kobalto-gherkin': KobaltoGherkinApp as ComponentType<AppProps>,
  'kobalto-process': KobaltoProcessApp as ComponentType<AppProps>,
  'kobalto-coverage': KobaltoCoverageApp as ComponentType<AppProps>,
  'kobalto-explore': KobaltoExploreApp as ComponentType<AppProps>,
  'kobalto-plan': KobaltoPlanApp as ComponentType<AppProps>,
}

export const DEFAULT_APP = 'kobalto-transfers'
