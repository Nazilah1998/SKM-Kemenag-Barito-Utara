'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ListChecks, Loader2, Layers, Search, CheckCircle2, XCircle, AlertTriangle, AlignLeft, Hash, ShieldCheck, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('Semua')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Unsur | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Unsur | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<UnsurForm>({
    resolver: zodResolver(unsurSchema),
    defaultValues: { name: '', index_type: 'IPKP', description: '', is_active: true, sort_order: 0 },
  })

  const indexType = useWatch({ control, name: 'index_type' })
  const isActive = useWatch({ control, name: 'is_active' })

  const fetchUnsur = useCallback(async () => {
    const { data } = await supabase.from('unsur').select('*').order('sort_order')
    if (data) setUnsurList(data as Unsur[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let ignore = false
    async function loadData() {
      const { data } = await supabase.from('unsur').select('*').order('sort_order')
      if (ignore) return
      if (data) setUnsurList(data as Unsur[])
      setLoading(false)
    }
    loadData()
    return () => { ignore = true }
  }, [supabase])

  function openCreate() {
    setEditing(null)
    const nextSort = unsurList.length > 0 ? Math.max(...unsurList.map(u => u.sort_order)) + 1 : 1
    reset({ name: '', index_type: 'IPKP', description: '', is_active: true, sort_order: nextSort })
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

  const filteredList = unsurList.filter((u) => {
    const matchesTab = filter === 'Semua' || u.index_type === filter
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.description && u.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTab && matchesSearch
  })

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
            <Layers className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Unsur Penilaian Evaluasi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              Kelola daftar unsur penilaian kuesioner indikator IPKP & IPAK.
            </p>
          </div>
        </div>

        <Button 
          onClick={openCreate} 
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-5 py-6 shadow-md shadow-emerald-600/20 transition-all cursor-pointer w-full md:w-auto"
        >
          <Plus className="size-5" />
          <span>Tambah Unsur</span>
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        
        {/* Filter Tabs & Search Header */}
        <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
              <TabsList className="bg-slate-200/60 dark:bg-gray-800 p-1 rounded-2xl">
                <TabsTrigger value="Semua" className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm">
                  Semua ({unsurList.length})
                </TabsTrigger>
                <TabsTrigger value="IPKP" className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm">
                  IPKP ({unsurList.filter(u => u.index_type === 'IPKP').length})
                </TabsTrigger>
                <TabsTrigger value="IPAK" className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-800 data-[state=active]:shadow-sm">
                  IPAK ({unsurList.filter(u => u.index_type === 'IPAK').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Cari unsur penilaian..."
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
                <TableHead className="w-16 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">No</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Unsur Penilaian</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tipe Indeks</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Deskripsi</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                <TableHead className="w-56 text-right text-xs font-bold text-slate-700 uppercase tracking-wider pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.map((u, idx) => (
                <TableRow key={u.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="text-center font-mono text-xs font-bold text-slate-400">
                    {u.sort_order || idx + 1}
                  </TableCell>
                  
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${
                        u.index_type === 'IPKP' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                      }`}>
                        {u.index_type === 'IPKP' ? <Activity className="size-4" /> : <ShieldCheck className="size-4" />}
                      </div>
                      <span className="text-sm font-bold tracking-tight">{u.name}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {u.index_type === 'IPKP' ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                        <Activity className="size-3 text-emerald-600" />
                        IPKP (Kualitas)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-1 rounded-lg">
                        <ShieldCheck className="size-3 text-indigo-600" />
                        IPAK (Anti Korupsi)
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-xs text-xs text-slate-500 dark:text-slate-400 truncate">
                    {u.description || <span className="italic text-slate-400">Tidak ada deskripsi</span>}
                  </TableCell>

                  <TableCell>
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                        <XCircle className="size-3.5 text-rose-600" />
                        Nonaktif
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* Direct Question Management Button */}
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/pertanyaan?unsur_id=${u.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                        title="Kelola Pertanyaan Unsur Ini"
                      >
                        <ListChecks className="size-3.5 text-emerald-600" />
                        <span>Pertanyaan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-all cursor-pointer"
                        title="Edit Unsur"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteDialog(u)}
                        className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all cursor-pointer"
                        title="Hapus Unsur"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-slate-400">
                    <Layers className="size-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Tidak ada unsur penilaian ditemukan</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modern Add / Edit Unsur Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border border-slate-200/90 shadow-2xl">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                <Layers className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-white">
                  {editing ? 'Ubah Unsur Penilaian' : 'Tambah Unsur Penilaian Baru'}
                </DialogTitle>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white dark:bg-gray-900">
            {/* Nama Unsur */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="size-3.5 text-emerald-600" />
                Nama Unsur
              </Label>
              <Input 
                id="name" 
                placeholder="Contoh: Persyaratan Layanan" 
                {...register('name')} 
                className="rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-medium"
              />
              {errors.name && <p className="text-xs font-medium text-rose-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Tipe Index */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Activity className="size-3.5 text-emerald-600" />
                Tipe Indeks Evaluasi
              </Label>
              <Select value={indexType} onValueChange={(v) => v && setValue('index_type', v as 'IPKP' | 'IPAK')}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs sm:text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl p-1.5">
                  <SelectItem value="IPKP" className="rounded-xl cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">IPKP</span>
                      <span className="text-slate-400 text-xs">- Indeks Kualitas Pelayanan</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="IPAK" className="rounded-xl cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-700">IPAK</span>
                      <span className="text-slate-400 text-xs">- Indeks Anti Korupsi</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <AlignLeft className="size-3.5 text-emerald-600" />
                Deskripsi Unsur
              </Label>
              <Textarea 
                id="description" 
                rows={3} 
                placeholder="Penjelasan indikator unsur ini..." 
                {...register('description')} 
                className="rounded-xl border-slate-200 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm"
              />
            </div>

            {/* Row: Status & Urutan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-xs font-bold text-emerald-900 cursor-pointer">
                    Status Aktif
                  </Label>
                  <p className="text-[10px] text-emerald-700">Tampil di kuesioner</p>
                </div>
                <Switch 
                  id="is_active" 
                  checked={isActive} 
                  onCheckedChange={(v) => setValue('is_active', v)} 
                />
              </div>

              <div className="space-y-1 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <Label htmlFor="sort_order" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Hash className="size-3 text-slate-400" />
                  Urutan Tampil
                </Label>
                <Input 
                  id="sort_order" 
                  type="number" 
                  {...register('sort_order', { valueAsNumber: true })} 
                  className="rounded-xl border-slate-200 text-xs font-bold"
                />
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
                {editing ? 'Simpan Perubahan' : 'Tambah Unsur'}
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
              Hapus Unsur Penilaian?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus unsur &ldquo;<strong className="text-slate-800">{deleteDialog?.name}</strong>&rdquo;? Seluruh butir pertanyaan kuesioner terkait juga akan terhapus.
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
