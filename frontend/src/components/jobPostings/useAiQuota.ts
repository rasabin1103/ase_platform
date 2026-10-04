import { useQuery } from '@tanstack/react-query'
import {
  getAiAnalysisQuota,
  peekJobPostingSemanticCompatibility,
  type AiAnalysisQuota,
} from '../../api/jobPostings.api'

export const AI_QUOTA_QUERY_KEY = ['job-posting-ai-quota'] as const

/** Monthly AI-analysis allowance for the signed-in user (plan-defined). */
export function useAiQuota(enabled: boolean) {
  return useQuery<AiAnalysisQuota>({
    queryKey: AI_QUOTA_QUERY_KEY,
    queryFn: getAiAnalysisQuota,
    enabled,
    staleTime: 30_000,
  })
}

/** True when a NEW analysis for this posting can't be started: the month's
 * allowance is spent AND this posting has no saved analysis yet. A posting
 * that was already analyzed stays viewable — that's a free cache hit. */
export function useAnalysisBlocked(postingId: number, hasCv: boolean) {
  const quotaQuery = useAiQuota(hasCv)
  const peekQuery = useQuery({
    queryKey: ['job-posting-semantic', postingId],
    queryFn: () => peekJobPostingSemanticCompatibility(postingId),
    enabled: hasCv,
  })
  const exhausted = quotaQuery.data?.remaining === 0
  return {
    blocked: exhausted && !peekQuery.isLoading && !peekQuery.data,
    analyzed: Boolean(peekQuery.data),
    quota: quotaQuery.data,
  }
}
