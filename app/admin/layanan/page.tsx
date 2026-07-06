'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Service } from '@/types'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const serviceSchema = z.object({
  name: z.string().min(1, 'Nama layanan wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type ServiceForm = z.infer<typeof serviceSchema>

function sluggify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------
// Sortable Table Row Component
// ---------------------------
function SortableRow({
  service,
  onEdit,
  onDeleteDialog,
}: {
  service: Service
  onEdit: (s: Service) => void
  onDeleteDialog: (s: Service) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'bg-emerald-50/50 dark:bg-emerald-900/20 shadow-md ring-1 ring-emerald-500/20' : ''}
    >
      <TableCell className="w-12 text-center">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-800 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4 text-gray-400" />
        </Button>
      </TableCell>
      <TableCell className="font-medium">{service.name}</TableCell>
      <TableCell className="text-muted-foreground">{service.slug}</TableCell>
      <TableCell className="max-w-xs truncate text-muted-foreground">
        {service.description || '-'}
      </TableCell>
      <TableCell>
        <Badge variant={service.is_active ? 'default' : 'secondary'}>
          {service.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(service)}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => onDeleteDialog(service)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

// ---------------------------
// Main Page Component
// ---------------------------
export default function AdminLayananPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', slug: '', description: '', is_active: true },
  })

  // eslint-disable-next-line
  const nameValue = watch('name')

  useEffect(() => {
    if (!editing) {
      setValue('slug', sluggify(nameValue))
    }
  }, [nameValue, setValue, editing])

  async function fetchServices() {
    const { data } = await supabase.from('services').select('*').order('sort_order')
    if (data) setServices(data as Service[])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchServices() }, [])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = services.findIndex((s) => s.id === active.id)
      const newIndex = services.findIndex((s) => s.id === over.id)

      const newServices = arrayMove(services, oldIndex, newIndex)
      
      // Optimistic update
      setServices(newServices)

      // Update backend in bulk
      const updates = newServices.map((service, index) => ({
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        is_active: service.is_active,
        sort_order: index, // New index becomes sort_order
        created_at: service.created_at
      }))

      const { error } = await supabase.from('services').upsert(updates)
      if (error) {
        toast.error('Gagal menyimpan urutan baru')
        fetchServices() // Revert on error
      } else {
        toast.success('Urutan layanan diperbarui', { duration: 2000 })
      }
    }
  }

  function openCreate() {
    setEditing(null)
    reset({ name: '', slug: '', description: '', is_active: true })
    setDialogOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    reset({
      name: service.name,
      slug: service.slug,
      description: service.description ?? '',
      is_active: service.is_active,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: ServiceForm) {
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('services').update(data).eq('id', editing.id)
      if (error) { toast.error('Gagal memperbarui layanan'); setSaving(false); return }
      toast.success('Layanan berhasil diperbarui')
    } else {
      // Set sort_order to the end
      const maxSort = services.length > 0 ? Math.max(...services.map(s => s.sort_order)) : -1
      const { error } = await supabase.from('services').insert({ ...data, sort_order: maxSort + 1 })
      if (error) { toast.error('Gagal menambah layanan'); setSaving(false); return }
      toast.success('Layanan berhasil ditambah')
    }
    setDialogOpen(false)
    setSaving(false)
    fetchServices()
  }

  async function confirmDelete() {
    if (!deleteDialog) return
    setDeleting(true)
    const { error } = await supabase.from('services').delete().eq('id', deleteDialog.id)
    if (error) { toast.error('Gagal menghapus layanan'); setDeleting(false); return }
    toast.success('Layanan berhasil dihapus')
    setDeleteDialog(null)
    setDeleting(false)
    fetchServices()
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
        <h1 className="text-2xl font-bold">Layanan</h1>
        <Button onClick={openCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" />
          Tambah Layanan
        </Button>
      </div>

      <Card className="border-0 shadow-lg shadow-gray-200/40 dark:shadow-black/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Daftar Layanan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center"></TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={services.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {services.map((s) => (
                    <SortableRow
                      key={s.id}
                      service={s}
                      onEdit={openEdit}
                      onDeleteDialog={setDeleteDialog}
                    />
                  ))}
                  {services.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        Belum ada layanan
                      </TableCell>
                    </TableRow>
                  )}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Ubah Layanan' : 'Tambah Layanan'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Ubah informasi layanan' : 'Masukkan informasi layanan baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Layanan</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register('slug')} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" rows={3} {...register('description')} />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Switch id="is_active" checked={watch('is_active')} onCheckedChange={(v) => setValue('is_active', v)} />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
            <DialogFooter className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <DialogClose render={<Button variant="outline">Batal</Button>} />
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {editing ? 'Simpan Perubahan' : 'Tambah Layanan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus layanan &ldquo;{deleteDialog?.name}&rdquo;? Tindakan ini tidak dapat dibatalkan.
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
  )
}
