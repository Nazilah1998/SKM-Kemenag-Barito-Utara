'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ListChecks, Loader2 } from 'lucide-react'
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
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Unsur } from '@/types'

const unsurSchema = z.object({
  name: z.string().min(1, 'Nama unsur wajib diisi'),
  index_type: z.enum(['IPKP', 'IPAK']),
  description: z.string().optional(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
})

type UnsurForm = z.infer<typeof unsurSchema>

export default function AdminUnsurPage() {
  const router = useRouter()
  const [unsurList, setUnsurList] = useState<Unsur[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Semua')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Unsur | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Unsur | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UnsurForm>({
    resolver: zodResolver(unsurSchema),
    defaultValues: { name: '', index_type: 'IPKP', description: '', is_active: true, sort_order: 0 },
  })

  async function fetchUnsur() {
    const { data } = await supabase.from('unsur').select('*').order('sort_order')
    if (data) setUnsurList(data as Unsur[])
    setLoading(false)
  }

  useEffect(() => { fetchUnsur() }, [])

  function openCreate() {
    setEditing(null)
    reset({ name: '', index_type: 'IPKP', description: '', is_active: true, sort_order: 0 })
    setDialogOpen(true)
  }

  function openEdit(unsur: Unsur) {
    setEditing(unsur)
    reset({
      name: unsur.name,
      index_type: unsur.index_type,
      description: unsur.description ?? '',
      is_active: unsur.is_active,
      sort_order: unsur.sort_order,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: UnsurForm) {
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('unsur').update(data).eq('id', editing.id)
      if (error) { toast.error('Gagal memperbarui unsur'); setSaving(false); return }
      toast.success('Unsur berhasil diperbarui')
    } else {
      const { error } = await supabase.from('unsur').insert(data)
      if (error) { toast.error('Gagal menambah unsur'); setSaving(false); return }
      toast.success('Unsur berhasil ditambah')
    }
    setDialogOpen(false)
    setSaving(false)
    fetchUnsur()
  }

  async function confirmDelete() {
    if (!deleteDialog) return
    setDeleting(true)
    const { error } = await supabase.from('unsur').delete().eq('id', deleteDialog.id)
    if (error) { toast.error('Gagal menghapus unsur'); setDeleting(false); return }
    toast.success('Unsur berhasil dihapus')
    setDeleteDialog(null)
    setDeleting(false)
    fetchUnsur()
  }

  const filtered = filter === 'Semua' ? unsurList : unsurList.filter((u) => u.index_type === filter)

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
        <h1 className="text-2xl font-bold">Unsur & Pertanyaan</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Tambah Unsur
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="Semua">Semua</TabsTrigger>
          <TabsTrigger value="IPKP">IPKP</TabsTrigger>
          <TabsTrigger value="IPAK">IPAK</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Unsur Penilaian</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe Index</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead className="w-32 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>
                    <Badge variant={u.index_type === 'IPKP' ? 'default' : 'secondary'} className={u.index_type === 'IPKP' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'}>
                      {u.index_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {u.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? 'default' : 'secondary'}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/admin/pertanyaan?unsur_id=${u.id}`)}>
                        <ListChecks className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(u)}>
                        <Pencil className="size-4" />
                      </Button>
                      <AlertDialog open={deleteDialog?.id === u.id} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="size-4" /></Button>} onClick={() => setDeleteDialog(u)} />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Unsur</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus unsur &ldquo;{u.name}&rdquo;? Pertanyaan terkait juga akan dihapus.
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
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Belum ada unsur
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
            <DialogTitle>{editing ? 'Ubah Unsur' : 'Tambah Unsur'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Ubah informasi unsur penilaian' : 'Masukkan informasi unsur penilaian baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Unsur</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipe Index</Label>
              <Select value={watch('index_type')} onValueChange={(v) => v && setValue('index_type', v as 'IPKP' | 'IPAK')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IPKP">IPKP</SelectItem>
                  <SelectItem value="IPAK">IPAK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" rows={3} {...register('description')} />
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
