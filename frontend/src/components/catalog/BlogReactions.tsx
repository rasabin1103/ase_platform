import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { removeBlogReaction, setBlogReaction, type BlogReaction } from '../../api/publicBlog.api'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

type Props = {
  slug: string
  likesCount: number
  dislikesCount: number
  myReaction: BlogReaction | null
}

/** Like/dislike toggle for a blog article — requires login (same rule as
 * comments). Clicking the reaction you already have clears it, matching the
 * backend's toggle behavior (BlogEngagementService.set_reaction). */
export function BlogReactions({ slug, likesCount, dislikesCount, myReaction }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [likes, setLikes] = useState(likesCount)
  const [dislikes, setDislikes] = useState(dislikesCount)
  const [mine, setMine] = useState(myReaction)
  const [pending, setPending] = useState<BlogReaction | null>(null)

  const applyCounts = (counts: { likesCount: number; dislikesCount: number; myReaction: BlogReaction | null }) => {
    setLikes(counts.likesCount)
    setDislikes(counts.dislikesCount)
    setMine(counts.myReaction)
  }

  const handleClick = async (reaction: BlogReaction) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setPending(reaction)
    try {
      const result = mine === reaction ? await removeBlogReaction(slug) : await setBlogReaction(slug, reaction)
      applyCounts(result)
    } finally {
      setPending(null)
    }
  }

  const buttonClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
      active
        ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
        : 'border-white/10 bg-white/[0.04] text-ase-text2 hover:border-white/20 hover:bg-white/[0.08] hover:text-ase-text',
    )

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => handleClick('like')}
        className={buttonClass(mine === 'like')}
        title={isAuthenticated ? undefined : (t('blogPage.reactions.loginRequired') as string)}
      >
        <ThumbsUp className="h-4 w-4" strokeWidth={1.75} />
        {likes}
      </button>
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => handleClick('dislike')}
        className={buttonClass(mine === 'dislike')}
        title={isAuthenticated ? undefined : (t('blogPage.reactions.loginRequired') as string)}
      >
        <ThumbsDown className="h-4 w-4" strokeWidth={1.75} />
        {dislikes}
      </button>
    </div>
  )
}
