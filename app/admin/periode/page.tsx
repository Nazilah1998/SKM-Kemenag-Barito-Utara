'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
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

  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PeriodForm>({
    resolver: zodResolver(periodSchema),
    defaultValues: { period_type: 'triwulan', label: '', start_date: '', end_date: '' },
  })

  async function fetchPeriods() {
    const { data } = await supabase.from('survey_periods').select('*').order('start_date', { ascending: false })
    if (data) setPeriods(data as SurveyPeriod[])
    setLoading(false)
  }

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
    if (error) { toast.error('Gagal menghapus periode'); setDeleting(false); return }
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Periode Survei</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Tambah Periode
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Periode Survei</CardTitle>
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
