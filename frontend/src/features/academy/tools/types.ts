import type { Action, Mission, RunState } from '../engine/types'

export interface ToolProps {
  mission: Mission
  state: RunState
  dispatch: (action: Action) => void
}
