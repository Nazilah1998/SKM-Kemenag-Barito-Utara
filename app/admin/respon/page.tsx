'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Eye, Trash2, Loader2, Search, X, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
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

  const supabase = useMemo(() => createClient(), [])

  const fetchInitial = useCallback(async () => {
    const [servicesRes, periodsRes] = await Promise.all([
      supabase.from('services').select('*').order('sort_order'),
      supabase.from('survey_periods').select('*').order('start_date', { ascending: false }),
    ])
    if (servicesRes.data) setServices(servicesRes.data as Service[])
    if (periodsRes.data) setPeriods(periodsRes.data as SurveyPeriod[])
  }, [supabase])

  const fetchResponses = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('responses').select('*, services(*), survey_periods(*)').order('submitted_at', { ascending: false })

    if (filterService) query = query.eq('service_id', filterService)
    if (filterPeriod) query = query.eq('period_id', filterPeriod)
    if (filterDateFrom) query = query.gte('submitted_at', filterDateFrom)
    if (filterDateTo) query = query.lte('submitted_at', filterDateTo)

    const { data } = await query
    if (data) setResponses(data as unknown as Response[])
    setLoading(false)
  }, [filterService, filterPeriod, filterDateFrom, filterDateTo, supabase])

  useEffect(() => {
    const init = async () => { await fetchInitial() }
    init()
  }, [fetchInitial])
  
  useEffect(() => {
    const fetch = async () => { await fetchResponses() }
    fetch()
  }, [fetchResponses])

  async function openDetail(response: Response) {
    setSelectedResponse(response)
    setDetailOpen(true)
    setDetailLoading(true)

    const [answersRes, demosRes, questionsRes, fieldsRes] = await Promise.all([
      supabase.from('response_answers').select('*').eq('response_id', response.id),
      supabase.from('response_demographics').select('*').eq('response_id', response.id),
      supabase.from('questions').select('*'),
      supabase.from('demographic_fields').select('*'),
    ])

    const questions = (questionsRes.data || []) as Question[]
    const fields = (fieldsRes.data || []) as DemographicField[]

    const answers = ((answersRes.data || []) as ResponseAnswer[]).map((a) => ({
      ...a,
      question: questions.find((q) => q.id === a.question_id),
    }))

    const demos = ((demosRes.data || []) as ResponseDemographic[]).map((d) => ({
      ...d,
      field: fields.find((f) => f.id === d.field_id),
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
    if (error) { toast.error('Gagal menghapus respon'); setDeleting(false); return }
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardList className="size-6 text-emerald-600" />
            Data Respon
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Lihat dan saring seluruh data jawaban survei dari masyarakat.</p>
        </div>
      </div>

      <Card className="border border-gray-100 dark:border-gray-800 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="size-4 text-gray-500" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>Layanan</Label>
              <Select value={filterService} onValueChange={(v) => setFilterService(v || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Periode</Label>
              <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Dari Tanggal</Label>
              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Sampai Tanggal</Label>
              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={fetchResponses}>
              <Search className="size-4" />
              Terapkan Filter
            </Button>
            <Button variant="ghost" size="sm" className="gap-1" onClick={clearFilters}>
              <X className="size-4" />
              Hapus Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/40 dark:shadow-black/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg">Daftar Respon</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Anonim</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Bahasa</TableHead>
                <TableHead>Verifikasi</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                    Memuat data respon...
                  </TableCell>
                </TableRow>
              ) : responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Tidak ada data respon ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                responses.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(r.submitted_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="font-medium">{(r as unknown as Record<string, {name?: string}>).services?.name || '-'}</TableCell>
                    <TableCell>
                      {r.is_anonymous ? <Badge variant="secondary">Anonim</Badge> : <Badge variant="default">Teridentifikasi</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.is_anonymous ? '-' : r.respondent_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.locale?.toUpperCase() || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.turnstile_verified ? (
                        <Badge variant="default" className="bg-emerald-600">Terverifikasi</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openDetail(r)}>
                          <Eye className="size-4" />
                        </Button>
                        <AlertDialog open={deleteDialog?.id === r.id} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="size-4" /></Button>} onClick={() => setDeleteDialog(r)} />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Respon?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus respon ini? Aksi ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmDelete}>
                                {deleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Respon</DialogTitle>
            <DialogDescription>Informasi lengkap respon survei</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-emerald-600" />
            </div>
          ) : selectedResponse && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Layanan</p>
                  <p className="font-medium">{selectedResponse.service?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Periode</p>
                  <p className="font-medium">{selectedResponse.period?.label || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Anonim</p>
                  <p className="font-medium">{selectedResponse.is_anonymous ? 'Ya' : 'Tidak'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="font-medium">{selectedResponse.respondent_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kontak</p>
                  <p className="font-medium">{selectedResponse.respondent_contact || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{new Date(selectedResponse.submitted_at).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {detailDemographics.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Data Demografi</h4>
                  <div className="space-y-1">
                    {detailDemographics.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                        <span className="text-muted-foreground">{d.field?.label_id || d.field_id}</span>
                        <span className="font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailAnswers.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Jawaban Penilaian</h4>
                  <div className="space-y-1">
                    {detailAnswers.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                        <span className="text-muted-foreground max-w-md truncate">
                          {a.question?.question_text_id || a.question_id}
                        </span>
                        <span className="ml-2 shrink-0 font-bold">{a.rating_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Tutup</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
