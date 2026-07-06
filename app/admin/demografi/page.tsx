'use client'

import React, { useEffect, useState, Fragment } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, GripVertical, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { DemographicField, DemographicOption } from '@/types'

const fieldSchema = z.object({
  field_key: z.string().min(1, 'Field key wajib diisi'),
  label_id: z.string().min(1, 'Label (ID) wajib diisi'),
  label_en: z.string().min(1, 'Label (EN) wajib diisi'),
  field_type: z.enum(['select', 'text', 'number']),
  is_required: z.boolean(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

type FieldForm = z.infer<typeof fieldSchema>

export default function AdminDemografiPage() {
  const [fields, setFields] = useState<DemographicField[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DemographicField | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<DemographicField | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [options, setOptions] = useState<DemographicOption[]>([])

  const supabase = createClient()

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FieldForm>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      field_key: '', label_id: '', label_en: '', field_type: 'text',
      is_required: false, sort_order: 0, is_active: true,
    },
  })

  async function fetchFields() {
    const { data } = await supabase.from('demographic_fields').select('*, demographic_options(*)').order('sort_order')
    if (data) setFields(data as unknown as DemographicField[])
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    ;(async () => {
      const { data } = await supabase.from('demographic_fields').select('*, demographic_options(*)').order('sort_order')
      if (!ignore) {
        if (data) setFields(data as unknown as DemographicField[])
        setLoading(false)
      }
    })()
    return () => { ignore = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    setEditing(null)
    reset({
      field_key: '', label_id: '', label_en: '', field_type: 'text',
      is_required: false, sort_order: 0, is_active: true,
    })
    setDialogOpen(true)
  }

  function openEdit(field: DemographicField) {
    setEditing(field)
    reset({
      field_key: field.field_key,
      label_id: field.label_id,
      label_en: field.label_en,
      field_type: field.field_type,
      is_required: field.is_required,
      sort_order: field.sort_order,
      is_active: field.is_active,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: FieldForm) {
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('demographic_fields').update(data).eq('id', editing.id)
      if (error) { toast.error('Gagal memperbarui field'); setSaving(false); return }
      toast.success('Field berhasil diperbarui')
    } else {
      const { error } = await supabase.from('demographic_fields').insert(data)
      if (error) { toast.error('Gagal menambah field'); setSaving(false); return }
      toast.success('Field berhasil ditambah')
    }
    setDialogOpen(false)
    setSaving(false)
    fetchFields()
  }

  async function confirmDelete() {
    if (!deleteDialog) return
    setDeleting(true)
    const { error } = await supabase.from('demographic_fields').delete().eq('id', deleteDialog.id)
    if (error) { toast.error('Gagal menghapus field'); setDeleting(false); return }
    toast.success('Field berhasil dihapus')
    setDeleteDialog(null)
    setDeleting(false)
    fetchFields()
  }

  async function loadOptions(fieldId: string) {
    if (expandedField === fieldId) {
      setExpandedField(null)
      return
    }
    const { data } = await supabase.from('demographic_options').select('*').eq('field_id', fieldId).order('sort_order')
    if (data) setOptions(data as DemographicOption[])
    setExpandedField(fieldId)
  }

  async function addOption(fieldId: string) {
    const value = prompt('Nilai (value):')
    if (!value) return
    const labelId = prompt('Label (Indonesia):')
    if (!labelId) return
    const labelEn = prompt('Label (English):')
    if (!labelEn) return
    const { error } = await supabase.from('demographic_options').insert({
      field_id: fieldId,
      value,
      label_id: labelId,
      label_en: labelEn,
      sort_order: options.length,
    })
    if (error) { toast.error('Gagal menambah opsi'); return }
    toast.success('Opsi berhasil ditambah')
    loadOptions(fieldId)
  }

  async function deleteOption(optionId: string, fieldId: string) {
    const { error } = await supabase.from('demographic_options').delete().eq('id', optionId)
    if (error) { toast.error('Gagal menghapus opsi'); return }
    toast.success('Opsi berhasil dihapus')
    loadOptions(fieldId)
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
            <Users className="size-6 text-emerald-600" />
            Field Demografi
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Kelola pertanyaan demografi responden seperti usia, pendidikan, dan pekerjaan.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm shadow-emerald-500/20 w-full md:w-auto">
          <Plus className="size-4" />
          Tambah Field
        </Button>
      </div>

      <Card className="border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/40 dark:shadow-black/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-lg">Daftar Field Demografi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Label (ID)</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Wajib</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urutan</TableHead>
                <TableHead className="w-32 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((f) => (
                <Fragment key={f.id}>
                  <TableRow>
                    <TableCell className="font-mono text-sm">{f.field_key}</TableCell>
                    <TableCell>{f.label_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{f.field_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {f.is_required ? <Badge variant="default">Ya</Badge> : <Badge variant="secondary">Tidak</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.is_active ? 'default' : 'secondary'}>
                        {f.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell>{f.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {f.field_type === 'select' && (
                          <Button variant="ghost" size="icon-sm" onClick={() => loadOptions(f.id)}>
                            <GripVertical className="size-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(f)}>
                          <Pencil className="size-4" />
                        </Button>
                        <AlertDialog open={deleteDialog?.id === f.id} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" className="text-destructive"><Trash2 className="size-4" /></Button>} onClick={() => setDeleteDialog(f)} />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Field</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus field &ldquo;{f.label_id}&rdquo;?
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
                  {expandedField === f.id && (
                    <TableRow key={`${f.id}-options`}>
                      <TableCell colSpan={7} className="bg-muted/30 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Opsi untuk &ldquo;{f.label_id}&rdquo;</h4>
                            <Button size="xs" variant="outline" onClick={() => addOption(f.id)}>
                              <Plus className="size-3" />
                              Tambah Opsi
                            </Button>
                          </div>
                          {options.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada opsi</p>
                          ) : (
                            <div className="space-y-1">
                              {options.map((opt) => (
                                <div key={opt.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-1.5 text-sm">
                                  <span className="font-mono text-xs">{opt.value}</span>
                                  <span className="text-muted-foreground">{opt.label_id}</span>
                                  <span className="text-muted-foreground">{opt.label_en}</span>
                                  <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => deleteOption(opt.id, f.id)}>
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Belum ada field demografi
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
            <DialogTitle>{editing ? 'Ubah Field' : 'Tambah Field'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Ubah informasi field demografi' : 'Masukkan informasi field demografi baru'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field_key">Field Key</Label>
              <Input id="field_key" placeholder="contoh: usia, pendidikan" {...register('field_key')} />
              {errors.field_key && <p className="text-xs text-destructive">{errors.field_key.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="label_id">Label (Indonesia)</Label>
                <Input id="label_id" {...register('label_id')} />
                {errors.label_id && <p className="text-xs text-destructive">{errors.label_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="label_en">Label (English)</Label>
                <Input id="label_en" {...register('label_en')} />
                {errors.label_en && <p className="text-xs text-destructive">{errors.label_en.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipe Field</Label>
              <Controller
                name="field_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="select">Select (Pilihan)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Controller
                  name="is_required"
                  control={control}
                  render={({ field }) => (
                    <Switch id="is_required" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
                <Label htmlFor="is_required">Wajib diisi</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
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
