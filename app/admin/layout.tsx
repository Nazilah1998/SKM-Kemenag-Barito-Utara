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
  Menu,
  ChevronRight,
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
];

function SidebarContent({
  pathname,
  setSheetOpen,
}: {
  pathname: string | null;
  setSheetOpen: (open: boolean) => void;
}) {
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
        <div className="relative flex size-10 items-center justify-center rounded-xl bg-white text-lg font-bold shadow-sm overflow-hidden p-1">
          <Image
            src="/arus.png"
            alt="SI-ARUS"
            fill
            unoptimized
            className="object-contain p-1"
          />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">
            SI-ARUS
          </span>
          <span className="text-xs text-gray-500 font-medium">Panel Admin</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSheetOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <div
                  className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}
                >
                  {item.icon}
                </div>
                <span>{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto flex items-center"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <ChevronRight className="size-4" />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>
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
      <aside className="hidden w-56 shrink-0 border-r bg-white dark:bg-gray-900 lg:flex lg:flex-col">
        <SidebarContent pathname={pathname} setSheetOpen={() => {}} />
      </aside>

      <main className="flex-1 overflow-auto bg-gray-50/50 dark:bg-gray-950/50 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b bg-white dark:bg-gray-900 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-10 sticky top-0">
          <div className="flex items-center">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu Admin</SheetTitle>
                </SheetHeader>
                <SidebarContent
                  pathname={pathname}
                  setSheetOpen={setSheetOpen}
                />
              </SheetContent>
            </Sheet>
            <span className="ml-3 font-semibold text-gray-900 dark:text-white lg:hidden">
              SI-ARUS Admin
            </span>
          </div>

          {/* User Account Dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1.5 pr-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none">
                <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 overflow-hidden">
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
                <div className="hidden sm:flex flex-col items-start text-left overflow-hidden max-w-[120px]">
                  <span className="text-sm font-semibold truncate w-full text-gray-900 dark:text-gray-100">
                    {userInfo?.name || "Admin"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl mt-1">
                <div className="px-2.5 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Akun Saya
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {ADMIN_EMAIL}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer rounded-lg m-1"
                >
                  <LogOut className="mr-2 size-4" />
                  <span>Keluar</span>
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
            className="p-4 md:p-6 lg:p-8 w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
