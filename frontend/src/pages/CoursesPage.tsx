import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createCourse, deleteCourse, getCourseStatsSummary, listCourses, updateCourse } from '../api/courses.api'
import { listOrganizations } from '../api/organizations.api'
import { listUsers } from '../api/users.api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, TBody, TD, THead, TH, TR } from '../components/ui/Table'
import { Textarea } from '../components/ui/Textarea'
import { useI18n } from '../i18n'
import { CreatorContentBanner } from '../components/creator/CreatorContentBanner'
import type { Course, CourseDashboardStats, CourseStatus } from '../types/course.types'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PAGE_SIZE = 8
const statuses: CourseStatus[] = ['draft', 'published', 'archived']

function fmtDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const n = (name || '').trim()
  if (n) {
    const p = n.split(/\s+/).filter(Boolean)
    if (p.length >= 2) return (p[0]![0]! + p[1]![0]!).toUpperCase()
    return n.slice(0, 2).toUpperCase()
  }
  const e = (email || '').trim()
  if (e.length >= 2) return e.slice(0, 2).toUpperCase()
  return '—'
}

function sparkFromCounts(base: number, n = 5): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const wobble = Math.max(0, base - (n - 1 - i) * Math.max(1, Math.floor(base / 8)))
    out.push(wobble)
  }
  out.push(base)
  return out
}

function MiniTrend({ values, color }: { values: number[]; color: string }) {
  const gid = useId().replace(/:/g, '')
  const data = values.map((v, i) => ({ i, v }))
  if (data.length === 0) return <div className="h-9 w-full" />
  const gradId = `g-${gid}`
  return (
    <div className="h-9 w-full opacity-90">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} fill={`url(#${gradId})`} strokeWidth={1.5} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function MetricCard({
  label,
  hint,
  value,
  trend,
  trendColor,
  icon,
}: {
  label: string
  hint: string
  value: number
  trend: number[]
  trendColor: string
  icon: React.ReactNode
}) {
  return (
    <Card className="relative overflow-hidden border border-white/[0.06] bg-gradient-to-br from-ase-surface via-ase-surface to-ase-bg2/80 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-ase-muted">{label}</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-ase-text">{value.toLocaleString()}</div>
          <div className="mt-1 text-xs text-ase-text2">{hint}</div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-ase-text">
          {icon}
        </div>
      </div>
      <div className="mt-3">{trend.length > 1 ? <MiniTrend values={trend} color={trendColor} /> : null}</div>
    </Card>
  )
}

function CourseThumb({ title, url }: { title: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="h-12 w-16 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
        loading="lazy"
        onError={(e) => {
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    )
  }
  return (
    <div
      className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ase-primary/25 to-ase-accent/15 text-[10px] font-semibold uppercase tracking-wide text-ase-text/90 ring-1 ring-white/10"
      aria-hidden
    >
      {title.slice(0, 2)}
    </div>
  )
}

export function CoursesPage() {
  const queryClient = useQueryClient()
  const { t, language } = useI18n()
  const locale = language === 'es' ? 'es-ES' : 'en-US'

  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<CourseStatus | ''>('')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [editing, setEditing] = useState<Course | null>(null)
  const [viewing, setViewing] = useState<Course | null>(null)
  const [confirmArchive, setConfirmArchive] = useState<Course | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 320)
    return () => window.clearTimeout(id)
  }, [searchInput])

  useEffect(() => {
    setPage(0)
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpenId(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const createSchema = useMemo(
    () =>
      z
        .object({
          organization_uuid: z.string().optional().or(z.literal('')),
          owner_user_uuid: z.string().optional().or(z.literal('')),
          title: z.string().min(1).max(200),
          slug: z
            .string()
            .min(1)
            .max(150)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('coursesPage.create.slugInvalid') as string),
          description: z.string().optional().or(z.literal('')),
          category: z.string().optional().or(z.literal('')),
          cover_image_url: z.string().max(2048).optional().or(z.literal('')),
          status: z.enum(['draft', 'published', 'archived']),
        })
        .refine((d) => Boolean(d.organization_uuid?.trim()) !== Boolean(d.owner_user_uuid?.trim()), {
          message: t('coursesPage.create.ownerOrOrg') as string,
          path: ['owner_user_uuid'],
        }),
    [t],
  )

  const editSchema = useMemo(
    () =>
      z.object({
        organization_uuid: z.string().optional().or(z.literal('')),
        owner_user_uuid: z.string().optional().or(z.literal('')),
        title: z.string().min(1).max(200).optional().or(z.literal('')),
        slug: z
          .string()
          .min(1)
          .max(150)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('coursesPage.create.slugInvalid') as string)
          .optional()
          .or(z.literal('')),
        description: z.string().optional().or(z.literal('')),
        category: z.string().optional().or(z.literal('')),
        cover_image_url: z.string().max(2048).optional().or(z.literal('')),
        status: z.enum(['draft', 'published', 'archived']).optional(),
      }),
    [t],
  )

  type CreateValues = z.infer<typeof createSchema>
  type EditValues = z.infer<typeof editSchema>

  const orgsQuery = useQuery({ queryKey: ['organizations', 'for-courses'], queryFn: listOrganizations })
  const usersQuery = useQuery({ queryKey: ['users', 'for-courses'], queryFn: () => listUsers({ limit: 200, offset: 0 }) })
  const statsQuery = useQuery({ queryKey: ['courses', 'stats'], queryFn: getCourseStatsSummary })

  const coursesQuery = useQuery({
    queryKey: ['courses', { limit: PAGE_SIZE, offset: page * PAGE_SIZE, status: statusFilter || null, search: debouncedSearch || null }],
    queryFn: () =>
      listCourses({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        status: statusFilter || null,
        search: debouncedSearch || null,
      }),
  })

  const orgItems = orgsQuery.data?.items ?? []
  const userItems = usersQuery.data?.items ?? []
  const items = coursesQuery.data?.items ?? []
  const total = coursesQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const stats = statsQuery.data

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      organization_uuid: '',
      owner_user_uuid: '',
      title: '',
      slug: '',
      description: '',
      category: '',
      cover_image_url: '',
      status: 'draft',
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      organization_uuid: '',
      owner_user_uuid: '',
      title: '',
      slug: '',
      description: '',
      category: '',
      cover_image_url: '',
      status: 'draft',
    },
  })

  const firstUserUuid = userItems[0]?.uuid ?? ''

  useEffect(() => {
    if (!createForm.getValues('owner_user_uuid') && firstUserUuid) {
      createForm.setValue('owner_user_uuid', firstUserUuid)
    }
  }, [firstUserUuid, createForm])

  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      createForm.reset({
        organization_uuid: '',
        owner_user_uuid: firstUserUuid,
        title: '',
        slug: '',
        description: '',
        category: '',
        cover_image_url: '',
        status: 'draft',
      })
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      await queryClient.invalidateQueries({ queryKey: ['courses', 'stats'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ course_id, payload }: { course_id: number; payload: Parameters<typeof updateCourse>[1] }) =>
      updateCourse(course_id, payload),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      await queryClient.invalidateQueries({ queryKey: ['courses', 'stats'] })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (course_id: number) => deleteCourse(course_id),
    onSuccess: async () => {
      setConfirmArchive(null)
      setMenuOpenId(null)
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      await queryClient.invalidateQueries({ queryKey: ['courses', 'stats'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: ({ course_id }: { course_id: number }) => updateCourse(course_id, { status: 'published' }),
    onSuccess: async () => {
      setMenuOpenId(null)
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      await queryClient.invalidateQueries({ queryKey: ['courses', 'stats'] })
    },
  })

  const donutColors: Record<CourseStatus, string> = {
    draft: 'rgba(148,163,184,0.55)',
    published: 'rgba(52,211,153,0.75)',
    archived: 'rgba(251,191,36,0.65)',
  }

  const byStatusChart = useMemo(() => {
    const s = statsQuery.data
    if (!s) return []
    return s.by_status.map((row) => ({
      name: t(`coursesPage.badges.${row.status}`) as string,
      value: row.count,
      color: donutColors[row.status],
    }))
  }, [statsQuery.data, t])

  const enrollMonthChart = useMemo(() => {
    const s = statsQuery.data
    if (!s?.enrollments_by_month?.length) return []
    return s.enrollments_by_month.map((b) => ({ name: b.month, students: b.count }))
  }, [statsQuery.data])

  const statTrends = useMemo(() => {
    const s = statsQuery.data
    const enroll = s?.enrollments_by_month?.map((x) => x.count) ?? []
    const pad = (arr: number[], len: number) => {
      if (arr.length >= len) return arr.slice(-len)
      const zeros = Array(len - arr.length).fill(0)
      return [...zeros, ...arr]
    }
    return {
      total: sparkFromCounts(s?.total_courses ?? 0),
      published: sparkFromCounts(s?.published_count ?? 0),
      drafts: sparkFromCounts(s?.draft_count ?? 0),
      students: pad(enroll, 6).length ? pad(enroll, 6) : sparkFromCounts(s?.total_enrollments ?? 0),
    }
  }, [statsQuery.data])

  const depsError = orgsQuery.isError || usersQuery.isError

  const onCreate = useCallback(
    (values: CreateValues) => {
      createMutation.mutate({
        organization_uuid: values.organization_uuid?.trim() ? values.organization_uuid : null,
        owner_user_uuid: values.owner_user_uuid?.trim() ? values.owner_user_uuid : null,
        title: values.title,
        slug: values.slug,
        description: values.description?.trim() ? values.description : null,
        category: values.category?.trim() ? values.category : null,
        cover_image_url: values.cover_image_url?.trim() ? values.cover_image_url : null,
        status: values.status,
      })
    },
    [createMutation],
  )

  const coverPreview = createForm.watch('cover_image_url')

  return (
    <div className="space-y-8 pb-16">
      <CreatorContentBanner />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ase-text md:text-4xl">{t('coursesPage.title')}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">{t('coursesPage.subtitle')}</p>
      </div>

      {statsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : statsQuery.isError ? (
        <Card className="border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-ase-text">{t('coursesPage.error')}</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label={t('coursesPage.stats.total.label') as string}
            hint={t('coursesPage.stats.total.hint') as string}
            value={stats?.total_courses ?? 0}
            trend={statTrends.total}
            trendColor="rgba(96,165,250,0.9)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 19h16M6 16V9M10 16v-5M14 16V6M18 16v-3" />
              </svg>
            }
          />
          <MetricCard
            label={t('coursesPage.stats.published.label') as string}
            hint={t('coursesPage.stats.published.hint') as string}
            value={stats?.published_count ?? 0}
            trend={statTrends.published}
            trendColor="rgba(52,211,153,0.95)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V7l7-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            }
          />
          <MetricCard
            label={t('coursesPage.stats.drafts.label') as string}
            hint={t('coursesPage.stats.drafts.hint') as string}
            value={stats?.draft_count ?? 0}
            trend={statTrends.drafts}
            trendColor="rgba(148,163,184,0.9)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 4h12v16H6zM8 8h8M8 12h5" />
              </svg>
            }
          />
          <MetricCard
            label={t('coursesPage.stats.students.label') as string}
            hint={t('coursesPage.stats.students.hint') as string}
            value={stats?.total_enrollments ?? 0}
            trend={statTrends.students}
            trendColor="rgba(167,139,250,0.95)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 20v-1a5 5 0 015-5h2a5 5 0 015 5v1" />
              </svg>
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="overflow-hidden border border-white/[0.06] bg-ase-surface/60 p-0 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="border-b border-white/[0.06] p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ase-text md:text-xl">{t('coursesPage.list.title')}</h2>
                <p className="mt-1 max-w-2xl text-sm text-ase-text2">{t('coursesPage.list.subtitle')}</p>
              </div>
              <div className="text-xs text-ase-muted">
                {coursesQuery.isFetching
                  ? (t('coursesPage.list.meta.updating') as string)
                  : String(t('coursesPage.list.meta.total')).replace('{{count}}', String(total))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-[200px] flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ase-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" />
                  </svg>
                </span>
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('coursesPage.search.placeholder') as string}
                  className="h-11 rounded-xl border-white/10 bg-ase-bg2/50 pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ase-muted">{t('coursesPage.filters.status')}</span>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter((e.target.value || '') as CourseStatus | '')}
                  className="h-11 min-w-[160px] rounded-xl border-white/10 bg-ase-bg2/50"
                >
                  <option value="">{t('coursesPage.filters.all')}</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {t(`coursesPage.badges.${s}`)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="max-h-[min(70vh,720px)] overflow-auto">
            {coursesQuery.isLoading ? (
              <div className="space-y-3 p-6">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-10/12 rounded-xl" />
              </div>
            ) : coursesQuery.isError ? (
              <div className="p-6">
                <EmptyState title={t('coursesPage.error') as string} description="" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-6">
                <EmptyState title={t('coursesPage.empty.title') as string} description={t('coursesPage.empty.subtitle') as string} />
              </div>
            ) : (
              <Table>
                <THead className="sticky top-0 z-10 bg-ase-surface/95 backdrop-blur-md [&_th]:border-b [&_th]:border-white/[0.06]">
                  <TR>
                    <TH className="whitespace-nowrap">{t('coursesPage.list.columns.course')}</TH>
                    <TH>{t('coursesPage.list.columns.instructor')}</TH>
                    <TH>{t('coursesPage.list.columns.status')}</TH>
                    <TH className="text-right">{t('coursesPage.list.columns.students')}</TH>
                    <TH>{t('coursesPage.list.columns.createdAt')}</TH>
                    <TH className="text-right">{t('coursesPage.list.columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((c) => (
                    <TR
                      key={c.id}
                      className="group border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]"
                    >
                      <TD>
                        <div className="flex items-center gap-3">
                          <CourseThumb title={c.title} url={c.cover_image_url ?? null} />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-ase-text">{c.title}</div>
                            <div className="truncate text-xs text-ase-muted">{c.slug}</div>
                            {c.category ? (
                              <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ase-text2">
                                {c.category}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ase-primary/30 to-ase-accent/20 text-xs font-semibold text-ase-text ring-1 ring-white/10"
                            aria-hidden
                          >
                            {initials(c.instructor_display_name, c.instructor_email)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm text-ase-text">
                              {c.instructor_display_name || c.instructor_email || '—'}
                            </div>
                            {c.instructor_display_name && c.instructor_email ? (
                              <div className="truncate text-xs text-ase-muted">{c.instructor_email}</div>
                            ) : null}
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge
                          variant={c.status === 'published' ? 'info' : c.status === 'archived' ? 'warning' : 'default'}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        >
                          {t(`coursesPage.badges.${c.status}`)}
                        </Badge>
                      </TD>
                      <TD className="text-right tabular-nums text-sm text-ase-text">{(c.enrollment_count ?? 0).toLocaleString(locale)}</TD>
                      <TD className="whitespace-nowrap text-sm text-ase-text2">{fmtDate(c.created_at, language)}</TD>
                      <TD className="text-right">
                        <div className="relative inline-flex items-center gap-1" ref={menuOpenId === c.id ? menuRef : undefined}>
                          <Button size="sm" variant="ghost" className="hidden sm:inline-flex" onClick={() => setViewing(c)}>
                            {t('coursesPage.actions.view')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hidden sm:inline-flex"
                            onClick={() => {
                              setEditing(c)
                              editForm.reset({
                                organization_uuid: '',
                                owner_user_uuid: '',
                                title: c.title,
                                slug: c.slug,
                                description: c.description ?? '',
                                category: c.category ?? '',
                                cover_image_url: c.cover_image_url ?? '',
                                status: c.status,
                              })
                            }}
                          >
                            {t('coursesPage.actions.edit')}
                          </Button>
                          {c.status !== 'published' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hidden md:inline-flex"
                              disabled={publishMutation.isPending}
                              onClick={() => publishMutation.mutate({ course_id: c.id })}
                            >
                              {t('coursesPage.actions.publish')}
                            </Button>
                          ) : null}
                          {c.status !== 'archived' ? (
                            <Button size="sm" variant="ghost" className="hidden lg:inline-flex" onClick={() => setConfirmArchive(c)}>
                              {t('coursesPage.actions.archive')}
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full px-2"
                            aria-haspopup="menu"
                            aria-expanded={menuOpenId === c.id}
                            onClick={() => setMenuOpenId((id) => (id === c.id ? null : c.id))}
                          >
                            <span className="sr-only">{t('coursesPage.actions.more')}</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="2" />
                              <circle cx="12" cy="12" r="2" />
                              <circle cx="19" cy="12" r="2" />
                            </svg>
                          </Button>
                          {menuOpenId === c.id ? (
                            <div
                              className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-white/10 bg-ase-surface p-1 shadow-2xl ring-1 ring-black/40"
                              role="menu"
                            >
                              <button
                                type="button"
                                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-ase-text hover:bg-white/[0.06] sm:hidden"
                                onClick={() => {
                                  setViewing(c)
                                  setMenuOpenId(null)
                                }}
                              >
                                {t('coursesPage.actions.view')}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-ase-text hover:bg-white/[0.06] sm:hidden"
                                onClick={() => {
                                  setEditing(c)
                                  editForm.reset({
                                    organization_uuid: '',
                                    owner_user_uuid: '',
                                    title: c.title,
                                    slug: c.slug,
                                    description: c.description ?? '',
                                    category: c.category ?? '',
                                    cover_image_url: c.cover_image_url ?? '',
                                    status: c.status,
                                  })
                                  setMenuOpenId(null)
                                }}
                              >
                                {t('coursesPage.actions.edit')}
                              </button>
                              {c.status !== 'published' ? (
                                <button
                                  type="button"
                                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-ase-text hover:bg-white/[0.06] md:hidden"
                                  disabled={publishMutation.isPending}
                                  onClick={() => {
                                    publishMutation.mutate({ course_id: c.id })
                                    setMenuOpenId(null)
                                  }}
                                >
                                  {t('coursesPage.actions.publish')}
                                </button>
                              ) : null}
                              {c.status !== 'archived' ? (
                                <button
                                  type="button"
                                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-ase-text hover:bg-white/[0.06] lg:hidden"
                                  onClick={() => {
                                    setConfirmArchive(c)
                                    setMenuOpenId(null)
                                  }}
                                >
                                  {t('coursesPage.actions.archive')}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>

          {total > PAGE_SIZE ? (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-4 sm:flex-row">
              <div className="text-xs text-ase-muted">
                {String(t('coursesPage.pagination.page')).replace('{{page}}', String(page + 1))} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  {t('coursesPage.pagination.prev')}
                </Button>
                <Button variant="ghost" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t('coursesPage.pagination.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        <aside className="space-y-6">
          <Card className="border border-white/[0.06] bg-gradient-to-b from-ase-surface to-ase-bg2/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] xl:sticky xl:top-24">
            <div>
              <h2 className="text-lg font-semibold text-ase-text">{t('coursesPage.create.title')}</h2>
              <p className="mt-1 text-sm text-ase-text2">{t('coursesPage.create.subtitle')}</p>
            </div>

            {depsError ? (
              <p className="mt-4 text-sm text-ase-error">{t('coursesPage.create.depsError')}</p>
            ) : orgsQuery.isLoading || usersQuery.isLoading ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.owner')}</label>
                  <Select {...createForm.register('owner_user_uuid')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                    <option value="">{t('coursesPage.create.selectOwner')}</option>
                    {userItems.map((u) => (
                      <option key={u.uuid} value={u.uuid}>
                        {u.display_name || u.email}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.organization')}</label>
                  <Select {...createForm.register('organization_uuid')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                    <option value="">—</option>
                    {orgItems.map((o) => (
                      <option key={o.uuid} value={o.uuid}>
                        {o.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {createForm.formState.errors.owner_user_uuid ? (
                  <p className="text-xs text-ase-error">{createForm.formState.errors.owner_user_uuid.message}</p>
                ) : null}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.title')}</label>
                  <Input
                    {...createForm.register('title')}
                    placeholder={t('coursesPage.create.placeholders.title') as string}
                    className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
                  />
                  {createForm.formState.errors.title ? (
                    <p className="mt-1 text-xs text-ase-error">{createForm.formState.errors.title.message}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.slug')}</label>
                  <Input
                    {...createForm.register('slug')}
                    placeholder={t('coursesPage.create.placeholders.slug') as string}
                    className="h-11 rounded-xl border-white/10 bg-ase-bg2/50 font-mono text-sm"
                  />
                  {createForm.formState.errors.slug ? (
                    <p className="mt-1 text-xs text-ase-error">{createForm.formState.errors.slug.message}</p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.description')}</label>
                  <Textarea
                    {...createForm.register('description')}
                    placeholder={t('coursesPage.create.placeholders.description') as string}
                    className="min-h-[100px] rounded-xl border-white/10 bg-ase-bg2/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.category')}</label>
                  <Input
                    {...createForm.register('category')}
                    placeholder={t('coursesPage.create.placeholders.category') as string}
                    className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.status')}</label>
                  <Select {...createForm.register('status')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {t(`coursesPage.badges.${s}`)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.coverImage')}</label>
                  <Input
                    {...createForm.register('cover_image_url')}
                    placeholder={t('coursesPage.create.placeholders.coverImage') as string}
                    className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
                  />
                </div>
                <div className="rounded-xl border border-dashed border-white/15 bg-ase-bg2/30 p-3">
                  <div className="text-xs font-medium text-ase-text2">{t('coursesPage.coverPreview.label')}</div>
                  {coverPreview?.trim() ? (
                    <img src={coverPreview.trim()} alt="" className="mt-2 h-28 w-full rounded-lg object-cover ring-1 ring-white/10" />
                  ) : (
                    <div className="mt-2 flex h-28 items-center justify-center rounded-lg bg-white/[0.03] text-center text-xs text-ase-muted">
                      {t('coursesPage.coverPreview.empty')}
                    </div>
                  )}
                </div>

                {createMutation.isError ? (
                  <div className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{t('coursesPage.create.error')}</div>
                ) : null}

                <Button type="submit" className="h-11 w-full rounded-xl" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (t('coursesPage.create.creating') as string) : (t('coursesPage.create.button') as string)}
                </Button>
              </form>
            )}
          </Card>
        </aside>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-ase-text md:text-xl">{t('coursesPage.insights.title')}</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <InsightsDonut title={t('coursesPage.insights.byStatus') as string} data={byStatusChart} emptyHint={t('coursesPage.insights.emptyChart') as string} />
          <InsightsBar title={t('coursesPage.insights.students') as string} data={enrollMonthChart} emptyHint={t('coursesPage.insights.emptyChart') as string} />
          <InsightsTopCourses stats={stats} emptyHint={t('coursesPage.insights.emptyTop') as string} t={t} locale={locale} />
          <InsightsActivity stats={stats} emptyHint={t('coursesPage.insights.emptyActivity') as string} t={t} fmt={(iso) => fmtDate(iso, language)} />
        </div>
      </section>

      <Modal
        open={!!viewing}
        title={t('coursesPage.view.title') as string}
        onClose={() => setViewing(null)}
        footer={
          <Button variant="ghost" onClick={() => setViewing(null)}>
            {t('coursesPage.actions.close')}
          </Button>
        }
      >
        {viewing ? <CourseViewBody c={viewing} t={t} fmt={(iso) => fmtDate(iso, language)} /> : null}
      </Modal>

      <Modal
        open={!!editing}
        title={t('coursesPage.edit.title') as string}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('coursesPage.actions.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={updateMutation.isPending}
              onClick={editForm.handleSubmit((values) => {
                if (!editing) return
                updateMutation.mutate({
                  course_id: editing.id,
                  payload: {
                    organization_uuid: values.organization_uuid?.trim() ? values.organization_uuid : null,
                    owner_user_uuid: values.owner_user_uuid?.trim() ? values.owner_user_uuid : null,
                    title: values.title?.trim() ? values.title : null,
                    slug: values.slug?.trim() ? values.slug : null,
                    description: values.description !== undefined ? (values.description?.trim() ? values.description : null) : null,
                    category: values.category !== undefined ? (values.category?.trim() ? values.category : null) : null,
                    cover_image_url: values.cover_image_url !== undefined ? (values.cover_image_url?.trim() ? values.cover_image_url : null) : null,
                    status: values.status ?? null,
                  },
                })
              })}
            >
              {updateMutation.isPending ? (t('coursesPage.actions.saving') as string) : (t('coursesPage.actions.save') as string)}
            </Button>
          </div>
        }
      >
        {editing ? (
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.organization')}</label>
                <Select {...editForm.register('organization_uuid')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                  <option value="">—</option>
                  {orgItems.map((o) => (
                    <option key={o.uuid} value={o.uuid}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.owner')}</label>
                <Select {...editForm.register('owner_user_uuid')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                  <option value="">—</option>
                  {userItems.map((u) => (
                    <option key={u.uuid} value={u.uuid}>
                      {u.display_name || u.email}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.title')}</label>
                <Input {...editForm.register('title')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.slug')}</label>
                <Input {...editForm.register('slug')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.description')}</label>
              <Textarea {...editForm.register('description')} className="min-h-[88px] rounded-xl border-white/10 bg-ase-bg2/50" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.category')}</label>
                <Input {...editForm.register('category')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.status')}</label>
                <Select {...editForm.register('status')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {t(`coursesPage.badges.${s}`)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ase-text2">{t('coursesPage.create.fields.coverImage')}</label>
              <Input {...editForm.register('cover_image_url')} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50" />
            </div>
            {updateMutation.isError ? (
              <div className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{t('coursesPage.error')}</div>
            ) : null}
          </form>
        ) : null}
      </Modal>

      <Modal
        open={!!confirmArchive}
        title={t('coursesPage.confirmArchive.title') as string}
        onClose={() => setConfirmArchive(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmArchive(null)}>
              {t('coursesPage.actions.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={archiveMutation.isPending}
              onClick={() => {
                if (!confirmArchive) return
                archiveMutation.mutate(confirmArchive.id)
              }}
            >
              {t('coursesPage.confirmArchive.confirm')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ase-text">
          {String(t('coursesPage.confirmArchive.body')).replace('{{title}}', confirmArchive?.title ?? '')}
        </p>
        {archiveMutation.isError ? (
          <p className="mt-2 text-sm text-ase-error">{t('coursesPage.error')}</p>
        ) : null}
      </Modal>
    </div>
  )
}

function CourseViewBody({ c, t, fmt }: { c: Course; t: (k: string) => unknown; fmt: (iso: string) => string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="font-semibold text-ase-text">{c.title}</div>
      <div className="text-ase-muted">{c.slug}</div>
      {c.category ? <Badge variant="default">{c.category}</Badge> : null}
      {c.description ? <p className="text-ase-text2">{c.description}</p> : null}
      <div className="text-ase-text2">
        {(t('coursesPage.list.columns.instructor') as string) + ': '}
        {c.instructor_display_name || c.instructor_email || '—'}
      </div>
      <div className="text-ase-text2">
        {(t('coursesPage.list.columns.students') as string) + ': '}
        {(c.enrollment_count ?? 0).toString()}
      </div>
      <div className="text-ase-text2">
        {(t('coursesPage.list.columns.createdAt') as string) + ': '}
        {fmt(c.created_at)}
      </div>
      {c.cover_image_url ? <img src={c.cover_image_url} alt="" className="mt-2 max-h-48 w-full rounded-lg object-cover" /> : null}
    </div>
  )
}

function InsightsDonut({ title, data, emptyHint }: { title: string; data: { name: string; value: number; color: string }[]; emptyHint: string }) {
  const sum = data.reduce((a, b) => a + b.value, 0)
  return (
    <Card className="border border-white/[0.06] bg-ase-surface/70 p-5">
      <div className="text-sm font-semibold text-ase-text">{title}</div>
      <div className="mt-4 h-56">
        {sum === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ase-muted">{emptyHint}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={2}>
                {data.map((e, i) => (
                  <Cell key={i} fill={e.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function InsightsBar({ title, data, emptyHint }: { title: string; data: { name: string; students: number }[]; emptyHint: string }) {
  return (
    <Card className="border border-white/[0.06] bg-ase-surface/70 p-5">
      <div className="text-sm font-semibold text-ase-text">{title}</div>
      <div className="mt-4 h-56">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ase-muted">{emptyHint}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
              <Bar dataKey="students" fill="rgba(96,165,250,0.75)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

function InsightsTopCourses({
  stats,
  emptyHint,
  t,
  locale,
}: {
  stats: CourseDashboardStats | undefined
  emptyHint: string
  t: (k: string) => unknown
  locale: string
}) {
  const rows = stats?.top_courses ?? []
  return (
    <Card className="border border-white/[0.06] bg-ase-surface/70 p-5">
      <div className="text-sm font-semibold text-ase-text">{t('coursesPage.insights.topCourses') as string}</div>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-ase-muted">{emptyHint}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r, idx) => (
            <li key={r.course_id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-semibold text-ase-muted">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ase-text">{r.title}</div>
                  <div className="truncate text-xs text-ase-muted">{r.slug}</div>
                </div>
              </div>
              <div className="shrink-0 text-sm tabular-nums text-ase-text">{r.enrollment_count.toLocaleString(locale)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function InsightsActivity({
  stats,
  emptyHint,
  t,
  fmt,
}: {
  stats: CourseDashboardStats | undefined
  emptyHint: string
  t: (k: string) => unknown
  fmt: (iso: string) => string
}) {
  const rows = stats?.recent_activity ?? []
  return (
    <Card className="border border-white/[0.06] bg-ase-surface/70 p-5">
      <div className="text-sm font-semibold text-ase-text">{t('coursesPage.insights.activity') as string}</div>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-ase-muted">{emptyHint}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li key={r.course_id} className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm text-ase-text">{r.title}</div>
                <div className="truncate text-xs text-ase-muted">{r.slug}</div>
              </div>
              <div className="shrink-0 whitespace-nowrap text-xs text-ase-text2">{fmt(r.updated_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
