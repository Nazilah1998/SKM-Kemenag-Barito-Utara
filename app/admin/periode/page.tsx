'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, Calendar } from 'lucide-react'
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
import type { SurveyPeriod } from '@/types'

const periodSchema = z.object({
  period_type: z.enum(['triwulan', 'semester', 'tahunan']),
  label: z.string().min(1, 'Label wajib diisi'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
})

type PeriodForm = z.infer<typeof periodSchema>

const periodTypeLabels: Record<string, string> = {
  triwulan: 'Triwulan',
  semester: 'Semester',
  tahunan: 'Tahunan',
}

export default function AdminPeriodePage() {
  const [periods, setPeriods] = useState<SurveyPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SurveyPeriod | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<SurveyPeriod | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [settingActive, setSettingActive] = useState(false)
  const [autoYear, setAutoYear] = useState<number>(new Date().getFullYear())
  const [autoPart, setAutoPart] = useState<string>('1')

  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PeriodForm>({
    resolver: zodResolver(periodSchema),
    defaultValues: { period_type: 'triwulan', label: '', start_date: '', end_date: '' },
  })

  const pt = watch('period_type')

  useEffect(() => {
    setAutoPart('1')
  }, [pt])

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
    toast.success('Form terisi otomatis berdasarkan pilihan')
  }

  async function fetchPeriods() {
    const { data } = await supabase.from('survey_periods').select('*').order('start_date', { ascending: false })
    if (data) setPeriods(data as SurveyPeriod[])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchPeriods() }, [])

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
      if (error) { toast.error('Gagal memperbarui periode'); setSaving(false); return }
      toast.success('Periode berhasil diperbarui')
    } else {
      const { error } = await supabase.from('survey_periods').insert({ ...data, is_active: false })
      if (error) { toast.error('Gagal menambah periode'); setSaving(false); return }
      toast.success('Periode berhasil ditambah')
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
      setDeleting(false); 
      return 
    }
    toast.success('Periode berhasil dihapus')
    setDeleteDialog(null)
    setDeleting(false)
    fetchPeriods()
  }

  async function setActive(id: string) {
    if (!confirm('Mengubah periode aktif akan menonaktifkan periode lainnya. Lanjutkan?')) return
    setSettingActive(true)
    await supabase.from('survey_periods').update({ is_active: false }).neq('id', '')
    const { error } = await supabase.from('survey_periods').update({ is_active: true }).eq('id', id)
    if (error) { toast.error('Gagal mengaktifkan periode'); setSettingActive(false); return }
    toast.success('Periode aktif berhasil diubah')
    setSettingActive(false)
    fetchPeriods()
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Calendar className="size-6 text-emerald-600" />
            Periode Survei
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Atur rentang waktu survei (Semester/Triwulan) yang aktif.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-500/20 w-full md:w-auto">
          <Plus className="size-4" />
          Tambah Periode
        </Button>
      </div>

      <Card className="border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/40 dark:shadow-black/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg">Daftar Periode Survei</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Tanggal Selesai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((p) => (
                <TableRow key={p.id} className={p.is_active ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}>
                  <TableCell className="font-medium">{p.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{periodTypeLabels[p.period_type]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.start_date}</TableCell>
                  <TableCell className="text-muted-foreground">{p.end_date}</TableCell>
                  <TableCell>
                    {p.is_active ? (
                      <Badge variant="default" className="bg-emerald-600">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!p.is_active && (
                        <Button variant="ghost" size="xs" onClick={() => setActive(p.id)} disabled={settingActive}>
                          Aktifkan
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog open={deleteDialog?.id === p.id} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="size-4" /></Button>} onClick={() => setDeleteDialog(p)} />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Periode</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus periode &ldquo;{p.label}&rdquo;?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/80" onClick={confirmDelete} disabled={deleting}>
                              {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {periods.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Belum ada periode survei
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Ubah Periode' : 'Tambah Periode'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Ubah informasi periode survei' : 'Masukkan informasi periode survei baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe Periode</Label>

              <Select value={watch('period_type')} onValueChange={(v) => v && setValue('period_type', v as 'triwulan' | 'semester' | 'tahunan')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="triwulan">Triwulan</SelectItem>
                  <SelectItem value="semester">Semester</SelectItem>
                  <SelectItem value="tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="space-y-2">
                <Label>Tahun</Label>
                <Input type="number" value={autoYear} onChange={(e) => setAutoYear(parseInt(e.target.value))} />
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label>Pilihan {pt === 'triwulan' ? 'Triwulan' : pt === 'semester' ? 'Semester' : 'Tahun'}</Label>
                <div className="flex gap-2">
                  <Select value={autoPart} onValueChange={(v) => v && setAutoPart(v)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {pt === 'triwulan' && <>
                        <SelectItem value="1">Triwulan I (Jan - Mar)</SelectItem>
                        <SelectItem value="2">Triwulan II (Apr - Jun)</SelectItem>
                        <SelectItem value="3">Triwulan III (Jul - Sep)</SelectItem>
                        <SelectItem value="4">Triwulan IV (Okt - Des)</SelectItem>
                      </>}
                      {pt === 'semester' && <>
                        <SelectItem value="1">Semester I (Jan - Jun)</SelectItem>
                        <SelectItem value="2">Semester II (Jul - Des)</SelectItem>
                      </>}
                      {pt === 'tahunan' && <>
                        <SelectItem value="1">Satu Tahun Penuh</SelectItem>
                      </>}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="secondary" onClick={handleAutoGenerate} className="shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50">
                    Isi Otomatis
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder="Contoh: Triwulan I 2025" {...register('label')} />
              {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Tanggal Mulai</Label>
                <Input id="start_date" type="date" {...register('start_date')} />
                {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Tanggal Selesai</Label>
                <Input id="end_date" type="date" {...register('end_date')} />
                {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Batal</Button>} />
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {editing ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
