"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LogIn,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Building2,
  FileText,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_EMAIL } from "@/lib/constants";
import { toast } from "sonner";
import { verifyTurnstileToken } from "./actions";

const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    if (turnstileSiteKey && !turnstileToken) {
      toast.error("Silakan selesaikan verifikasi keamanan");
      return;
    }

    setLoading(true);

    if (turnstileSiteKey) {
      const isHuman = await verifyTurnstileToken(turnstileToken);
      if (!isHuman) {
        toast.error("Verifikasi keamanan gagal, coba lagi.");
        setLoading(false);
        return;
      }
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error("Email atau kata sandi salah");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Gagal memuat sesi pengguna");
      setLoading(false);
      return;
    }

    // Verifikasi ketersediaan pengguna di database pusdatin terpusat
    const { data: pusdatinUser, error: pusdatinError } = await supabase.rpc(
      "get_pusdatin_user",
      { email_address: data.email },
    );

    // Hanya lakukan pengecekan ketat jika bukan super admin
    if (user.email !== ADMIN_EMAIL) {
      if (pusdatinError || !pusdatinUser) {
        await supabase.auth.signOut();
        toast.error("Akun Anda tidak terdaftar di sistem terpusat.");
        setLoading(false);
        return;
      }

      if (pusdatinUser.status !== "active") {
        await supabase.auth.signOut();
        toast.error("Akun Anda sedang dinonaktifkan oleh Administrator.");
        setLoading(false);
        return;
      }

      // Verifikasi akses spesifik untuk SIKAP / Survey
      const hasSurveyAccess = pusdatinUser.app_permissions?.some(
        (p: { app_id: string; role: string }) =>
          p.app_id === "survey-kemenag" && p.role !== "none",
      );

      if (!hasSurveyAccess) {
        await supabase.auth.signOut();
        toast.error("Anda tidak memiliki hak akses untuk aplikasi SIKAP.");
        setLoading(false);
        return;
      }
    }

    toast.success("Berhasil login! Mengalihkan ke halaman dashboard...", {
      position: "top-right",
      duration: 3000,
    });

    setTimeout(() => {
      router.replace("/admin");
    }, 800);
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white">
      {/* ========================================================================= */}
      {/* KIRI: Interactive Animated Branding Panel (Desktop Only)                   */}
      {/* ========================================================================= */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 p-12 lg:flex">
        {/* Animated Dynamic Glowing Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          className="absolute -left-20 -top-20 size-[500px] rounded-full bg-emerald-500/20 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 12,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute -bottom-20 -right-20 size-[450px] rounded-full bg-teal-400/20 blur-[110px]"
        />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 p-2.5 shadow-lg backdrop-blur-md border border-white/20">
            <Image
              src="/arus.png"
              alt="ARUS Logo"
              width={40}
              height={40}
              className="object-contain filter drop-shadow"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              SI-ARUS / SIKAP
            </h2>
            <p className="text-xs font-medium text-emerald-200/80">
              Kemenag Kab. Barito Utara
            </p>
          </div>
        </div>

        {/* Floating Animated Cards & Hero Title */}
        <div className="relative z-10 my-auto py-10">
          {/* Badge Tag */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 backdrop-blur-md"
          >
            <Sparkles className="size-4 text-emerald-300 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-200 tracking-wide uppercase">
              Portal Administrator Terpadu
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-4 text-4xl font-extrabold text-white lg:text-5xl leading-tight"
          >
            Sistem Informasi <br />
            <span className="bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-300 bg-clip-text text-transparent">
              Survei Kepuasan Masyarakat
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-xl text-base text-emerald-100/80 leading-relaxed mb-10"
          >
            Kelola dan pantau rekapitulasi nilai Indeks Persepsi Kualitas
            Pelayanan (IPKP) dan Indeks Persepsi Anti Korupsi (IPAK) secara
            transparan dan terintegrasi.
          </motion.p>

          {/* Animated Interactive Feature Cards Banner */}
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300 shrink-0">
                <BarChart3 className="size-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Analisis Real-time
                </h4>
                <p className="text-xs text-emerald-200/70">
                  Rekapitulasi IPKP & IPAK
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-teal-400/20 text-teal-300 shrink-0">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Integritas Data
                </h4>
                <p className="text-xs text-emerald-200/70">
                  Aman & Terverifikasi
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300 shrink-0">
                <FileText className="size-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Arsip Survei
                </h4>
                <p className="text-xs text-emerald-200/70">
                  Triwulan, Sem. & Tahunan
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-xl backdrop-blur-md"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 shrink-0">
                <Building2 className="size-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Kemenag Barito Utara
                </h4>
                <p className="text-xs text-emerald-200/70">
                  Layanan Publik PTSP
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/60 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span>Terhubung ke Pusdatin Kemenag Barito Utara Terpusat</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KANAN: Form Administrator Login Box                                        */}
      {/* ========================================================================= */}
      <div className="flex w-full flex-col justify-between p-6 sm:p-10 lg:w-1/2 min-h-screen">
        {/* Back Link Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Shield className="size-3.5" />
            <span>Admin Area</span>
          </div>
        </div>

        {/* Form Main Container */}
        <div className="my-auto mx-auto w-full max-w-md py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Header Title */}
            <div className="text-center sm:text-left space-y-2">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-100/80 text-emerald-700 shadow-inner mb-2 sm:hidden">
                <ShieldCheck className="size-8" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Selamat Datang Admin
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Silakan masuk dengan akun terdaftar untuk mengakses dashboard
                rekapitulasi survei.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Alamat Email
                  </Label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Mail className="size-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@kemenag.go.id"
                      className="block w-full rounded-xl border-gray-200 bg-gray-50/80 py-5 pl-11 pr-4 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Kata Sandi
                  </Label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="size-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="block w-full rounded-xl border-gray-200 bg-gray-50/80 py-5 pl-11 pr-11 text-sm text-gray-900 transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/15"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Turnstile Security Verification Widget */}
              {turnstileSiteKey && (
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onSuccess={(token) => setTurnstileToken(token)}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-semibold text-white hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg shadow-emerald-600/25 active:scale-[0.99] disabled:opacity-75 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-2" />
                    Memverifikasi Hak Akses...
                  </>
                ) : (
                  <>
                    <LogIn className="size-5 mr-2" />
                    Masuk ke Dasbor Admin
                  </>
                )}
              </Button>
            </form>

            {/* Security Notice Card */}
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-emerald-900 shadow-sm">
              <ShieldCheck className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Akses terbatas hanya untuk Petugas Administrator Kantor
                Kementerian Agama Kabupaten Barito Utara yang terotorisasi.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-2">
          &copy; {new Date().getFullYear()} SI-ARUS
        </div>
      </div>
    </div>
  );
}
