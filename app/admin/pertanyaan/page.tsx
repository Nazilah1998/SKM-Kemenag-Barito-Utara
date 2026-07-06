'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import type { Question, Unsur, Service } from '@/types'

const questionSchema = z.object({
  unsur_id: z.string().min(1, 'Unsur wajib dipilih'),
  service_id: z.string().optional(),
  question_text_id: z.string().min(1, 'Teks pertanyaan (ID) wajib diisi'),
  question_text_en: z.string().min(1, 'Teks pertanyaan (EN) wajib diisi'),
  input_type: z.enum(['star_rating']),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
})

type QuestionForm = z.infer<typeof questionSchema>

export default function AdminPertanyaanPage() {
  const searchParams = useSearchParams()
  const selectedUnsurId = searchParams.get('unsur_id') || ''

  const [unsurList, setUnsurList] = useState<Unsur[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filterUnsur, setFilterUnsur] = useState(selectedUnsurId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      unsur_id: '', service_id: undefined, question_text_id: '', question_text_en: '',
      input_type: 'star_rating', is_active: true, sort_order: 0,
    },
  })

  async function fetchInitial() {
    const [unsurRes, servicesRes] = await Promise.all([
      supabase.from('unsur').select('*').order('sort_order'),
      supabase.from('services').select('*').order('sort_order'),
    ])
    if (unsurRes.data) setUnsurList(unsurRes.data as Unsur[])
    if (servicesRes.data) setServices(servicesRes.data as Service[])
  }

  async function fetchQuestions() {
    if (!filterUnsur) { setQuestions([]); setLoading(false); return }
    const { data } = await supabase.from('questions').select('*, unsur(*)').eq('unsur_id', filterUnsur).order('sort_order')
    if (data) setQuestions(data as unknown as Question[])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchInitial() }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setLoading(true); fetchQuestions() }, [filterUnsur])

  function openCreate() {
    setEditing(null)
    reset({
      unsur_id: filterUnsur, service_id: undefined, question_text_id: '', question_text_en: '',
      input_type: 'star_rating', is_active: true, sort_order: 0,
    })
    setDialogOpen(true)
  }

  function openEdit(q: Question) {
    setEditing(q)
    reset({
      unsur_id: q.unsur_id,
      service_id: q.service_id ?? undefined,
      question_text_id: q.question_text_id,
      question_text_en: q.question_text_en,
      input_type: q.input_type,
      is_active: q.is_active,
      sort_order: q.sort_order,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: QuestionForm) {
    setSaving(true)
    const payload = {
      ...data,
      service_id: data.service_id || null,
    }
    if (editing) {
      const { error } = await supabase.from('questions').update(payload).eq('id', editing.id)
      if (error) { toast.error('Gagal memperbarui pertanyaan'); setSaving(false); return }
      toast.success('Pertanyaan berhasil diperbarui')
    } else {
      const { error } = await supabase.from('questions').insert(payload)
      if (error) { toast.error('Gagal menambah pertanyaan'); setSaving(false); return }
      toast.success('Pertanyaan berhasil ditambah')
    }
    setDialogOpen(false)
    setSaving(false)
    fetchQuestions()
  }

  async function confirmDelete() {
    if (!deleteDialog) return
    setDeleting(true)
    const { error } = await supabase.from('questions').delete().eq('id', deleteDialog.id)
    if (error) { toast.error('Gagal menghapus pertanyaan'); setDeleting(false); return }
    toast.success('Pertanyaan berhasil dihapus')
    setDeleteDialog(null)
    setDeleting(false)
    fetchQuestions()
  }

  if (loading && !unsurList.length) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pertanyaan</h1>
        {filterUnsur && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Tambah Pertanyaan
          </Button>
        )}
      </div>

      <div className="mb-6 space-y-2">
        <Label>Pilih Unsur</Label>
        <Select value={filterUnsur} onValueChange={(v) => { if (v) { setFilterUnsur(v); setQuestions([]) } }}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="-- Pilih Unsur --" />
          </SelectTrigger>
          <SelectContent>
            {unsurList.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name} ({u.index_type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!filterUnsur ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Silakan pilih unsur terlebih dahulu untuk melihat pertanyaan
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pertanyaan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="max-w-xs">Teks (ID)</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Tipe Input</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Urutan</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-xs truncate font-medium">{q.question_text_id}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {q.service_id ? services.find((s) => s.id === q.service_id)?.name || '-' : 'Semua'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{q.input_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={q.is_active ? 'default' : 'secondary'}>
                        {q.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>{q.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(q)}>
                          <Pencil className="size-4" />
                        </Button>
                        <AlertDialog open={deleteDialog?.id === q.id} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="size-4" /></Button>} onClick={() => setDeleteDialog(q)} />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Pertanyaan</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus pertanyaan ini?
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
                {questions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Belum ada pertanyaan untuk unsur ini
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Ubah Pertanyaan' : 'Tambah Pertanyaan'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Ubah informasi pertanyaan' : 'Masukkan informasi pertanyaan baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question_text_id">Teks Pertanyaan (Indonesia)</Label>
              <Textarea id="question_text_id" rows={2} {...register('question_text_id')} />
              {errors.question_text_id && <p className="text-xs text-destructive">{errors.question_text_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="question_text_en">Teks Pertanyaan (English)</Label>
              <Textarea id="question_text_en" rows={2} {...register('question_text_en')} />
              {errors.question_text_en && <p className="text-xs text-destructive">{errors.question_text_en.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Input</Label>

                <Select value={watch('input_type')} onValueChange={(v) => v && setValue('input_type', v as 'star_rating')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="star_rating">Star Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Layanan (opsional)</Label>
                <Select value={watch('service_id') || ''} onValueChange={(v) => setValue('service_id', v || undefined)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Semua Layanan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Layanan</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="is_active" checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
              <div className="ml-auto space-y-1">
                <Label htmlFor="sort_order">Urutan</Label>
                <Input id="sort_order" type="number" className="w-20" {...register('sort_order', { valueAsNumber: true })} />
                {errors.sort_order && <p className="text-xs text-destructive">{errors.sort_order.message}</p>}
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
