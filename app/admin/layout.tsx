"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Calendar,
  ClipboardList,
  PieChart,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  QrCode,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_EMAIL } from "@/lib/constants";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PusdatinUser {
  name: string;
  avatar: string | null;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    label: "Layanan",
    href: "/admin/layanan",
    icon: <FileText className="size-4" />,
  },
  {
    label: "Unsur & Pertanyaan",
    href: "/admin/unsur",
    icon: <BarChart3 className="size-4" />,
  },
  {
    label: "Field Demografi",
    href: "/admin/demografi",
    icon: <Users className="size-4" />,
  },
  {
    label: "Periode Survei",
    href: "/admin/periode",
    icon: <Calendar className="size-4" />,
  },
  {
    label: "Data Respon",
    href: "/admin/respon",
    icon: <ClipboardList className="size-4" />,
  },
  {
    label: "Laporan",
    href: "/admin/laporan",
    icon: <PieChart className="size-4" />,
  },
  {
    label: "Pengaturan",
    href: "/admin/pengaturan",
    icon: <Settings className="size-4" />,
  },
  {
    label: "QR Code & Barcode",
    href: "/admin/barcode",
    icon: <QrCode className="size-4" />,
  },
];

function AnimatedHamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative size-5 flex flex-col justify-center items-center">
      <motion.span
        animate={{
          rotate: isOpen ? 45 : 0,
          y: isOpen ? 0 : -6,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="absolute h-0.5 w-4.5 bg-current rounded-full origin-center"
      />
      <motion.span
        animate={{
          opacity: isOpen ? 0 : 1,
          scaleX: isOpen ? 0 : 1,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="absolute h-0.5 w-4.5 bg-current rounded-full origin-center"
      />
      <motion.span
        animate={{
          rotate: isOpen ? -45 : 0,
          y: isOpen ? 0 : 6,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="absolute h-0.5 w-4.5 bg-current rounded-full origin-center"
      />
    </div>
  );
}

function SidebarContent({
  pathname,
  setSheetOpen,
  isCollapsed = false,
}: {
  pathname: string | null;
  setSheetOpen: (open: boolean) => void;
  isCollapsed?: boolean;
}) {
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Branding Header */}
        <div className={`flex items-center ${isCollapsed ? "justify-center px-2" : "px-5"} py-5 border-b border-gray-100 dark:border-gray-800 transition-all duration-300`}>
          <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-bold shadow-sm border border-gray-100 p-1">
              <Image
                src="/arus.png"
                alt="SI-ARUS"
                fill
                unoptimized
                className="object-contain p-1"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">
                  SI-ARUS
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold">Panel Admin</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative flex items-center ${isCollapsed ? "justify-center px-0 py-3" : "gap-3.5 px-4 py-3"} rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-emerald-50 text-emerald-700 shadow-sm font-semibold dark:bg-emerald-900/40 dark:text-emerald-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <div
                    className={`shrink-0 transition-transform duration-200 ${active ? "scale-110 text-emerald-600" : "group-hover:scale-110 text-gray-500 group-hover:text-emerald-600"}`}
                  >
                    {item.icon}
                  </div>
                  
                  {!isCollapsed && (
                    <span className="truncate whitespace-nowrap text-xs font-semibold sm:text-sm">{item.label}</span>
                  )}

                  {active && !isCollapsed && (
                    <motion.div
                      layoutId="activeNav"
                      className="ml-auto flex items-center"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <ChevronRight className="size-4 text-emerald-500" />
                    </motion.div>
                  )}

                  {active && isCollapsed && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<PusdatinUser | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin/login")) {
      return;
    }

    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
      } else {
        // Fetch app info and user info directly using postgres
        const [userRes] = await Promise.all([
          supabase
            .schema("kemenag_pusdatin")
            .from("users")
            .select("name, avatar")
            .eq("email", user.email)
            .single(),
        ]);
        if (userRes.data) setUserInfo(userRes.data);

        setChecking(false);
      }
    }
    checkAuth();
  }, [router, pathname]);

  if (pathname?.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar with Animated Collapse/Expand Width */}
      <aside
        className={`hidden shrink-0 border-r bg-white dark:bg-gray-900 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <SidebarContent 
          pathname={pathname} 
          setSheetOpen={() => {}} 
          isCollapsed={isCollapsed} 
        />
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-950/50 flex flex-col w-full">
        {/* Top Header */}
        <header className="h-16 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger className="lg:hidden p-2.5 -ml-2 rounded-xl border border-gray-200/80 bg-white text-gray-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-xs transition-all duration-200 active:scale-95">
                <AnimatedHamburgerIcon isOpen={sheetOpen} />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu Admin</SheetTitle>
                </SheetHeader>
                <SidebarContent
                  pathname={pathname}
                  setSheetOpen={setSheetOpen}
                  isCollapsed={false}
                />
              </SheetContent>
            </Sheet>

            {/* Desktop Single Animated Hamburger Sidebar Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center p-2.5 rounded-xl border border-gray-200/80 bg-white text-gray-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
              title={isCollapsed ? "Buka Sidebar" : "Kecilkan Sidebar"}
            >
              <AnimatedHamburgerIcon isOpen={isCollapsed} />
            </button>

            <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight hidden sm:inline-block lg:hidden">
              SI-ARUS Admin
            </span>
          </div>

          {/* User Account Dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-full border border-gray-200/80 bg-white py-1.5 px-3 shadow-sm hover:border-emerald-300 hover:bg-emerald-50/40 transition-all duration-200 outline-none cursor-pointer">
                <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm ring-2 ring-emerald-100 overflow-hidden">
                  {userInfo?.avatar ? (
                    <Image
                      src={userInfo.avatar}
                      alt="Avatar"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <User className="size-4" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 transition-colors">
                    {userInfo?.name || "Admin"}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                    Administrator
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-gray-400 group-hover:text-emerald-700 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border border-gray-200/90 bg-white p-2 shadow-2xl shadow-emerald-950/10 mt-2 space-y-1">
                {/* User Header Profile Card */}
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 p-3 border border-emerald-100/80">
                  <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold shadow-md ring-2 ring-white overflow-hidden">
                    {userInfo?.avatar ? (
                      <Image src={userInfo.avatar} alt="Avatar" fill unoptimized className="object-cover" />
                    ) : (
                      <User className="size-5" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {userInfo?.name || "Admin"}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {ADMIN_EMAIL}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-semibold text-emerald-700">Aktif & Terverifikasi</span>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1 bg-gray-100" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 rounded-xl py-2.5 px-3 text-xs font-semibold text-rose-600 focus:text-rose-700 focus:bg-rose-50 hover:bg-rose-50 cursor-pointer transition-all duration-150"
                >
                  <div className="flex size-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    <LogOut className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span>Keluar dari Akun</span>
                    <span className="text-[10px] text-rose-400 font-normal">Akhiri sesi administrator</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-4 md:p-6 lg:p-8 w-full max-w-full flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
