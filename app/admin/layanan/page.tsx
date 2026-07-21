'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, GripVertical, FileText, Search, CheckCircle2, XCircle, AlertTriangle, Hash, Link2, AlignLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
      className={`group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
        isDragging ? 'bg-emerald-50/80 dark:bg-emerald-900/30 shadow-xl ring-2 ring-emerald-500/30 rounded-xl' : ''
      }`}
    >
      <TableCell className="w-12 text-center">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors touch-none"
          {...attributes}
          {...listeners}
          title="Geser untuk mengatur urutan"
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>

      <TableCell className="font-semibold text-slate-900 dark:text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 dark:bg-emerald-950/40 dark:border-emerald-900/40">
            <FileText className="size-4" />
          </div>
          <span className="text-sm font-bold tracking-tight">{service.name}</span>
        </div>
      </TableCell>

      <TableCell>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700">
          <Hash className="size-3 text-slate-400" />
          {service.slug}
        </span>
      </TableCell>

      <TableCell className="max-w-xs text-xs text-slate-500 dark:text-slate-400 truncate">
        {service.description || <span className="italic text-slate-400">Tidak ada deskripsi</span>}
      </TableCell>

      <TableCell>
        {service.is_active ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50">
            <XCircle className="size-3.5 text-rose-600" />
            Nonaktif
          </span>
        )}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex justify-end items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(service)}
            className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-100 transition-all cursor-pointer"
            title="Edit Layanan"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteDialog(service)}
            className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-100 transition-all cursor-pointer"
            title="Hapus Layanan"
          >
            <Trash2 className="size-3.5" />
          </button>
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
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <FileText className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Kelola Layanan PTSP
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              Kelola daftar layanan publik yang dapat dinilai oleh responden survei.
            </p>
          </div>
        </div>

        <Button 
          onClick={openCreate} 
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-5 py-6 shadow-md shadow-emerald-600/20 transition-all cursor-pointer w-full md:w-auto"
        >
          <Plus className="size-5" />
          <span>Tambah Layanan</span>
        </Button>
      </div>

      {/* Table Container Card */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        
        {/* Table Filter & Search Header */}
        <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Daftar Layanan</CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-bold px-2.5 py-0.5 rounded-full text-xs">
                {services.length} Total
              </Badge>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Cari layanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-xs focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-gray-800/60">
                <TableRow className="border-b border-slate-100 dark:border-gray-800">
                  <TableHead className="w-12 text-center"></TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Layanan</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL Slug</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Deskripsi</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="w-28 text-right text-xs font-bold text-slate-700 uppercase tracking-wider pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={filteredServices.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredServices.map((s) => (
                    <SortableRow
                      key={s.id}
                      service={s}
                      onEdit={openEdit}
                      onDeleteDialog={setDeleteDialog}
                    />
                  ))}
                  {filteredServices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                        <FileText className="size-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm font-medium">Tidak ada layanan ditemukan</p>
                      </TableCell>
                    </TableRow>
                  )}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>

      {/* Modern Add / Edit Service Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border border-slate-200/90 shadow-2xl">
          {/* Modal Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                <FileText className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-white">
                  {editing ? 'Ubah Informasi Layanan' : 'Tambah Layanan Baru'}
                </DialogTitle>

              </div>
            </div>
          </div>

          {/* Modal Form Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white dark:bg-gray-900">
            {/* Nama Layanan */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="size-3.5 text-emerald-600" />
                Nama Layanan
              </Label>
              <Input 
                id="name" 
                placeholder="Contoh: Permohonan Data dan Informasi" 
                {...register('name')} 
                className="rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs sm:text-sm font-medium"
              />
              {errors.name && <p className="text-xs font-medium text-rose-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Link2 className="size-3.5 text-emerald-600" />
                URL Slug
              </Label>
              <Input 
                id="slug" 
                placeholder="permohonan-data-dan-informasi" 
                {...register('slug')} 
                className="rounded-xl font-mono text-xs border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400">Otomatis dihasilkan berdasarkan nama layanan.</p>
              {errors.slug && <p className="text-xs font-medium text-rose-500 mt-1">{errors.slug.message}</p>}
            </div>

            {/* Deskripsi / Bidang Layanan */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <AlignLeft className="size-3.5 text-emerald-600" />
                <span>Bidang / Deskripsi Layanan</span>
              </Label>
              <Input 
                id="description" 
                placeholder="Contoh: Layanan Tata Usaha" 
                {...register('description')} 
                className="rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs sm:text-sm font-semibold"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 self-center mr-1">Pilihan Cepat:</span>
                {[
                  'Layanan Tata Usaha',
                  'Layanan Pendidikan Madrasah',
                  'Layanan Bimas Islam',
                  'Layanan Keagamaan',
                  'Layanan Penyelenggaraan Haji & Umrah',
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setValue('description', preset)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-all cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Switch Box */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40">
              <div className="space-y-0.5">
                <Label htmlFor="is_active" className="text-xs font-bold text-emerald-900 dark:text-emerald-300 cursor-pointer">
                  Status Layanan
                </Label>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  {watch('is_active') ? 'Layanan aktif & akan tampil di form survei publik' : 'Layanan nonaktif (tersembunyi dari publik)'}
                </p>
              </div>
              <Switch 
                id="is_active" 
                checked={watch('is_active')} 
                onCheckedChange={(v) => setValue('is_active', v)} 
              />
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-gray-800 flex justify-end gap-2">
              <DialogClose render={<Button variant="outline" className="rounded-xl font-bold text-xs">Batal</Button>} />
              <Button 
                type="submit" 
                disabled={saving} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {saving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : null}
                {editing ? 'Simpan Perubahan' : 'Tambah Layanan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modern Alert Delete Modal */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent className="rounded-3xl p-6 border border-slate-200 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mx-auto sm:mx-0">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-900">
              Hapus Layanan PTSP?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus layanan &ldquo;<strong className="text-slate-800">{deleteDialog?.name}</strong>&rdquo;? Data yang dihapus tidak dapat dikembalikan.
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
