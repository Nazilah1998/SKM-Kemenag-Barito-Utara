'use client'

import React, { useEffect, useState } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, GripVertical, Users, Search, CheckCircle2, XCircle, AlertTriangle, Key, Type, Hash, ListFilter, CheckSquare, ToggleLeft, AlignLeft, Sparkles } from 'lucide-react'
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
  Dialog, DialogContent, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { DemographicField, DemographicOption } from '@/types'

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

const fieldSchema = z.object({
  field_key: z.string().min(1, 'Field key wajib diisi'),
  label_id: z.string().min(1, 'Label (ID) wajib diisi'),
  label_en: z.string().min(1, 'Label (EN) wajib diisi'),
  field_type: z.enum(['select', 'checkbox', 'toggle', 'text', 'number']),
  is_required: z.boolean(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

type FieldForm = z.infer<typeof fieldSchema>

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'select':
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-lg">
          <ListFilter className="size-3 text-blue-600" />
          Dropdown (Pilihan)
        </span>
      )
    case 'checkbox':
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-1 rounded-lg">
          <CheckSquare className="size-3 text-purple-600" />
          Checkbox (Ceklis)
        </span>
      )
    case 'toggle':
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-1 rounded-lg">
          <ToggleLeft className="size-3 text-amber-600" />
          Toggle (Ya/Tidak)
        </span>
      )
    case 'number':
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg">
          <Hash className="size-3 text-slate-500" />
          Number (Angka)
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
          <AlignLeft className="size-3 text-emerald-600" />
          Text (Teks)
        </span>
      )
  }
}

function SortableFieldRow({
  f,
  onOpenOptionsModal,
  onEdit,
  onDeleteDialog,
}: {
  f: DemographicField
  onOpenOptionsModal: (field: DemographicField) => void
  onEdit: (field: DemographicField) => void
  onDeleteDialog: (field: DemographicField) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: f.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    position: 'relative' as const,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
        isDragging ? 'bg-emerald-50/80 dark:bg-emerald-950/30 shadow-xl ring-2 ring-emerald-500/30 rounded-xl' : ''
      }`}
    >
      <TableCell className="w-12 text-center">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing transition-colors inline-flex items-center justify-center"
          title="Geser untuk mengatur urutan"
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>

      <TableCell className="text-center font-mono text-xs font-bold text-slate-400">
        {f.sort_order}
      </TableCell>

      <TableCell>
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200/80">
          <Key className="size-3 text-slate-400" />
          {f.field_key}
        </span>
      </TableCell>

      <TableCell className="font-semibold text-slate-900 dark:text-white">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 dark:text-white">{f.label_id}</span>
          <span className="text-[11px] text-slate-400 italic">{f.label_en}</span>
        </div>
      </TableCell>

      <TableCell>
        {getTypeBadge(f.field_type)}
      </TableCell>

      <TableCell>
        {f.is_required ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
            WAJIB
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            OPSIONAL
          </span>
        )}
      </TableCell>

      <TableCell>
        {f.is_active ? (
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

      <TableCell className="text-right pr-6">
        <div className="flex justify-end items-center gap-1.5">
          {(f.field_type === 'select' || f.field_type === 'checkbox' || f.field_type === 'toggle') && (
            <button
              type="button"
              onClick={() => onOpenOptionsModal(f)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs transition-all cursor-pointer shadow-xs"
              title="Kelola Opsi Pilihan"
            >
              <GripVertical className="size-3.5 text-blue-600" />
              <span>Opsi ({f.demographic_options?.length || 0})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(f)}
            className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
            title="Edit Field"
          >
            <Pencil className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteDialog(f)}
            className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all cursor-pointer"
            title="Hapus Field"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function SortableOptionItem({
  opt,
  onEditOption,
  onDeleteOption,
}: {
  opt: DemographicOption
  onEditOption: (opt: DemographicOption) => void
  onDeleteOption: (optionId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opt.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    position: 'relative' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs hover:bg-slate-100/80 transition-colors ${
        isDragging ? 'bg-blue-100 border-blue-300 shadow-lg ring-2 ring-blue-500/30' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing transition-colors inline-flex items-center justify-center"
          title="Geser untuk mengatur urutan"
        >
          <GripVertical className="size-4" />
        </button>

        <span className="font-mono text-xs font-bold bg-white text-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
          {opt.value}
        </span>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{opt.label_id}</span>
          <span className="text-[10px] text-slate-400 italic">{opt.label_en}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEditOption(opt)}
          className="flex size-7 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
          title="Edit Opsi"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteOption(opt.id)}
          className="flex size-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
          title="Hapus Opsi"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function AdminDemografiPage() {
  const [fields, setFields] = useState<DemographicField[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DemographicField | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<DemographicField | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [optionsModalField, setOptionsModalField] = useState<DemographicField | null>(null)
  const [options, setOptions] = useState<DemographicOption[]>([])
  const [editingOption, setEditingOption] = useState<DemographicOption | null>(null)
  
  const [newOptValue, setNewOptValue] = useState('')
  const [newOptLabelId, setNewOptLabelId] = useState('')
  const [newOptLabelEn, setNewOptLabelEn] = useState('')
  const [addingOpt, setAddingOpt] = useState(false)

  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FieldForm>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      field_key: '', label_id: '', label_en: '', field_type: 'select',
      is_required: false, sort_order: 0, is_active: true,
    },
  })

  const labelIdVal = useWatch({ control, name: 'label_id' })
  useEffect(() => {
    if (!editing && labelIdVal) {
      setValue('field_key', labelIdVal.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''))
      setValue('label_en', labelIdVal)
    }
  }, [labelIdVal, setValue, editing])

  async function fetchFields() {
    const { data } = await supabase.from('demographic_fields').select('*, demographic_options(*)').order('sort_order')
    if (data) setFields(data as unknown as DemographicField[])
  }

  useEffect(() => {
    let ignore = false
    async function loadData() {
      const { data } = await supabase.from('demographic_fields').select('*, demographic_options(*)').order('sort_order')
      if (!ignore) {
        if (data) setFields(data as unknown as DemographicField[])
        setLoading(false)
      }
    }
    loadData()
    return () => { ignore = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleFieldDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      const newFields = arrayMove(fields, oldIndex, newIndex)
      setFields(newFields)

      const updates = newFields.map((field, index) => ({
        id: field.id,
        field_key: field.field_key,
        label_id: field.label_id,
        label_en: field.label_en,
        field_type: field.field_type,
        is_required: field.is_required,
        is_active: field.is_active,
        sort_order: index,
      }))

      const { error } = await supabase.from('demographic_fields').upsert(updates)
      if (error) {
        toast.error('Gagal menyimpan urutan field')
        fetchFields()
      } else {
        toast.success('Urutan field demografi diperbarui', { duration: 2000 })
      }
    }
  }

  async function handleOptionDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id && optionsModalField) {
      const oldIndex = options.findIndex((o) => o.id === active.id)
      const newIndex = options.findIndex((o) => o.id === over.id)
      const newOptions = arrayMove(options, oldIndex, newIndex)
      setOptions(newOptions)

      const updates = newOptions.map((opt, index) => ({
        id: opt.id,
        field_id: opt.field_id,
        value: opt.value,
        label_id: opt.label_id,
        label_en: opt.label_en,
        sort_order: index,
      }))

      const { error } = await supabase.from('demographic_options').upsert(updates)
      if (error) {
        toast.error('Gagal menyimpan urutan opsi')
      } else {
        toast.success('Urutan opsi diperbarui', { duration: 2000 })
        fetchFields()
      }
    }
  }

  function openCreate() {
    setEditing(null)
    const nextSort = fields.length > 0 ? Math.max(...fields.map(f => f.sort_order)) + 1 : 1
    reset({
      field_key: '', label_id: '', label_en: '', field_type: 'select',
      is_required: true, sort_order: nextSort, is_active: true,
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
      if (error) { toast.error(error.message || 'Gagal memperbarui field'); setSaving(false); return }
      toast.success('Field demografi berhasil diperbarui')
    } else {
      const { error } = await supabase.from('demographic_fields').insert(data)
      if (error) { toast.error(error.message || 'Gagal menambah field'); setSaving(false); return }
      toast.success('Field demografi berhasil ditambah')
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
    toast.success('Field demografi berhasil dihapus')
    setDeleteDialog(null)
    setDeleting(false)
    fetchFields()
  }

  async function openOptionsModal(field: DemographicField) {
    setOptionsModalField(field)
    setEditingOption(null)
    const { data } = await supabase.from('demographic_options').select('*').eq('field_id', field.id).order('sort_order')
    if (data) setOptions(data as DemographicOption[])
    setNewOptValue('')
    setNewOptLabelId('')
    setNewOptLabelEn('')
  }

  function openEditOption(opt: DemographicOption) {
    setEditingOption(opt)
    setNewOptValue(opt.value)
    setNewOptLabelId(opt.label_id)
    setNewOptLabelEn(opt.label_en)
  }

  function cancelEditOption() {
    setEditingOption(null)
    setNewOptValue('')
    setNewOptLabelId('')
    setNewOptLabelEn('')
  }

  async function handleAddOptionSubmit(fieldId: string, e: React.FormEvent) {
    e.preventDefault()
    if (!newOptValue || !newOptLabelId) {
      toast.error('Nilai & Label Indonesia wajib diisi')
      return
    }
    setAddingOpt(true)

    if (editingOption) {
      const { error } = await supabase.from('demographic_options').update({
        value: newOptValue,
        label_id: newOptLabelId,
        label_en: newOptLabelEn || newOptLabelId,
      }).eq('id', editingOption.id)
      setAddingOpt(false)
      if (error) { toast.error('Gagal memperbarui opsi'); return }
      toast.success('Opsi berhasil diperbarui')
      setEditingOption(null)
    } else {
      const { error } = await supabase.from('demographic_options').insert({
        field_id: fieldId,
        value: newOptValue,
        label_id: newOptLabelId,
        label_en: newOptLabelEn || newOptLabelId,
        sort_order: options.length,
      })
      setAddingOpt(false)
      if (error) { toast.error('Gagal menambah opsi'); return }
      toast.success('Opsi berhasil ditambahkan')
    }

    setNewOptValue('')
    setNewOptLabelId('')
    setNewOptLabelEn('')
    
    const { data } = await supabase.from('demographic_options').select('*').eq('field_id', fieldId).order('sort_order')
    if (data) setOptions(data as DemographicOption[])
    fetchFields()
  }

  async function deleteOption(optionId: string, fieldId: string) {
    const { error } = await supabase.from('demographic_options').delete().eq('id', optionId)
    if (error) { toast.error('Gagal menghapus opsi'); return }
    toast.success('Opsi berhasil dihapus')
    if (editingOption?.id === optionId) {
      cancelEditOption()
    }
    
    const { data } = await supabase.from('demographic_options').select('*').eq('field_id', fieldId).order('sort_order')
    if (data) setOptions(data as DemographicOption[])
    fetchFields()
  }

  const filteredFields = fields.filter(f => 
    f.label_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.field_key.toLowerCase().includes(searchQuery.toLowerCase())
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
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <Users className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Field Demografi Responden
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              Kelola pertanyaan identitas responden survei (Dropdown, Ceklis, Toggle Ya/Tidak, Teks, & Angka).
            </p>
          </div>
        </div>

        <Button 
          onClick={openCreate} 
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-5 py-6 shadow-md shadow-emerald-600/20 transition-all cursor-pointer w-full md:w-auto"
        >
          <Plus className="size-5" />
          <span>Tambah Field Demografi</span>
        </Button>
      </div>

      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        
        <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Daftar Pertanyaan Demografi</CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-xs">
                {fields.length} Field
              </Badge>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Cari field demografi..."
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
            onDragEnd={handleFieldDragEnd}
          >
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-gray-800/60">
                <TableRow className="border-b border-slate-100 dark:border-gray-800">
                  <TableHead className="w-12 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Geser</TableHead>
                  <TableHead className="w-12 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Urutan</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Field Key</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Label Pertanyaan</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tipe Field</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Wajib</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="w-48 text-right text-xs font-bold text-slate-700 uppercase tracking-wider pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={filteredFields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredFields.map((f) => (
                    <SortableFieldRow
                      key={f.id}
                      f={f}
                      onOpenOptionsModal={openOptionsModal}
                      onEdit={openEdit}
                      onDeleteDialog={setDeleteDialog}
                    />
                  ))}
                </SortableContext>

                {filteredFields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="size-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-medium">Tidak ada field demografi ditemukan</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>

      <Dialog open={!!optionsModalField} onOpenChange={(open) => { if (!open) setOptionsModalField(null) }}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border border-slate-200 shadow-2xl">
          <div className="bg-gradient-to-r from-blue-800 to-indigo-700 p-6 text-white space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                <Sparkles className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-white">
                  Kelola Opsi Pilihan
                </DialogTitle>
                <p className="text-xs text-blue-100 font-medium">
                  Field: &ldquo;<strong className="text-white">{optionsModalField?.label_id}</strong>&rdquo; ({optionsModalField?.field_type})
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 bg-white dark:bg-gray-900">
            <form onSubmit={(e) => optionsModalField && handleAddOptionSubmit(optionsModalField.id, e)} className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {editingOption ? 'Edit Opsi Pilihan' : 'Tambah Opsi Baru'}
                </h5>
                {editingOption && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                    Mode Edit: {editingOption.value}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">Value (Data)</Label>
                  <Input 
                    placeholder="Contoh: L / Ya / S1" 
                    value={newOptValue} 
                    onChange={(e) => setNewOptValue(e.target.value)} 
                    className="rounded-xl text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">Label (Indonesia)</Label>
                  <Input 
                    placeholder="Contoh: Laki-laki / S1" 
                    value={newOptLabelId} 
                    onChange={(e) => setNewOptLabelId(e.target.value)} 
                    className="rounded-xl text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600">Label (English)</Label>
                  <Input 
                    placeholder="Contoh: Male / Bachelor" 
                    value={newOptLabelEn} 
                    onChange={(e) => setNewOptLabelEn(e.target.value)} 
                    className="rounded-xl text-xs bg-white"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2">
                {editingOption && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEditOption} 
                    className="rounded-xl text-xs font-bold h-9 px-3"
                  >
                    Batal Edit
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={addingOpt} 
                  className={`${editingOption ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-bold rounded-xl text-xs h-9 px-4 cursor-pointer shadow-xs`}
                >
                  {addingOpt ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : editingOption ? <Pencil className="size-3.5 mr-1.5" /> : <Plus className="size-3.5 mr-1.5" />}
                  {editingOption ? 'Simpan Edit Opsi' : 'Tambah Opsi'}
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Daftar Opsi Tersedia ({options.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Geser ikon titik-titik untuk mengubah urutan</span>
              </h5>

              {options.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  Belum ada opsi pilihan ditambahkan.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleOptionDragEnd}
                >
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    <SortableContext
                      items={options.map((o) => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {options.map((opt) => (
                        <SortableOptionItem
                          key={opt.id}
                          opt={opt}
                          onEditOption={openEditOption}
                          onDeleteOption={(optId) => optionsModalField && deleteOption(optId, optionsModalField.id)}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </DndContext>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <DialogClose render={<Button variant="outline" className="rounded-xl font-bold text-xs">Selesai</Button>} />
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border border-slate-200 shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                <Users className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-white">
                  {editing ? 'Ubah Field Demografi' : 'Tambah Field Demografi Baru'}
                </DialogTitle>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 bg-white dark:bg-gray-900">
            <div className="space-y-1.5">
              <Label htmlFor="field_key" className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Key className="size-3.5 text-emerald-600" />
                Field Key (Kode unik database)
              </Label>
              <Input 
                id="field_key" 
                placeholder="contoh: jenis_kelamin, usia, disabilitas" 
                {...register('field_key')} 
                className="rounded-xl font-mono text-xs border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.field_key && <p className="text-xs font-medium text-rose-500 mt-1">{errors.field_key.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="label_id" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Type className="size-3.5 text-emerald-600" />
                  Label (Indonesia)
                </Label>
                <Input id="label_id" placeholder="Jenis Kelamin" {...register('label_id')} className="rounded-xl text-xs sm:text-sm border-slate-200" />
                {errors.label_id && <p className="text-xs font-medium text-rose-500 mt-1">{errors.label_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="label_en" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Type className="size-3.5 text-emerald-600" />
                  Label (English)
                </Label>
                <Input id="label_en" placeholder="Gender" {...register('label_en')} className="rounded-xl text-xs sm:text-sm border-slate-200" />
                {errors.label_en && <p className="text-xs font-medium text-rose-500 mt-1">{errors.label_en.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ListFilter className="size-3.5 text-emerald-600" />
                Tipe Isian Field
              </Label>
              <Controller
                name="field_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs sm:text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl p-1.5">
                      <SelectItem value="select" className="rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700">Select (Dropdown Pilihan)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="checkbox" className="rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-700">Checkbox (Ceklis Multi-Pilihan)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="toggle" className="rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-700">Toggle (Saklar Ya / Tidak)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="text" className="rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-700">Text (Isian Teks Bebas)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="number" className="rounded-xl cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">Number (Isian Angka)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Label htmlFor="is_required" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Wajib Diisi
                </Label>
                <Controller
                  name="is_required"
                  control={control}
                  render={({ field }) => (
                    <Switch id="is_required" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <Label htmlFor="is_active" className="text-xs font-bold text-emerald-900 cursor-pointer">
                  Status Aktif
                </Label>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="space-y-0.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Label htmlFor="sort_order" className="text-[11px] font-bold text-slate-700">
                  Urutan
                </Label>
                <Input 
                  id="sort_order" 
                  type="number" 
                  {...register('sort_order', { valueAsNumber: true })} 
                  className="rounded-xl border-slate-200 text-xs font-bold h-7"
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
                {editing ? 'Simpan Perubahan' : 'Tambah Field'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent className="rounded-3xl p-6 border border-slate-200 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mx-auto sm:mx-0">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-900">
              Hapus Field Demografi?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus field &ldquo;<strong className="text-slate-800">{deleteDialog?.label_id}</strong>&rdquo;? Seluruh data opsi dan jawaban responden terkait juga akan terhapus.
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
