'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, HelpCircle, FileText, Layers, CheckCircle2, XCircle, AlertTriangle, Search, Smile } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Question, Unsur, Service } from '@/types'

const questionSchema = z.object({
  unsur_id: z.string().min(1, 'Unsur wajib dipilih'),
  service_id: z.string().optional(),
  question_text_id: z.string().min(1, 'Teks pertanyaan (ID) wajib diisi'),
  question_text_en: z.string().min(1, 'Teks pertanyaan (EN) wajib diisi'),
  input_type: z.enum(['star_rating']),
  label_4: z.string().min(1, 'Label nilai 4 wajib diisi'),
  label_3: z.string().min(1, 'Label nilai 3 wajib diisi'),
  label_2: z.string().min(1, 'Label nilai 2 wajib diisi'),
  label_1: z.string().min(1, 'Label nilai 1 wajib diisi'),
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
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Question | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      unsur_id: '', service_id: undefined, question_text_id: '', question_text_en: '',
      input_type: 'star_rating',
      label_4: 'Sangat Puas', label_3: 'Puas', label_2: 'Kurang Puas', label_1: 'Tidak Puas',
      is_active: true, sort_order: 0,
    },
  })

  const unsurId = useWatch({ control, name: 'unsur_id' })
  const isActive = useWatch({ control, name: 'is_active' })
  const serviceId = useWatch({ control, name: 'service_id' })

  const fetchQuestions = useCallback(async (targetId?: string) => {
    const idToUse = targetId || filterUnsur
    if (!idToUse) { setQuestions([]); setLoading(false); return }
    const { data } = await supabase.from('questions').select('*, unsur(*)').eq('unsur_id', idToUse).order('sort_order')
    if (data) setQuestions(data as unknown as Question[])
    setLoading(false)
  }, [filterUnsur, supabase])

  useEffect(() => {
    async function init() {
      const [unsurRes, servicesRes] = await Promise.all([
        supabase.from('unsur').select('*').order('sort_order'),
        supabase.from('services').select('*').order('sort_order'),
      ])
      if (unsurRes.data) {
        setUnsurList(unsurRes.data as Unsur[])
        setFilterUnsur((prev) => prev || (unsurRes.data.length > 0 ? unsurRes.data[0].id : ''))
      }
      if (servicesRes.data) setServices(servicesRes.data as Service[])
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (!filterUnsur) return
    async function loadData() {
      setLoading(true)
      const { data } = await supabase.from('questions').select('*, unsur(*)').eq('unsur_id', filterUnsur).order('sort_order')
      if (data) setQuestions(data as unknown as Question[])
      setLoading(false)
    }
    loadData()
  }, [filterUnsur, supabase])

  function openCreate() {
    setEditing(null)
    const nextSort = questions.length > 0 ? Math.max(...questions.map(q => q.sort_order)) + 1 : 1
    reset({
      unsur_id: filterUnsur, service_id: undefined, question_text_id: '', question_text_en: '',
      input_type: 'star_rating',
      label_4: 'Sangat Puas', label_3: 'Puas', label_2: 'Kurang Puas', label_1: 'Tidak Puas',
      is_active: true, sort_order: nextSort,
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
      label_4: q.rating_labels?.['4'] || 'Sangat Puas',
      label_3: q.rating_labels?.['3'] || 'Puas',
      label_2: q.rating_labels?.['2'] || 'Kurang Puas',
      label_1: q.rating_labels?.['1'] || 'Tidak Puas',
      is_active: q.is_active,
      sort_order: q.sort_order,
    })
    setDialogOpen(true)
  }

  async function onSubmit(data: QuestionForm) {
    setSaving(true)
    const payload = {
      unsur_id: data.unsur_id,
      service_id: data.service_id || null,
      question_text_id: data.question_text_id,
      question_text_en: data.question_text_en,
      input_type: data.input_type,
      rating_labels: {
        '4': data.label_4,
        '3': data.label_3,
        '2': data.label_2,
        '1': data.label_1,
      },
      is_active: data.is_active,
      sort_order: data.sort_order,
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

  const selectedUnsurObj = unsurList.find(u => u.id === filterUnsur)

  const filteredQuestions = questions.filter(q => 
    q.question_text_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.question_text_en.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && !unsurList.length) {
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
            <HelpCircle className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Kelola Butir Pertanyaan Survei
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              Atur dan kelola butir pertanyaan untuk setiap unsur indikator penilaian IPKP & IPAK.
            </p>
          </div>
        </div>

        {filterUnsur && (
          <Button 
            onClick={openCreate} 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-5 py-6 shadow-md shadow-emerald-600/20 transition-all cursor-pointer w-full md:w-auto"
          >
            <Plus className="size-5" />
            <span>Tambah Pertanyaan</span>
          </Button>
        )}
      </div>

      {/* Unsur Selector Bar */}
      <Card className="border border-slate-200/80 dark:border-gray-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-gray-800/40 border-b border-slate-100 dark:border-gray-800 p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 max-w-lg">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="size-4 text-emerald-600" />
                <span>Pilih Unsur Penilaian Target</span>
              </Label>
              <Select value={filterUnsur} onValueChange={(v) => { if (v) { setFilterUnsur(v); setQuestions([]) } }}>
                <SelectTrigger className="w-full rounded-2xl border-slate-200 font-bold text-xs sm:text-sm py-5">
                  <SelectValue placeholder="-- Pilih Unsur --">
                    {selectedUnsurObj ? `${selectedUnsurObj.name} (${selectedUnsurObj.index_type})` : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-2xl p-1.5 shadow-xl max-h-72">
                  {unsurList.map((u) => (
                    <SelectItem key={u.id} value={u.id} className="rounded-xl py-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          u.index_type === 'IPKP' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {u.index_type}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">{u.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUnsurObj && (
              <div className="relative w-full md:w-72 self-end">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Cari pertanyaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-gray-800/60">
              <TableRow className="border-b border-slate-100 dark:border-gray-800">
                <TableHead className="w-14 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">Urutan</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Teks Pertanyaan (Indonesia &amp; Inggris)</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Target Layanan</TableHead>
                <TableHead className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</TableHead>
                <TableHead className="w-32 text-right text-xs font-bold text-slate-700 uppercase tracking-wider pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((q) => (
                <TableRow key={q.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <TableCell className="text-center font-mono text-xs font-bold text-slate-400">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold mx-auto">
                      {q.sort_order}
                    </span>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="space-y-1 max-w-lg">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {q.question_text_id}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 italic">
                        EN: {q.question_text_en}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    {q.service_id ? (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-teal-50 text-teal-800 border border-teal-200/80 px-2.5 py-1 rounded-lg">
                        <FileText className="size-3 text-teal-600" />
                        {services.find((s) => s.id === q.service_id)?.name || 'Spesifik Layanan'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-slate-100 text-slate-700 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                        Semua Layanan (Umum)
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {q.is_active ? (
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
                      <button
                        type="button"
                        onClick={() => openEdit(q)}
                        className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-all cursor-pointer"
                        title="Edit Pertanyaan"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteDialog(q)}
                        className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all cursor-pointer"
                        title="Hapus Pertanyaan"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredQuestions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                    <HelpCircle className="size-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Belum ada butir pertanyaan untuk unsur ini</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Question Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border border-slate-200/90 shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                <HelpCircle className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-white">
                  {editing ? 'Ubah Pertanyaan Evaluasi' : 'Tambah Pertanyaan Evaluasi Baru'}
                </DialogTitle>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white dark:bg-gray-900">
            {/* Teks Pertanyaan (Indonesia) */}
            <div className="space-y-1.5">
              <Label htmlFor="question_text_id" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Teks Pertanyaan (Bahasa Indonesia) <span className="text-rose-500">*</span>
              </Label>
              <Textarea 
                id="question_text_id" 
                rows={2} 
                placeholder="Bagaimana pendapat Saudara/i tentang kesesuaian persyaratan..."
                {...register('question_text_id')} 
                className="rounded-xl border-slate-200 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.question_text_id && <p className="text-xs font-medium text-rose-500">{errors.question_text_id.message}</p>}
            </div>

            {/* Teks Pertanyaan (English) */}
            <div className="space-y-1.5">
              <Label htmlFor="question_text_en" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Teks Pertanyaan (Bahasa Inggris / English) <span className="text-rose-500">*</span>
              </Label>
              <Textarea 
                id="question_text_en" 
                rows={2} 
                placeholder="What is your opinion regarding the suitability of requirements..."
                {...register('question_text_en')} 
                className="rounded-xl border-slate-200 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.question_text_en && <p className="text-xs font-medium text-rose-500">{errors.question_text_en.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unsur Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Unsur Target</Label>
                <Select value={unsurId || ''} onValueChange={(v) => { if (v) setValue('unsur_id', v) }}>
                  <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs font-semibold">
                    <SelectValue placeholder="Pilih Unsur">
                      {unsurList.find(u => u.id === unsurId) ? `${unsurList.find(u => u.id === unsurId)?.name} (${unsurList.find(u => u.id === unsurId)?.index_type})` : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {unsurList.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="rounded-lg text-xs font-medium">
                        {u.name} ({u.index_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Layanan */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">Layanan Target (Opsional)</Label>
                <Select value={serviceId || 'ALL'} onValueChange={(v) => setValue('service_id', (!v || v === 'ALL') ? undefined : v)}>
                  <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs font-semibold">
                    <SelectValue placeholder="Semua Layanan (Umum)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-56">
                    <SelectItem value="ALL" className="rounded-lg text-xs font-bold">Semua Layanan (Umum)</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="rounded-lg text-xs font-medium">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rating Emote Custom Labels Configuration */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-gray-800">
              <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Smile className="size-4 text-emerald-600" />
                <span>Kustomisasi Teks Label Penilaian (4 Level Emote)</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200/80 dark:border-gray-700">
                <div className="space-y-1">
                  <Label htmlFor="label_4" className="text-[11px] font-bold text-teal-700 dark:text-teal-400">Score 4 (Emote 😍 / 😃)</Label>
                  <Input id="label_4" {...register('label_4')} placeholder="Sangat Puas" className="rounded-xl bg-white dark:bg-gray-900 text-xs font-bold text-teal-900 border-teal-200" />
                  {errors.label_4 && <p className="text-[10px] font-semibold text-rose-500">{errors.label_4.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="label_3" className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400">Score 3 (Emote 😊)</Label>
                  <Input id="label_3" {...register('label_3')} placeholder="Puas" className="rounded-xl bg-white dark:bg-gray-900 text-xs font-bold text-cyan-900 border-cyan-200" />
                  {errors.label_3 && <p className="text-[10px] font-semibold text-rose-500">{errors.label_3.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="label_2" className="text-[11px] font-bold text-pink-700 dark:text-pink-400">Score 2 (Emote 🙁)</Label>
                  <Input id="label_2" {...register('label_2')} placeholder="Kurang Puas" className="rounded-xl bg-white dark:bg-gray-900 text-xs font-bold text-pink-900 border-pink-200" />
                  {errors.label_2 && <p className="text-[10px] font-semibold text-rose-500">{errors.label_2.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="label_1" className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Score 1 (Emote 😡)</Label>
                  <Input id="label_1" {...register('label_1')} placeholder="Tidak Puas" className="rounded-xl bg-white dark:bg-gray-900 text-xs font-bold text-rose-900 border-rose-200" />
                  {errors.label_1 && <p className="text-[10px] font-semibold text-rose-500">{errors.label_1.message}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <Label htmlFor="sort_order" className="text-xs font-bold text-slate-700 dark:text-slate-200">Urutan Tampil</Label>
                <Input 
                  id="sort_order" 
                  type="number" 
                  {...register('sort_order', { valueAsNumber: true })} 
                  className="rounded-xl border-slate-200 text-xs font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <Label htmlFor="is_active" className="text-xs font-bold text-emerald-900 cursor-pointer">Status Aktif</Label>
                <Switch id="is_active" checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
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
                {editing ? 'Simpan Perubahan' : 'Tambah Pertanyaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent className="rounded-3xl p-6 border border-slate-200 shadow-2xl">
          <AlertDialogHeader className="space-y-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mx-auto sm:mx-0">
              <AlertTriangle className="size-6" />
            </div>
            <AlertDialogTitle className="text-lg font-extrabold text-slate-900">
              Hapus Pertanyaan Evaluasi?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-relaxed">
              Apakah Anda yakin ingin menghapus pertanyaan ini? Seluruh data yang terkait tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold px-4"
            >
              {deleting ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
