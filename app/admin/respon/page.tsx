'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { 
  Eye, Trash2, Loader2, Search, X, ClipboardList, UserCheck, UserX, ShieldCheck, 
  Building2, Filter, MessageSquareText, ListTodo, Star, User,
  Laugh, Smile, Frown, Angry, Printer, Calendar, Phone, FileText, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Response, Service, SurveyPeriod, DemographicField, Question } from '@/types'

interface ResponseAnswerDetail {
  id: string
  response_id: string
  question_id: string
  rating_value: number
  question?: Question
}

interface ResponseDemographicDetail {
  id: string
  response_id: string
  field_id: string
  value: string
  field?: DemographicField
}

export default function AdminResponPage() {
  const [responses, setResponses] = useState<Response[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [periods, setPeriods] = useState<SurveyPeriod[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [filterService, setFilterService] = useState<string>('')
  const [filterPeriod, setFilterPeriod] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Pagination state
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Debounce search input (300ms) to minimize server/DB query load
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Detail Modal state
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [detailAnswers, setDetailAnswers] = useState<ResponseAnswerDetail[]>([])
  const [detailDemographics, setDetailDemographics] = useState<ResponseDemographicDetail[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<Response | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let ignore = false
    async function loadMeta() {
      const [servRes, perRes] = await Promise.all([
        supabase.from('services').select('*').order('name'),
        supabase.from('survey_periods').select('*').order('start_date', { ascending: false }),
      ])
      if (!ignore) {
        if (servRes.data) setServices(servRes.data as Service[])
        if (perRes.data) setPeriods(perRes.data as SurveyPeriod[])
      }
    }
    loadMeta()
    return () => { ignore = true }
  }, [supabase])

  const fetchResponses = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('responses').select('*, services(*), survey_periods(*)', { count: 'exact' }).order('submitted_at', { ascending: false })

    if (filterService) query = query.eq('service_id', filterService)
    if (filterPeriod) query = query.eq('period_id', filterPeriod)
    if (filterDateFrom) query = query.gte('submitted_at', `${filterDateFrom}T00:00:00`)
    if (filterDateTo) query = query.lte('submitted_at', `${filterDateTo}T23:59:59`)

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.trim()
      query = query.or(`respondent_name.ilike.%${q}%,respondent_contact.ilike.%${q}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, count, error } = await query
    if (error) {
      console.error('Error fetching responses:', error)
      toast.error('Gagal mengambil data respon')
    } else {
      setResponses((data as Response[]) || [])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [supabase, filterService, filterPeriod, filterDateFrom, filterDateTo, debouncedSearchQuery, page, pageSize])

  useEffect(() => {
    let ignore = false
    async function loadData() {
      if (!ignore) {
        await fetchResponses()
      }
    }
    loadData()
    return () => { ignore = true }
  }, [fetchResponses])

  async function openDetail(res: Response) {
    setSelectedResponse(res)
    setDetailOpen(true)
    setDetailLoading(true)

    const [ansRes, demoRes] = await Promise.all([
      supabase.from('response_answers').select('*, question:questions(*)').eq('response_id', res.id),
      supabase.from('response_demographics').select('*, field:demographic_fields(*)').eq('response_id', res.id),
    ])

    if (ansRes.data) setDetailAnswers(ansRes.data as unknown as ResponseAnswerDetail[])
    if (demoRes.data) setDetailDemographics(demoRes.data as unknown as ResponseDemographicDetail[])
    setDetailLoading(false)
  }

  async function confirmDelete() {
    if (!deleteDialog) return
    setDeleting(true)
    try {
      await supabase.from('response_demographics').delete().eq('response_id', deleteDialog.id)
      await supabase.from('response_answers').delete().eq('response_id', deleteDialog.id)
      const { error } = await supabase.from('responses').delete().eq('id', deleteDialog.id)
      if (error) throw error

      toast.success('Data respon berhasil dihapus')
      setDeleteDialog(null)
      fetchResponses()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error('Gagal menghapus respon: ' + msg)
    } finally {
      setDeleting(false)
    }
  }

  function clearFilters() {
    setFilterService('')
    setFilterPeriod('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setSearchQuery('')
  }

  const getRatingBadge = (rating: number) => {
    switch (rating) {
      case 4:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-extrabold text-xs border border-teal-200 shrink-0">
            <Laugh className="size-4 text-teal-600 dark:text-teal-400" />
            <span>4 - Sangat Puas</span>
          </span>
        )
      case 3:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-extrabold text-xs border border-cyan-200 shrink-0">
            <Smile className="size-4 text-cyan-600 dark:text-cyan-400" />
            <span>3 - Puas</span>
          </span>
        )
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300 font-extrabold text-xs border border-pink-200 shrink-0">
            <Frown className="size-4 text-pink-600 dark:text-pink-400" />
            <span>2 - Kurang Puas</span>
          </span>
        )
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-extrabold text-xs border border-rose-200 shrink-0">
            <Angry className="size-4 text-rose-600 dark:text-rose-400" />
            <span>1 - Tidak Puas</span>
          </span>
        )
      default:
        return <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">{rating}</span>
    }
  }

  const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize])

  return (
    <div className="w-full space-y-6">
      
      {/* Header Banner Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <ClipboardList className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Data Respon Survei
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              Kelola, saring, dan analisa seluruh hasil isian data survei responden dari masyarakat.
            </p>
          </div>
        </div>

        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-2 rounded-2xl font-bold text-xs self-start md:self-auto">
          Total {totalCount} Respon
        </Badge>
      </div>

      {/* Filter Section Card */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 py-4">
          <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Filter className="size-4 text-emerald-600" />
            Filter Data Respon
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Layanan</Label>
              <Select value={filterService || 'ALL'} onValueChange={(v) => { setFilterService(!v || v === 'ALL' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs font-medium">
                  <SelectValue placeholder="-- Semua Layanan --">
                    {filterService ? (services.find((s) => s.id === filterService)?.name || '-- Semua Layanan --') : '-- Semua Layanan --'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60">
                  <SelectItem value="ALL" className="rounded-xl text-xs font-bold text-slate-500">
                    -- Semua Layanan --
                  </SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="rounded-xl text-xs font-medium cursor-pointer">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Periode Survei</Label>
              <Select value={filterPeriod || 'ALL'} onValueChange={(v) => { setFilterPeriod(!v || v === 'ALL' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs font-medium">
                  <SelectValue placeholder="-- Semua Periode --">
                    {filterPeriod ? (
                      (() => {
                        const target = periods.find((p) => p.id === filterPeriod)
                        if (!target) return '-- Semua Periode --'
                        const today = new Date().toISOString().split('T')[0]
                        const tag = target.is_active ? '(Aktif)' : (target.end_date && target.end_date < today ? '(Selesai)' : '(Nonaktif)')
                        return `${target.label} ${tag}`
                      })()
                    ) : '-- Semua Periode --'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-60">
                  <SelectItem value="ALL" className="rounded-xl text-xs font-bold text-slate-500">
                    -- Semua Periode --
                  </SelectItem>
                  {periods.map((p) => {
                    const today = new Date().toISOString().split('T')[0]
                    const isPast = Boolean(p.end_date && p.end_date < today)
                    const tag = p.is_active ? '(Aktif)' : (isPast ? '(Selesai)' : '(Nonaktif)')
                    return (
                      <SelectItem key={p.id} value={p.id} className="rounded-xl text-xs font-medium cursor-pointer">
                        <span>{p.label}</span>{' '}
                        <span className={`font-bold ${
                          p.is_active ? 'text-emerald-600' : isPast ? 'text-slate-500' : 'text-amber-600'
                        }`}>
                          {tag}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Dari Tanggal</Label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="rounded-xl border-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Sampai Tanggal</Label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="rounded-xl border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-gray-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Cari nama atau kontak responden..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-white dark:bg-gray-900 border-slate-200 text-xs"
              />
            </div>

            {(filterService || filterPeriod || filterDateFrom || filterDateTo || searchQuery) && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl px-3 cursor-pointer"
              >
                <X className="size-3.5 mr-1" />
                Bersihkan Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-gray-800/60">
              <TableRow className="border-b border-slate-100 dark:border-gray-800">
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-6">Responden</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Layanan</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Periode</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Waktu Submit</TableHead>
                <TableHead className="w-32 text-right text-xs font-bold text-slate-700 uppercase tracking-wider pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <Loader2 className="size-8 animate-spin text-emerald-600 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                    <ClipboardList className="size-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Tidak ada data respon ditemukan</p>
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((r) => (
                  <TableRow key={r.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
                          {r.is_anonymous ? <UserX className="size-4 text-amber-600" /> : <UserCheck className="size-4 text-emerald-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {r.respondent_name || 'Responden'}
                            </span>
                            {r.is_anonymous && r.respondent_name !== 'Anonim' && (
                              <span className="inline-flex items-center text-[10px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-1.5 py-0.2 rounded-md">
                                (Anonim)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {r.respondent_contact && r.respondent_contact !== '-' ? r.respondent_contact : '-'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {r.services?.name || '-'}
                      </span>
                    </TableCell>

                    <TableCell className="py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {r.survey_periods?.label || '-'}
                      </span>
                    </TableCell>

                    <TableCell className="py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {new Date(r.submitted_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>

                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(r)}
                          className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
                          title="Lihat Detail Respon"
                        >
                          <Eye className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteDialog(r)}
                          className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all cursor-pointer"
                          title="Hapus Respon"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Enhanced Pagination Navigation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-gray-800/40">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Menampilkan <span className="text-slate-900 dark:text-white font-black">{totalCount > 0 ? (page - 1) * pageSize + 1 : 0}</span> - <span className="text-slate-900 dark:text-white font-black">{Math.min(page * pageSize, totalCount)}</span> dari <span className="text-slate-900 dark:text-white font-black">{totalCount}</span> Data Respon
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl text-xs font-bold gap-1 px-3 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                  <span>Sebelumnya</span>
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`size-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      pageNum === page
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-100 dark:ring-emerald-950'
                        : 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl text-xs font-bold gap-1 px-3 cursor-pointer"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Respon Modal Dialog (85% Full Width Layout) */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="!w-[85vw] !max-w-[85vw] max-h-[90vh] overflow-y-auto rounded-3xl p-0 border border-slate-200/80 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900">
          
          {/* Header Banner */}
          <div className="bg-slate-900 dark:bg-gray-950 border-b border-slate-800 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-inner shrink-0">
                  <FileText className="size-6 sm:size-7 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <span>Detail Rincian Respon Survei</span>
                  </DialogTitle>
                  <div className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span className="text-slate-500">ID:</span>
                      <span className="font-mono text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 text-xs">{selectedResponse?.id}</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Calendar className="size-3.5 text-slate-400" />
                      <span>{selectedResponse ? new Date(selectedResponse.submitted_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) : '-'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 font-bold rounded-xl text-xs gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="size-4" />
                  <span>Cetak Detail</span>
                </Button>
              </div>
            </div>
          </div>

          {detailLoading ? (
            <div className="flex flex-col justify-center items-center py-24 space-y-3">
              <Loader2 className="size-10 animate-spin text-emerald-600" />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Memuat rincian data respon...</span>
            </div>
          ) : selectedResponse && (
            <div className="p-6 sm:p-8 space-y-8 bg-slate-50/60 dark:bg-gray-950">
              
              {/* Info Utama Responden Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Layanan Dikunjungi</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <Building2 className="size-4" />
                    </div>
                  </div>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {selectedResponse.services?.name || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Periode Survei</span>
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <Calendar className="size-4" />
                    </div>
                  </div>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {selectedResponse.survey_periods?.label || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identitas Responden</span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                      <User className="size-4" />
                    </div>
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                      {selectedResponse.respondent_name || <span className="text-slate-400 italic">Anonim</span>}
                    </p>
                    {selectedResponse.respondent_contact && (
                      <p className="text-xs font-mono font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                        <Phone className="size-3 text-slate-400" />
                        <span>{selectedResponse.respondent_contact}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Identitas</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                      <ShieldCheck className="size-4" />
                    </div>
                  </div>
                  <div>
                    {selectedResponse.is_anonymous ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-slate-300 border border-slate-200 dark:border-gray-700">
                        <UserX className="size-3.5 text-slate-500" />
                        <span>Responden Anonim</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <UserCheck className="size-3.5 text-emerald-600" />
                        <span>Teridentifikasi</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Data Demografi Responden */}
              {detailDemographics.length > 0 && (
                <div className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200/80 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-gray-800">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      <FileText className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Rincian Demografi Responden
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Informasi latar belakang demografi pengisi survei</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {detailDemographics.map((d) => (
                      <div key={d.id} className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 space-y-1.5">
                        <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          {d.field?.label_id || d.field_id}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-slate-200/80 dark:border-gray-700">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Jawaban Penilaian Kualitas */}
              {detailAnswers.length > 0 && (
                <div className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200/80 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                        <ListTodo className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Jawaban Penilaian Unsur Pelayanan
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">Hasil skor nilai rating yang diberikan responden</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold px-3 py-1 rounded-lg text-xs border-emerald-200 dark:border-emerald-800">
                      {detailAnswers.length} Pertanyaan Evaluasi
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detailAnswers.map((a, idx) => (
                      <div key={a.id} className="flex flex-col justify-between gap-3 p-4 rounded-xl border border-slate-200/70 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 hover:border-emerald-300 transition-colors">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex size-5 items-center justify-center rounded bg-emerald-600 text-white text-[10px] font-black">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                              Pertanyaan #{idx + 1}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {a.question?.question_text_id || a.question_id}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-200/60 dark:border-gray-700 flex justify-end">
                          {getRatingBadge(a.rating_value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ulasan / Feedback Pesan & Saran */}
              {(selectedResponse.ipkp_feedback || selectedResponse.ipak_feedback) && (
                <div className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200/80 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-gray-800">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                      <MessageSquareText className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Catatan Saran &amp; Masukan Responden
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Kritik dan saran tertulis yang disampaikan oleh responden</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedResponse.ipkp_feedback && (
                      <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 space-y-2">
                        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-extrabold text-xs">
                          <Star className="size-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Saran Kualitas Pelayanan (IPKP)</span>
                        </div>
                        <p className="text-xs font-medium italic text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-gray-900 p-3.5 rounded-lg border border-blue-100 dark:border-blue-900/60">
                          &ldquo;{selectedResponse.ipkp_feedback}&rdquo;
                        </p>
                      </div>
                    )}

                    {selectedResponse.ipak_feedback && (
                      <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-extrabold text-xs">
                          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Saran Anti Korupsi (IPAK)</span>
                        </div>
                        <p className="text-xs font-medium italic text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-gray-900 p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900/60">
                          &ldquo;{selectedResponse.ipak_feedback}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          <DialogFooter className="p-4 sm:p-5 bg-slate-50 dark:bg-gray-900 border-t border-slate-200/80 dark:border-gray-800 flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
              SI-ARUS • Kantor Kementerian Agama Kabupaten Barito Utara
            </span>
            <div className="flex gap-2">
              <DialogClose render={<Button variant="outline" className="rounded-xl font-bold text-xs px-6">Tutup Detail</Button>} />
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog Modal */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent className="rounded-3xl p-6 border border-slate-200 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mx-auto sm:mx-0">
              <Trash2 className="size-6" />
            </div>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-900">
              Hapus Data Respon?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus data respon ini beserta seluruh rincian isian demografi dan jawabannya? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs px-5 cursor-pointer shadow-md shadow-rose-600/20" 
              onClick={confirmDelete} 
              disabled={deleting}
            >
              {deleting ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
