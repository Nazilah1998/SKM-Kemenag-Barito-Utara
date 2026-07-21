'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Eye, Trash2, Loader2, Search, X, ClipboardList, UserCheck, UserX, ShieldCheck, ShieldAlert, Building2, Clock, Filter, MessageSquareText, ListTodo, Star, User } from 'lucide-react'
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
import type { Response, Service, SurveyPeriod, ResponseAnswer, ResponseDemographic, Question, DemographicField } from '@/types'

export default function AdminResponPage() {
  const [responses, setResponses] = useState<Response[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [periods, setPeriods] = useState<SurveyPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)
  const [detailAnswers, setDetailAnswers] = useState<(ResponseAnswer & { question?: Question })[]>([])
  const [detailDemographics, setDetailDemographics] = useState<(ResponseDemographic & { field?: DemographicField })[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Response | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [filterService, setFilterService] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const [cachedQuestions, setCachedQuestions] = useState<Question[]>([])
  const [cachedFields, setCachedFields] = useState<DemographicField[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)

  const supabase = useMemo(() => createClient(), [])

  const fetchInitial = useCallback(async () => {
    const [servicesRes, periodsRes, questionsRes, fieldsRes] = await Promise.all([
      supabase.from('services').select('*').order('sort_order'),
      supabase.from('survey_periods').select('*').order('start_date', { ascending: false }),
      supabase.from('questions').select('*'),
      supabase.from('demographic_fields').select('*'),
    ])
    if (servicesRes.data) setServices(servicesRes.data as Service[])
    if (periodsRes.data) setPeriods(periodsRes.data as SurveyPeriod[])
    if (questionsRes.data) setCachedQuestions(questionsRes.data as Question[])
    if (fieldsRes.data) setCachedFields(fieldsRes.data as DemographicField[])
  }, [supabase])

  const fetchResponses = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('responses').select('*, services(*), survey_periods(*)', { count: 'exact' }).order('submitted_at', { ascending: false })

    if (filterService) query = query.eq('service_id', filterService)
    if (filterPeriod) query = query.eq('period_id', filterPeriod)
    if (filterDateFrom) query = query.gte('submitted_at', filterDateFrom)
    if (filterDateTo) query = query.lte('submitted_at', filterDateTo)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, count } = await query
    if (data) setResponses(data as unknown as Response[])
    if (count !== null) setTotalCount(count)
    setLoading(false)
  }, [filterService, filterPeriod, filterDateFrom, filterDateTo, page, pageSize, supabase])

  useEffect(() => {
    let ignore = false
    const init = async () => {
      if (!ignore) await fetchInitial()
    }
    init()
    return () => { ignore = true }
  }, [fetchInitial])
  
  useEffect(() => {
    let ignore = false
    const fetch = async () => {
      if (!ignore) await fetchResponses()
    }
    fetch()
    return () => { ignore = true }
  }, [fetchResponses])

  async function openDetail(response: Response) {
    setSelectedResponse(response)
    setDetailOpen(true)
    setDetailLoading(true)

    const [answersRes, demosRes] = await Promise.all([
      supabase.from('response_answers').select('*').eq('response_id', response.id),
      supabase.from('response_demographics').select('*').eq('response_id', response.id),
    ])

    const answers = ((answersRes.data || []) as ResponseAnswer[]).map((a) => ({
      ...a,
      question: cachedQuestions.find((q) => q.id === a.question_id),
    }))

    const demos = ((demosRes.data || []) as ResponseDemographic[]).map((d) => ({
      ...d,
      field: cachedFields.find((f) => f.id === d.field_id),
    }))

    setDetailAnswers(answers)
    setDetailDemographics(demos)
    setDetailLoading(false)
  }

  async function confirmDelete() {
    if (!deleteDialog) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('response_demographics').delete().eq('response_id', deleteDialog.id)
    await supabase.from('response_answers').delete().eq('response_id', deleteDialog.id)
    const { error } = await supabase.from('responses').delete().eq('id', deleteDialog.id)
    if (error) { toast.error('Gagal menghapus respon: ' + error.message); setDeleting(false); return }
    toast.success('Respon berhasil dihapus')
    setDeleteDialog(null)
    setDeleting(false)
    fetchResponses()
  }

  function clearFilters() {
    setFilterService('')
    setFilterPeriod('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const getRatingBadge = (rating: number) => {
    switch (rating) {
      case 4:
        return <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs">4 - Sangat Baik</span>
      case 3:
        return <span className="px-2.5 py-1 rounded-xl bg-blue-100 text-blue-800 font-bold text-xs">3 - Baik</span>
      case 2:
        return <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs">2 - Kurang Baik</span>
      case 1:
        return <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs">1 - Buruk</span>
      default:
        return <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">{rating}</span>
    }
  }

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
          Total {responses.length} Respon
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
              <Select value={filterService} onValueChange={(v) => setFilterService(v || '')}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs font-medium">
                  <SelectValue placeholder="Semua Layanan" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="">Semua Layanan</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Periode Survei</Label>
              <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v || '')}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs font-medium">
                  <SelectValue placeholder="Semua Periode" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="">Semua Periode</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Dari Tanggal</Label>
              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Sampai Tanggal</Label>
              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="rounded-xl border-slate-200 text-xs" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="default" size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-4 cursor-pointer" onClick={fetchResponses}>
              <Search className="size-3.5" />
              Terapkan Filter
            </Button>
            {(filterService || filterPeriod || filterDateFrom || filterDateTo) && (
              <Button variant="outline" size="sm" className="gap-1.5 text-slate-600 font-bold rounded-xl text-xs px-4 cursor-pointer" onClick={clearFilters}>
                <X className="size-3.5" />
                Reset Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-4 sm:p-6">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Daftar Respon Masuk</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-gray-800/60">
              <TableRow className="border-b border-slate-100 dark:border-gray-800">
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-6">Tanggal Submit</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Layanan</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Identitas</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Responden</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bahasa</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Verifikasi</TableHead>
                <TableHead className="w-28 text-right text-xs font-bold text-slate-700 uppercase tracking-wider pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <Loader2 className="size-8 animate-spin text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium">Memuat data respon...</p>
                  </TableCell>
                </TableRow>
              ) : responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                    <ClipboardList className="size-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Tidak ada data respon ditemukan</p>
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((r) => (
                  <TableRow key={r.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    
                    <TableCell className="pl-6 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-slate-400" />
                        <span>{new Date(r.submitted_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </TableCell>

                    <TableCell className="font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{(r as unknown as Record<string, {name?: string}>).services?.name || '-'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {r.is_anonymous ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <UserX className="size-3 text-slate-400" />
                          Anonim
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <UserCheck className="size-3 text-blue-600" />
                          Teridentifikasi
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                      {r.respondent_name ? (
                        <span className="font-bold text-slate-900">{r.respondent_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Anonim</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {r.locale?.toUpperCase() || 'ID'}
                      </span>
                    </TableCell>

                    <TableCell>
                      {r.turnstile_verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="size-3 text-emerald-600" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldAlert className="size-3 text-amber-500" />
                          Tidak
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(r)}
                          className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-all cursor-pointer"
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

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div>
                Menampilkan <span className="font-bold text-slate-900 dark:text-white">{Math.min((page - 1) * pageSize + 1, totalCount)}</span> - <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * pageSize, totalCount)}</span> dari <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalCount.toLocaleString()}</span> respon
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="rounded-xl h-9 text-xs font-bold border-slate-200 dark:border-gray-700 cursor-pointer"
                >
                  Sebelumnya
                </Button>
                <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 font-extrabold text-slate-800 dark:text-slate-200">
                  Halaman {page} dari {Math.ceil(totalCount / pageSize) || 1}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(totalCount / pageSize)}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl h-9 text-xs font-bold border-slate-200 dark:border-gray-700 cursor-pointer"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern Detail Respon Modal Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border border-slate-200 shadow-2xl">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-extrabold text-white">
                    Detail Respon Survei
                  </DialogTitle>
                  <p className="text-xs text-emerald-100 font-medium">
                    ID Respon: <span className="font-mono text-white">{selectedResponse?.id.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>

              {selectedResponse?.turnstile_verified && (
                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md">
                  <ShieldCheck className="size-3.5 text-emerald-300" />
                  Bot Checked
                </span>
              )}
            </div>
          </div>

          {detailLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-emerald-600" />
            </div>
          ) : selectedResponse && (
            <div className="p-6 space-y-6 bg-white dark:bg-gray-900">
              
              {/* Info Utama Responden */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Layanan Dikunjungi</p>
                  <p className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {selectedResponse.services?.name || '-'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Periode Survei</p>
                  <p className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {selectedResponse.survey_periods?.label || '-'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tanggal Submit</p>
                  <p className="font-bold text-xs text-slate-900 dark:text-white leading-snug font-mono">
                    {new Date(selectedResponse.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nama Responden</p>
                  <p className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {selectedResponse.respondent_name || <span className="text-slate-400 italic">Anonim</span>}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Kontak / HP</p>
                  <p className="font-bold text-xs text-slate-900 dark:text-white leading-snug font-mono">
                    {selectedResponse.respondent_contact || '-'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Status Anonim</p>
                  <p className="font-bold text-xs leading-snug">
                    {selectedResponse.is_anonymous ? (
                      <span className="text-slate-600 font-semibold">Ya (Disamarkan)</span>
                    ) : (
                      <span className="text-blue-600 font-bold">Tidak (Teridentifikasi)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Data Demografi Responden */}
              {detailDemographics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User className="size-4 text-emerald-600" />
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Identitas Demografi Responden
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {detailDemographics.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white dark:bg-slate-800 shadow-2xs">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {d.field?.label_id || d.field_id}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Jawaban Penilaian Kualitas */}
              {detailAnswers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <ListTodo className="size-4 text-emerald-600" />
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Jawaban Penilaian Unsur Pelayanan ({detailAnswers.length})
                      </h4>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {detailAnswers.map((a, idx) => (
                      <div key={a.id} className="flex items-start justify-between gap-4 p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 dark:bg-slate-800/40">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400">Pertanyaan #{idx + 1}</span>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                            {a.question?.question_text_id || a.question_id}
                          </p>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          {getRatingBadge(a.rating_value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ulasan / Feedback Pesan & Saran */}
              {(selectedResponse.ipkp_feedback || selectedResponse.ipak_feedback) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <MessageSquareText className="size-4 text-emerald-600" />
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Catatan Saran &amp; Kritik Responden
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedResponse.ipkp_feedback && (
                      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                          <Star className="size-3.5 text-blue-600" />
                          <span>Kualitas Pelayanan (IPKP)</span>
                        </div>
                        <p className="text-xs italic text-slate-800 leading-relaxed bg-white/80 p-3 rounded-xl border border-blue-100">
                          &ldquo;{selectedResponse.ipkp_feedback}&rdquo;
                        </p>
                      </div>
                    )}

                    {selectedResponse.ipak_feedback && (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                          <ShieldCheck className="size-3.5 text-emerald-600" />
                          <span>Persepsi Anti Korupsi (IPAK)</span>
                        </div>
                        <p className="text-xs italic text-slate-800 leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100">
                          &ldquo;{selectedResponse.ipak_feedback}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          <DialogFooter className="p-4 bg-slate-50 dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700">
            <DialogClose render={<Button variant="outline" className="rounded-xl font-bold text-xs">Tutup Detail</Button>} />
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
