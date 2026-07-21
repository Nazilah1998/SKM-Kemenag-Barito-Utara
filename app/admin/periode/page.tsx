'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, Calendar, Search, CheckCircle2, AlertTriangle, Clock, Sparkles, CalendarDays, Check } from 'lucide-react'
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
import type { SurveyPeriod } from '@/types'
import { setActivePeriodAction } from './actions'

const periodSchema = z.object({
  period_type: z.enum(['triwulan', 'semester', 'tahunan']),
  label: z.string().min(1, 'Label wajib diisi'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
})

type PeriodForm = z.infer<typeof periodSchema>

export default function AdminPeriodePage() {
  const [periods, setPeriods] = useState<SurveyPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SurveyPeriod | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<SurveyPeriod | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [settingActive, setSettingActive] = useState(false)
  
  // Auto generator state
  const [autoYear, setAutoYear] = useState<number>(new Date().getFullYear())
  const [autoPart, setAutoPart] = useState<string>('1')

  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<PeriodForm>({
    resolver: zodResolver(periodSchema),
    defaultValues: { period_type: 'triwulan', label: '', start_date: '', end_date: '' },
  })

  const pt = useWatch({ control, name: 'period_type' })

  function handleAutoGenerate() {
    const year = autoYear
    const part = parseInt(autoPart)
    
    let label = ''
    let start = ''
    let end = ''
    
    if (pt === 'triwulan') {
      const romans = ['I', 'II', 'III', 'IV']
      label = `Triwulan ${romans[part - 1]} Tahun ${year}`
      if (part === 1) { start = `${year}-01-01`; end = `${year}-03-31` }
      if (part === 2) { start = `${year}-04-01`; end = `${year}-06-30` }
      if (part === 3) { start = `${year}-07-01`; end = `${year}-09-30` }
      if (part === 4) { start = `${year}-10-01`; end = `${year}-12-31` }
    } else if (pt === 'semester') {
      const romans = ['I', 'II']
      label = `Semester ${romans[part - 1]} Tahun ${year}`
      if (part === 1) { start = `${year}-01-01`; end = `${year}-06-30` }
      if (part === 2) { start = `${year}-07-01`; end = `${year}-12-31` }
    } else if (pt === 'tahunan') {
      label = `Tahun ${year}`
      start = `${year}-01-01`
      end = `${year}-12-31`
    }

    setValue('label', label)
    setValue('start_date', start)
    setValue('end_date', end)
    toast.success('Form terisi otomatis')
  }

  async function fetchPeriods() {
    const { data } = await supabase.from('survey_periods').select('*').order('start_date', { ascending: false })
    if (data) setPeriods(data as SurveyPeriod[])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    async function loadData() {
      const { data } = await supabase.from('survey_periods').select('*').order('start_date', { ascending: false })
      if (!ignore) {
        if (data) setPeriods(data as SurveyPeriod[])
        setLoading(false)
      }
    }
    loadData()
    return () => { ignore = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditing(null)
    reset({ period_type: 'triwulan', label: '', start_date: '', end_date: '' })
    setDialogOpen(true)
  }

  function openEdit(p: SurveyPeriod) {
    setEditing(p)
    reset({
      period_type: p.period_type,
      label: p.label,
      start_date: p.start_date,
      end_date: p.end_date,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: PeriodForm) {
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('survey_periods').update(data).eq('id', editing.id)
      if (error) { toast.error(error.message || 'Gagal memperbarui periode'); setSaving(false); return }
      toast.success('Periode survei berhasil diperbarui')
    } else {
      const { error } = await supabase.from('survey_periods').insert({ ...data, is_active: false })
      if (error) { toast.error(error.message || 'Gagal menambah periode'); setSaving(false); return }
      toast.success('Periode survei berhasil ditambah')
    }
    setDialogOpen(false)
    setSaving(false)
    fetchPeriods()
  }

  async function confirmDelete() {
    if (!deleteDialog) return
    setDeleting(true)
    const { error } = await supabase.from('survey_periods').delete().eq('id', deleteDialog.id)
    if (error) { 
      if (error.code === '23503') {
        toast.error('Gagal menghapus! Masih ada data respon yang terikat dengan periode ini.')
      } else {
        toast.error('Gagal menghapus periode: ' + error.message)
      }
      setDeleting(false) 
      return 
    }
    toast.success('Periode survei berhasil dihapus')
    setDeleteDialog(null)
    setDeleting(false)
    fetchPeriods()
  }

  async function setActive(id: string) {
    setSettingActive(true)
    const result = await setActivePeriodAction(id)
    if (!result.success) { 
      toast.error(result.error || 'Gagal mengaktifkan periode')
      setSettingActive(false)
      return 
    }
    toast.success('Periode aktif berhasil diubah')
    setSettingActive(false)
    fetchPeriods()
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'triwulan':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-lg">
            Triwulan
          </span>
        )
      case 'semester':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-1 rounded-lg">
            Semester
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-1 rounded-lg">
            Tahunan
          </span>
        )
    }
  }

  const filteredPeriods = periods.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.start_date.includes(searchQuery) ||
    p.end_date.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Header Banner Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <Calendar className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Periode Survei
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              Kelola rentang jadwal survei (Triwulan, Semester, Tahunan) dan tentukan periode yang aktif.
            </p>
          </div>
        </div>

        <Button 
          onClick={openCreate} 
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-5 py-6 shadow-md shadow-emerald-600/20 transition-all cursor-pointer w-full md:w-auto"
        >
          <Plus className="size-5" />
          <span>Tambah Periode Survei</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        
        {/* Table Header & Search */}
        <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Daftar Periode Survei</CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-xs">
                {periods.length} Periode
              </Badge>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Cari periode survei..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-gray-800/60">
              <TableRow className="border-b border-slate-100 dark:border-gray-800">
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-6">Label Periode</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tipe</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggal Mulai</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tanggal Selesai</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                <TableHead className="w-48 text-right text-xs font-bold text-slate-700 uppercase tracking-wider pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeriods.map((p) => (
                <TableRow key={p.id} className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${p.is_active ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''}`}>
                  
                  <TableCell className="pl-6 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex size-8 items-center justify-center rounded-xl ${p.is_active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <CalendarDays className="size-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{p.label}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getTypeBadge(p.period_type)}
                  </TableCell>

                  <TableCell className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                    {p.start_date}
                  </TableCell>

                  <TableCell className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                    {p.end_date}
                  </TableCell>

                  <TableCell>
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Sedang Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock className="size-3.5 text-slate-400" />
                        Nonaktif
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end items-center gap-1.5">
                      {!p.is_active && (
                        <button
                          type="button"
                          onClick={() => setActive(p.id)}
                          disabled={settingActive}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          title="Tetapkan sebagai periode aktif"
                        >
                          <Check className="size-3.5 text-emerald-600" />
                          <span>Aktifkan</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
                        title="Edit Periode"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteDialog(p)}
                        className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all cursor-pointer"
                        title="Hapus Periode"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredPeriods.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="size-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Tidak ada periode survei ditemukan</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modern Add / Edit Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border border-slate-200 shadow-2xl">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                <Calendar className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-white">
                  {editing ? 'Ubah Periode Survei' : 'Tambah Periode Survei Baru'}
                </DialogTitle>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 bg-white dark:bg-gray-900">
            {/* Tipe Periode */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Tipe Periode
              </Label>
              <Select value={pt} onValueChange={(v) => { if(v){ setValue('period_type', v as 'triwulan' | 'semester' | 'tahunan'); setAutoPart('1'); } }}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs sm:text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="triwulan" className="rounded-xl">Triwulan (3 Bulanan)</SelectItem>
                  <SelectItem value="semester" className="rounded-xl">Semester (6 Bulanan)</SelectItem>
                  <SelectItem value="tahunan" className="rounded-xl">Tahunan (1 Tahun)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Auto Generator Box */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <Sparkles className="size-4 text-blue-600" />
                <span>Pengisi Otomatis (Auto Generator)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">Tahun</Label>
                  <Input 
                    type="number" 
                    value={autoYear} 
                    onChange={(e) => setAutoYear(parseInt(e.target.value) || new Date().getFullYear())} 
                    className="rounded-xl bg-white text-xs font-bold h-9"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px] font-bold text-slate-600">
                    Pilihan {pt === 'triwulan' ? 'Triwulan' : pt === 'semester' ? 'Semester' : 'Tahun'}
                  </Label>
                  <div className="flex gap-2">
                    <Select value={autoPart} onValueChange={(v) => v && setAutoPart(v)}>
                      <SelectTrigger className="flex-1 rounded-xl bg-white text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {pt === 'triwulan' && (
                          <>
                            <SelectItem value="1">Triwulan I (Jan - Mar)</SelectItem>
                            <SelectItem value="2">Triwulan II (Apr - Jun)</SelectItem>
                            <SelectItem value="3">Triwulan III (Jul - Sep)</SelectItem>
                            <SelectItem value="4">Triwulan IV (Okt - Des)</SelectItem>
                          </>
                        )}
                        {pt === 'semester' && (
                          <>
                            <SelectItem value="1">Semester I (Jan - Jun)</SelectItem>
                            <SelectItem value="2">Semester II (Jul - Des)</SelectItem>
                          </>
                        )}
                        {pt === 'tahunan' && (
                          <>
                            <SelectItem value="1">Satu Tahun Penuh</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      onClick={handleAutoGenerate} 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs h-9 px-3 shrink-0 cursor-pointer shadow-xs"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Label Input */}
            <div className="space-y-1.5">
              <Label htmlFor="label" className="text-xs font-bold text-slate-700">Label Periode</Label>
              <Input id="label" placeholder="Contoh: Triwulan III Tahun 2026" {...register('label')} className="rounded-xl text-xs sm:text-sm border-slate-200" />
              {errors.label && <p className="text-xs font-medium text-rose-500 mt-1">{errors.label.message}</p>}
            </div>

            {/* Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start_date" className="text-xs font-bold text-slate-700">Tanggal Mulai</Label>
                <Input id="start_date" type="date" {...register('start_date')} className="rounded-xl text-xs border-slate-200" />
                {errors.start_date && <p className="text-xs font-medium text-rose-500 mt-1">{errors.start_date.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end_date" className="text-xs font-bold text-slate-700">Tanggal Selesai</Label>
                <Input id="end_date" type="date" {...register('end_date')} className="rounded-xl text-xs border-slate-200" />
                {errors.end_date && <p className="text-xs font-medium text-rose-500 mt-1">{errors.end_date.message}</p>}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <DialogClose render={<Button variant="outline" className="rounded-xl font-bold text-xs">Batal</Button>} />
              <Button 
                type="submit" 
                disabled={saving} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                {editing ? 'Simpan Perubahan' : 'Tambah Periode'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Delete Modal */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent className="rounded-3xl p-6 border border-slate-200 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mx-auto sm:mx-0">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-900">
              Hapus Periode Survei?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus periode &ldquo;<strong className="text-slate-800">{deleteDialog?.label}</strong>&rdquo;?
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
