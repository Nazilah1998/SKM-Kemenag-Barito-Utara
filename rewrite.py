import re
import sys

try:
    with open('components/shared/PublicNavbar.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add ChevronDown to imports
    content = re.sub(
        r"import { Menu, X, Home, ClipboardList, BarChart3, BookOpen } from 'lucide-react'",
        "import { Menu, X, Home, ClipboardList, BarChart3, BookOpen, ChevronDown } from 'lucide-react'",
        content
    )

    # 2. Add expandedMenu state
    content = re.sub(
        r"const \[open, setOpen\] = useState\(false\)",
        "const [open, setOpen] = useState(false)\n  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)",
        content
    )

    # 3. Replace mobile logo
    logo_old = """                <Link href={SURVEY_ROUTES.HOME} className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-sm">
                    <span className="text-white font-black text-sm">SK</span>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-black text-base text-gray-900 tracking-tight">SIKAP</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Kemenag Barito Utara</span>
                  </div>
                </Link>"""

    logo_new = """                <Link href={SURVEY_ROUTES.HOME} className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                  <div className="flex h-8 items-center justify-center">
                    <Image src="/arus.png" alt="ARUS Logo" width={70} height={35} className="object-contain" />
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-[9px] text-emerald-700 font-bold leading-[1.3] border-l-2 border-emerald-500 pl-2">Sistem Informasi<br/>Analisis Rekapitulasi Ulasan Survei Kepuasan Masyarakat</span>
                  </div>
                </Link>"""
    content = content.replace(logo_old, logo_new)

    # 4. Replace HASIL block
    hasil_old = """                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                        className="flex flex-col gap-1"
                      >
                        <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{link.label}</div>
                        <Link
                          href="/hasil/ipkp"
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ml-2',
                            pathname === '/hasil/ipkp'
                              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <BarChart3 className={cn('size-4', pathname === '/hasil/ipkp' ? 'text-emerald-600' : 'text-gray-400')} />
                          Rekapitulasi IPKP
                          {pathname === '/hasil/ipkp' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </Link>
                        <Link
                          href="/hasil/ipak"
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ml-2',
                            pathname === '/hasil/ipak'
                              ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                        >
                          <BarChart3 className={cn('size-4', pathname === '/hasil/ipak' ? 'text-emerald-600' : 'text-gray-400')} />
                          Rekapitulasi IPAK
                          {pathname === '/hasil/ipak' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </Link>
                      </motion.div>"""

    hasil_new = """                      <motion.div
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
                      </motion.div>"""
    content = content.replace(hasil_old, hasil_new)

    # 5. Replace ARSIP block
    arsip_old = """                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 + i * 0.06, type: 'spring', stiffness: 300, damping: 28 }}
                        className="flex flex-col gap-1"
                      >
                        <div className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{link.label}</div>
                        {['IPKP', 'IPAK'].map(type => (
                          <div key={type} className="ml-2 flex flex-col">
                            <div className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Arsip {type}</div>
                            {archiveData.map(({ year, quarters, hasSemester1, hasSemester2, hasTahunan }) => (
                              <div key={year} className="ml-4 flex flex-col">
                                <div className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tahun {year}</div>
                                <div className="grid grid-cols-2 gap-1 px-4 mb-2">
                                  {quarters.map(q => (
                                    <Link
                                      key={q}
                                      href={`/arsip/${type.toLowerCase()}/${year}/q${q}`}
                                      onClick={() => setOpen(false)}
                                      className="text-xs text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors"
                                    >
                                      Triwulan {['I', 'II', 'III', 'IV'][q - 1]}
                                    </Link>
                                  ))}
                                  {hasSemester1 && (
                                    <Link
                                      href={`/arsip/${type.toLowerCase()}/${year}/sem1`}
                                      onClick={() => setOpen(false)}
                                      className="text-xs text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors"
                                    >
                                      Semester 1
                                    </Link>
                                  )}
                                  {hasSemester2 && (
                                    <Link
                                      href={`/arsip/${type.toLowerCase()}/${year}/sem2`}
                                      onClick={() => setOpen(false)}
                                      className="text-xs text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors"
                                    >
                                      Semester 2
                                    </Link>
                                  )}
                                  {hasTahunan && (
                                    <Link
                                      href={`/arsip/${type.toLowerCase()}/${year}/tahunan`}
                                      onClick={() => setOpen(false)}
                                      className="text-xs font-semibold text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors col-span-2"
                                    >
                                      Tahunan
                                    </Link>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </motion.div>"""

    arsip_new = """                      <motion.div
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
                              className="overflow-hidden flex flex-col gap-3 mt-1 px-2"
                            >
                              {['IPKP', 'IPAK'].map(type => (
                                <div key={type} className="ml-3 flex flex-col rounded-xl bg-gray-50/50 border border-gray-100 p-2">
                                  <div className="px-2 py-1 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-100 mb-2">Arsip {type}</div>
                                  {archiveData.map(({ year, quarters, hasSemester1, hasSemester2, hasTahunan }) => (
                                    <div key={year} className="flex flex-col mb-1">
                                      <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tahun {year}</div>
                                      <div className="grid grid-cols-2 gap-1 px-1">
                                        {quarters.map(q => (
                                          <Link
                                            key={q}
                                            href={`/arsip/${type.toLowerCase()}/${year}/q${q}`}
                                            onClick={() => setOpen(false)}
                                            className={cn("text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors", pathname === `/arsip/${type.toLowerCase()}/${year}/q${q}` ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50')}
                                          >
                                            Triwulan {['I', 'II', 'III', 'IV'][q - 1]}
                                          </Link>
                                        ))}
                                        {hasSemester1 && (
                                          <Link
                                            href={`/arsip/${type.toLowerCase()}/${year}/sem1`}
                                            onClick={() => setOpen(false)}
                                            className={cn("text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors", pathname === `/arsip/${type.toLowerCase()}/${year}/sem1` ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50')}
                                          >
                                            Semester 1
                                          </Link>
                                        )}
                                        {hasSemester2 && (
                                          <Link
                                            href={`/arsip/${type.toLowerCase()}/${year}/sem2`}
                                            onClick={() => setOpen(false)}
                                            className={cn("text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors", pathname === `/arsip/${type.toLowerCase()}/${year}/sem2` ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50')}
                                          >
                                            Semester 2
                                          </Link>
                                        )}
                                        {hasTahunan && (
                                          <Link
                                            href={`/arsip/${type.toLowerCase()}/${year}/tahunan`}
                                            onClick={() => setOpen(false)}
                                            className={cn("text-[11px] font-bold col-span-2 px-2 py-1.5 rounded-lg transition-colors text-center mt-0.5", pathname === `/arsip/${type.toLowerCase()}/${year}/tahunan` ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100/80 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50')}
                                          >
                                            Tahunan
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>"""
    content = content.replace(arsip_old, arsip_new)

    with open('components/shared/PublicNavbar.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Success")
except Exception as e:
    print(f"Error: {e}")
