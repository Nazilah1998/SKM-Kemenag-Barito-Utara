"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Loader2,
  Activity,
  BarChart3,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  PlusCircle,
  ClipboardList,
  PieChart,
  Settings,
  Layers,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, Variants } from "framer-motion";
import type { SurveyPeriod } from "@/types";
import Link from "next/link";

interface Stats {
  totalResponses: number;
  activeServices: number;
  totalUnsur: number;
  activePeriod: SurveyPeriod | null;
  ipkpScore: number | null;
  ipakScore: number | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalResponses: 0,
    activeServices: 0,
    totalUnsur: 0,
    activePeriod: null,
    ipkpScore: null,
    ipakScore: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      try {
        const [resCount, servCount, unsurCount, periodRes] = await Promise.all([
          supabase
            .from("responses")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("services")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("unsur")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("survey_periods")
            .select("*")
            .eq("is_active", true)
            .maybeSingle(),
        ]);

        // Fetch IPKP and IPAK scores
        const [ipkpRes, ipakRes] = await Promise.all([
          supabase
            .from("vw_index_summary")
            .select("nilai_index")
            .eq("index_type", "IPKP")
            .maybeSingle(),
          supabase
            .from("vw_index_summary")
            .select("nilai_index")
            .eq("index_type", "IPAK")
            .maybeSingle(),
        ]);

        setStats({
          totalResponses: resCount.count ?? 0,
          activeServices: servCount.count ?? 0,
          totalUnsur: unsurCount.count ?? 0,
          activePeriod: (periodRes.data ?? null) as SurveyPeriod | null,
          ipkpScore:
            (ipkpRes.data as { nilai_index: number } | null)?.nilai_index ??
            null,
          ipakScore:
            (ipakRes.data as { nilai_index: number } | null)?.nilai_index ??
            null,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const getMutuLabel = (score: number | null) => {
    if (score === null)
      return { label: "Belum Ada Data", color: "bg-gray-100 text-gray-700" };
    const converted = score * 25;
    if (converted >= 88.31)
      return {
        label: "Mutu A (Sangat Baik)",
        color: "bg-emerald-500 text-white",
      };
    if (converted >= 76.61)
      return { label: "Mutu B (Baik)", color: "bg-blue-500 text-white" };
    if (converted >= 65.0)
      return {
        label: "Mutu C (Kurang Baik)",
        color: "bg-amber-500 text-white",
      };
    return { label: "Mutu D (Sangat Kurang)", color: "bg-rose-500 text-white" };
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-emerald-600" />
          <span className="text-emerald-800 font-semibold text-sm">
            Memuat Ringkasan Dasbor...
          </span>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Respon Survei",
      value: stats.totalResponses.toLocaleString(),
      desc: "Respon publik yang tercatat",
      icon: <Users className="size-6 text-emerald-600" />,
      color: "border-l-4 border-l-emerald-500",
      bgLight: "bg-emerald-50/60",
      href: "/admin/respon",
    },
    {
      title: "Layanan Aktif",
      value: `${stats.activeServices} Layanan`,
      desc: "Jenis layanan PTSP aktif",
      icon: <FileText className="size-6 text-blue-600" />,
      color: "border-l-4 border-l-blue-500",
      bgLight: "bg-blue-50/60",
      href: "/admin/layanan",
    },
    {
      title: "Unsur Evaluasi",
      value: `${stats.totalUnsur} Unsur`,
      desc: "Indikator kuesioner aktif",
      icon: <Layers className="size-6 text-purple-600" />,
      color: "border-l-4 border-l-purple-500",
      bgLight: "bg-purple-50/60",
      href: "/admin/unsur",
    },
    {
      title: "Periode Berjalan",
      value: stats.activePeriod?.label ?? "Belum Ditentukan",
      desc: stats.activePeriod
        ? `${stats.activePeriod.start_date} s/d ${stats.activePeriod.end_date}`
        : "Silakan atur periode aktif",
      icon: <Calendar className="size-6 text-amber-600" />,
      color: "border-l-4 border-l-amber-500",
      bgLight: "bg-amber-50/60",
      href: "/admin/periode",
    },
  ];

  const quickShortcuts = [
    {
      title: "Kelola Layanan",
      desc: "Tambah & edit daftar layanan PTSP",
      icon: <FileText className="size-5 text-emerald-600" />,
      href: "/admin/layanan",
    },
    {
      title: "Unsur Penilaian",
      desc: "Kelola 9 IPKP & 5 IPAK unsur",
      icon: <Layers className="size-5 text-blue-600" />,
      href: "/admin/unsur",
    },
    {
      title: "Pertanyaan Evaluasi",
      desc: "Atur butir pertanyaan survei",
      icon: <HelpCircle className="size-5 text-teal-600" />,
      href: "/admin/pertanyaan",
    },
    {
      title: "Field Demografi",
      desc: "Kelola data identitas responden",
      icon: <Users className="size-5 text-indigo-600" />,
      href: "/admin/demografi",
    },
    {
      title: "Periode Survei",
      desc: "Kelola jadwal periode evaluasi",
      icon: <Calendar className="size-5 text-amber-600" />,
      href: "/admin/periode",
    },
    {
      title: "Data Respon",
      desc: "Lihat & verifikasi tanggapan publik",
      icon: <ClipboardList className="size-5 text-purple-600" />,
      href: "/admin/respon",
    },
    {
      title: "Laporan Rekap",
      desc: "Lihat grafik & cetak laporan resmi",
      icon: <PieChart className="size-5 text-teal-600" />,
      href: "/admin/laporan",
    },
    {
      title: "Pengaturan Sistem",
      desc: "Konfigurasi aplikasi & data admin",
      icon: <Settings className="size-5 text-slate-600" />,
      href: "/admin/pengaturan",
    },
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemAnim: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  const ipkpMutu = getMutuLabel(stats.ipkpScore);
  const ipakMutu = getMutuLabel(stats.ipakScore);

  return (
    <div className="w-full space-y-8">
      {/* Hero Welcome Card Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 border border-emerald-700/50"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-80 rounded-full bg-emerald-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30 backdrop-blur-md">
              <Sparkles className="size-3.5 text-emerald-300 animate-pulse" />
              <span>Sistem Informasi Terintegrasi SI-ARUS</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Dashboard Rekapitulasi Survei
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Pantau seluruh aktivitas survei kepuasan masyarakat (IPKP & IPAK)
              Kantor Kementerian Agama Kabupaten Barito Utara secara real-time.
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/admin/layanan"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-md hover:bg-emerald-50 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="size-4 text-emerald-700" />
              <span>Tambah Layanan</span>
            </Link>
            <Link
              href="/admin/laporan"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700/80 border border-emerald-500/50 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md"
            >
              <BarChart3 className="size-4 text-emerald-200" />
              <span>Laporan Detail</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Primary Indicator Score Cards (IPKP & IPAK) */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 grid-cols-1 md:grid-cols-2"
      >
        {/* IPKP Card */}
        <motion.div variants={itemAnim}>
          <Link href="/admin/laporan" className="block group">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-6 sm:p-7 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-emerald-500/30">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 size-48 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors" />
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                      <Activity className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide">
                        Skor IPKP
                      </h3>
                      <p className="text-xs text-emerald-100/80">
                        Indeks Persepsi Kualitas Pelayanan
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${ipkpMutu.color}`}
                  >
                    {ipkpMutu.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2">
                  <div>
                    <div className="text-5xl font-black tracking-tight text-white drop-shadow-sm">
                      {stats.ipkpScore != null
                        ? stats.ipkpScore.toFixed(2)
                        : "N/A"}
                    </div>
                    <p className="text-xs text-emerald-200 font-medium mt-1">
                      Skor Konversi:{" "}
                      <strong className="text-white">
                        {stats.ipkpScore != null
                          ? (stats.ipkpScore * 25).toFixed(2)
                          : "-"}
                      </strong>{" "}
                      / 100
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-200 group-hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                    <span>Detail</span>
                    <ArrowUpRight className="size-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* IPAK Card */}
        <motion.div variants={itemAnim}>
          <Link href="/admin/laporan" className="block group">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-6 sm:p-7 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-indigo-500/30">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 size-48 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors" />
              <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                      <TrendingUp className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide">
                        Skor IPAK
                      </h3>
                      <p className="text-xs text-indigo-100/80">
                        Indeks Persepsi Anti Korupsi
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${ipakMutu.color}`}
                  >
                    {ipakMutu.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2">
                  <div>
                    <div className="text-5xl font-black tracking-tight text-white drop-shadow-sm">
                      {stats.ipakScore != null
                        ? stats.ipakScore.toFixed(2)
                        : "N/A"}
                    </div>
                    <p className="text-xs text-indigo-200 font-medium mt-1">
                      Skor Konversi:{" "}
                      <strong className="text-white">
                        {stats.ipakScore != null
                          ? (stats.ipakScore * 25).toFixed(2)
                          : "-"}
                      </strong>{" "}
                      / 100
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-200 group-hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                    <span>Detail</span>
                    <ArrowUpRight className="size-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Stat Grid Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((card) => (
          <motion.div key={card.title} variants={itemAnim}>
            <Link href={card.href} className="block group">
              <div
                className={`relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border border-gray-100 dark:border-gray-800 ${card.color} hover:shadow-lg hover:-translate-y-1 transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {card.title}
                  </span>
                  <div
                    className={`p-2.5 rounded-xl ${card.bgLight} group-hover:scale-110 transition-transform`}
                  >
                    {card.icon}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {card.value}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {card.desc}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Shortcuts Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-600" />
            Pintas Menu Modul Admin
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            7 Modul Terintegrasi
          </span>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {quickShortcuts.map((sc) => (
            <Link key={sc.title} href={sc.href} className="group">
              <div className="flex items-start gap-3.5 rounded-2xl bg-white dark:bg-gray-900 p-4 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-200">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 group-hover:bg-emerald-100/70 group-hover:scale-105 transition-all">
                  {sc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-800 transition-colors flex items-center justify-between">
                    <span>{sc.title}</span>
                    <ChevronRight className="size-4 text-gray-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {sc.desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
