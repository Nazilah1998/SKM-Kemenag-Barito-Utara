'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Menu, X, Home, ClipboardList, BarChart3, BookOpen, ChevronDown } from 'lucide-react'
import { useI18n } from '@/components/shared/I18nProvider'
import { SURVEY_ROUTES } from '@/lib/constants'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { FolderArchive } from 'lucide-react'

export function PublicNavbar() {
  const { t, setLocale, locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [expandedArsipType, setExpandedArsipType] = useState<string | null>(null)
  const [expandedArsipYear, setExpandedArsipYear] = useState<number | null>(null)
  const pathname = usePathname()

  const currentYear = new Date().getFullYear()

  const getArchiveData = () => {
    const currentDate = new Date()
    const cYear = currentDate.getFullYear()
    const cQuarter = Math.floor(currentDate.getMonth() / 3) + 1
    const startYear = 2026
    const startQuarter = 3

    const data = []
    for (let y = cYear; y >= startYear; y--) {
      let qStart = 1
      let qEnd = 4
      
      if (y === startYear) {
        qStart = startQuarter
      }
      if (y === cYear) {
        qEnd = cQuarter
      }
      
      const quarters = []
      for (let q = qStart; q <= qEnd; q++) {
        quarters.push(q)
      }
      
      if (quarters.length > 0) {
        data.push({ 
          year: y, 
          quarters,
          hasSemester1: quarters.includes(2),
          hasSemester2: quarters.includes(4),
          hasTahunan: quarters.includes(4)
        })
      }
    }
    return data
  }
  const archiveData = getArchiveData()

  const links = [
    { href: SURVEY_ROUTES.HOME, label: t('nav.home'), icon: Home },
    { href: SURVEY_ROUTES.SURVEI, label: t('nav.survey'), icon: ClipboardList },
    { href: SURVEY_ROUTES.HASIL, label: `${t('nav.results')} ${currentYear}`, icon: BarChart3 },
    { href: '/arsip', label: 'Arsip Survei', icon: FolderArchive },
    { href: SURVEY_ROUTES.PROFIL, label: 'Profil', icon: BookOpen },
  ]

  return (
    <>
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl shadow-[0_1px_20px_rgba(0,0,0,0.04)] transition-all duration-300">
        <div className="mx-auto flex h-16 w-full max-w-7xl px-4 sm:px-6 lg:px-10 items-center justify-between">

          {/* Logo */}
          <Link href={SURVEY_ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="flex h-10 items-center justify-center">
              <Image src="/arus.png" alt="ARUS Logo" width={80} height={40} className="object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300" />
            </div>
            <div className="flex flex-col leading-none max-w-[400px]">
              <span className="text-[10px] text-emerald-700 font-bold hidden sm:block leading-[1.3] border-l-2 border-emerald-500 pl-2">Sistem Informasi<br/>Analisis Rekapitulasi Ulasan<br/>Survei Kepuasan Masyarakat</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href === SURVEY_ROUTES.HASIL && pathname.startsWith('/hasil'))
              
              if (link.href === SURVEY_ROUTES.HASIL) {
                return (
                  <DropdownMenu key={link.href}>
                    <DropdownMenuTrigger
                      className={cn(
                        'relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none',
                        isActive
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <link.icon className="size-4" />
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavItem"
                          className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48 rounded-xl">
                      <Link href="/hasil/ipkp">
                        <DropdownMenuItem className={cn("cursor-pointer rounded-lg py-2", pathname === '/hasil/ipkp' && "bg-emerald-50 text-emerald-700 font-medium")}>
                          Rekapitulasi IPKP
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/hasil/ipak">
                        <DropdownMenuItem className={cn("cursor-pointer rounded-lg py-2", pathname === '/hasil/ipak' && "bg-emerald-50 text-emerald-700 font-medium")}>
                          Rekapitulasi IPAK
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              if (link.href === '/arsip') {
                const isArsipActive = pathname.startsWith('/arsip')
                
                return (
                  <DropdownMenu key={link.href}>
                    <DropdownMenuTrigger
                      className={cn(
                        'relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none',
                        isArsipActive
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <link.icon className="size-4" />
                      {link.label}
                      {isArsipActive && (
                        <motion.div
                          layoutId="activeNavItem"
                          className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48 rounded-xl">
                      {['IPKP', 'IPAK'].map((type) => (
                        <DropdownMenuSub key={type}>
                          <DropdownMenuSubTrigger className="rounded-lg py-2 cursor-pointer">
                            <span>Arsip {type}</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-40 rounded-xl">
                            {archiveData.map(({ year, quarters, hasSemester1, hasSemester2, hasTahunan }) => (
                              <DropdownMenuSub key={`${type}-${year}`}>
                                <DropdownMenuSubTrigger className="rounded-lg py-2 cursor-pointer">
                                  <span>Tahun {year}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-48 rounded-xl">
                                  {quarters.map(q => (
                                    <Link key={q} href={`/arsip/${type.toLowerCase()}/${year}/q${q}`}>
                                      <DropdownMenuItem className="cursor-pointer rounded-lg py-2">
                                        Triwulan {['I', 'II', 'III', 'IV'][q - 1]}
                                      </DropdownMenuItem>
                                    </Link>
                                  ))}
                                  
                                  {(hasSemester1 || hasSemester2 || hasTahunan) && <DropdownMenuSeparator />}
                                  
                                  {hasSemester1 && (
                                    <Link href={`/arsip/${type.toLowerCase()}/${year}/sem1`}>
                                      <DropdownMenuItem className="cursor-pointer rounded-lg py-2">Semester 1</DropdownMenuItem>
                                    </Link>
                                  )}
                                  {hasSemester2 && (
                                    <Link href={`/arsip/${type.toLowerCase()}/${year}/sem2`}>
                                      <DropdownMenuItem className="cursor-pointer rounded-lg py-2">Semester 2</DropdownMenuItem>
                                    </Link>
                                  )}
                                  {hasTahunan && (
                                    <Link href={`/arsip/${type.toLowerCase()}/${year}/tahunan`}>
                                      <DropdownMenuItem className="cursor-pointer rounded-lg py-2 font-semibold">Tahunan</DropdownMenuItem>
                                    </Link>
                                  )}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              return (
                <Link key={link.href} href={link.href}>
                  <span className={cn(
                    'relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}>
                    <link.icon className="size-4" />
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavItem"
                        className="absolute inset-0 bg-emerald-50 rounded-lg -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </span>
                </Link>
              )
            })}

            {/* Language Toggle Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="ml-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 border border-gray-200 hover:border-emerald-300 rounded-lg bg-white hover:bg-emerald-50 transition-all duration-200 focus:outline-none"
              >
                <Image 
                  src={locale === 'id' ? "https://flagcdn.com/w20/id.png" : "https://flagcdn.com/w20/us.png"} 
                  alt={locale === 'id' ? "ID" : "EN"}
                  width={20}
                  height={15}
                  className="w-4 rounded-sm shadow-sm"
                  unoptimized
                />
                <span className="uppercase">{locale}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem
                  onClick={() => setLocale('id')}
                  className={cn("gap-2.5 cursor-pointer rounded-lg py-2", locale === 'id' && "bg-emerald-50 text-emerald-700 font-medium")}
                >
                  <Image src="https://flagcdn.com/w20/id.png" alt="ID" width={20} height={15} className="w-5 rounded-sm shadow-sm" unoptimized />
                  <span>Indonesia</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocale('en')}
                  className={cn("gap-2.5 cursor-pointer rounded-lg py-2", locale === 'en' && "bg-emerald-50 text-emerald-700 font-medium")}
                >
                  <Image src="https://flagcdn.com/w20/us.png" alt="EN" width={20} height={15} className="w-5 rounded-sm shadow-sm" unoptimized />
                  <span>English</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="relative flex md:hidden size-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 active:scale-95"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 z-[70] h-full w-72 bg-white shadow-2xl flex flex-col md:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <Link href={SURVEY_ROUTES.HOME} className="flex items-center" onClick={() => setOpen(false)}>
                  <div className="flex h-10 items-center justify-center">
                    <Image src="/arus.png" alt="ARUS Logo" width={100} height={50} className="object-contain" />
                  </div>
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="flex size-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all active:scale-95"
                  aria-label="Tutup menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Nav Links */}
              <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto">
                {/* No Menu Label */}
                {links.map((link, i) => {
                  const isActive = pathname === link.href || (link.href === SURVEY_ROUTES.HASIL && pathname.startsWith('/hasil'))
                  const Icon = link.icon

                  if (link.href === SURVEY_ROUTES.HASIL) {
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                        className="flex flex-col gap-1"
                      >
                        <button
                          onClick={() => setExpandedMenu(expandedMenu === link.href ? null : link.href)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                            pathname.startsWith('/hasil') ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn('size-4.5', pathname.startsWith('/hasil') ? 'text-emerald-600' : 'text-gray-400')} />
                            {link.label}
                          </div>
                          <ChevronDown className={cn("size-4 transition-transform duration-200", expandedMenu === link.href ? "rotate-180" : "")} />
                        </button>
                        
                        <AnimatePresence>
                          {expandedMenu === link.href && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden flex flex-col gap-1"
                            >
                              <Link
                                href="/hasil/ipkp"
                                onClick={() => setOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ml-4',
                                  pathname === '/hasil/ipkp'
                                    ? 'text-emerald-700 font-bold bg-emerald-50/50'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                )}
                              >
                                Rekapitulasi IPKP
                                {pathname === '/hasil/ipkp' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              </Link>
                              <Link
                                href="/hasil/ipak"
                                onClick={() => setOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ml-4',
                                  pathname === '/hasil/ipak'
                                    ? 'text-emerald-700 font-bold bg-emerald-50/50'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                )}
                              >
                                Rekapitulasi IPAK
                                {pathname === '/hasil/ipak' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              </Link>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  }

                  if (link.href === '/arsip') {
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                        className="flex flex-col gap-1"
                      >
                        <button
                          onClick={() => setExpandedMenu(expandedMenu === link.href ? null : link.href)}
                          className={cn(
                            'flex w-full items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                            pathname.startsWith('/arsip') ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn('size-4.5', pathname.startsWith('/arsip') ? 'text-emerald-600' : 'text-gray-400')} />
                            {link.label}
                          </div>
                          <ChevronDown className={cn("size-4 transition-transform duration-200", expandedMenu === link.href ? "rotate-180" : "")} />
                        </button>

                        <AnimatePresence>
                          {expandedMenu === link.href && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden flex flex-col gap-4 mt-2 px-1"
                            >
                              {['IPKP', 'IPAK'].map(type => (
                                <div key={type} className="flex flex-col">
                                  <button
                                    onClick={() => setExpandedArsipType(expandedArsipType === type ? null : type)}
                                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors ml-4"
                                  >
                                    <span>Arsip {type}</span>
                                    <ChevronDown className={cn("size-3.5 transition-transform duration-200", expandedArsipType === type ? "rotate-180" : "")} />
                                  </button>
                                  <AnimatePresence>
                                    {expandedArsipType === type && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden flex flex-col"
                                      >
                                        {archiveData.map(({ year, quarters, hasSemester1, hasSemester2, hasTahunan }) => (
                                          <div key={year} className="flex flex-col">
                                            <button
                                              onClick={() => setExpandedArsipYear(expandedArsipYear === year ? null : year)}
                                              className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors ml-8"
                                            >
                                              <span>Tahun {year}</span>
                                              <ChevronDown className={cn("size-3.5 transition-transform duration-200", expandedArsipYear === year ? "rotate-180" : "")} />
                                            </button>
                                            <AnimatePresence>
                                              {expandedArsipYear === year && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: "auto", opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  className="overflow-hidden flex flex-col mt-1 mb-1"
                                                >
                                                  {quarters.map(q => (
                                                    <Link key={q} href={`/arsip/${type.toLowerCase()}/${year}/q${q}`} onClick={() => setOpen(false)} className={cn("px-4 py-2.5 text-xs text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl ml-12 transition-colors", pathname === `/arsip/${type.toLowerCase()}/${year}/q${q}` ? 'bg-emerald-50 text-emerald-700 font-bold' : '')}>
                                                      Triwulan {['I', 'II', 'III', 'IV'][q - 1]}
                                                    </Link>
                                                  ))}
                                                  {hasSemester1 && <Link href={`/arsip/${type.toLowerCase()}/${year}/sem1`} onClick={() => setOpen(false)} className={cn("px-4 py-2.5 text-xs text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl ml-12 transition-colors", pathname === `/arsip/${type.toLowerCase()}/${year}/sem1` ? 'bg-emerald-50 text-emerald-700 font-bold' : '')}>Semester 1</Link>}
                                                  {hasSemester2 && <Link href={`/arsip/${type.toLowerCase()}/${year}/sem2`} onClick={() => setOpen(false)} className={cn("px-4 py-2.5 text-xs text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl ml-12 transition-colors", pathname === `/arsip/${type.toLowerCase()}/${year}/sem2` ? 'bg-emerald-50 text-emerald-700 font-bold' : '')}>Semester 2</Link>}
                                                  {hasTahunan && <Link href={`/arsip/${type.toLowerCase()}/${year}/tahunan`} onClick={() => setOpen(false)} className={cn("px-4 py-2.5 text-xs hover:text-emerald-700 hover:bg-emerald-50 rounded-xl ml-12 font-semibold transition-colors", pathname === `/arsip/${type.toLowerCase()}/${year}/tahunan` ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-gray-600')}>Tahunan</Link>}
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  }

                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className={cn('size-4.5', isActive ? 'text-emerald-600' : 'text-gray-400')} />
                        {link.label}
                        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </Link>
                    </motion.div>
                  )
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="px-4 py-4 border-t border-gray-100 space-y-2">
                <p className="px-3 pb-1 text-[11px] uppercase font-semibold text-gray-400 tracking-wider">Bahasa</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setLocale('id'); setOpen(false) }}
                    className={cn(
                      "flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                      locale === 'id' 
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' 
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Image src="https://flagcdn.com/w20/id.png" alt="ID" width={20} height={15} className="w-5 rounded-sm shadow-sm" unoptimized /> 
                    Indonesia
                  </button>
                  <button
                    onClick={() => { setLocale('en'); setOpen(false) }}
                    className={cn(
                      "flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                      locale === 'en' 
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' 
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Image src="https://flagcdn.com/w20/us.png" alt="EN" width={20} height={15} className="w-5 rounded-sm shadow-sm" unoptimized /> 
                    English
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
