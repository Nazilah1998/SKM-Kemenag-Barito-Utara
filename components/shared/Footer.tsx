'use client'

import Image from 'next/image'

export function Footer() {

  return (
    <footer className="border-t border-gray-100 bg-white py-8">
      <div className="flex flex-col items-center gap-1.5 text-center px-4">
        <div className="flex flex-col items-center justify-center mb-2 gap-2">
          <Image src="/hapakat.png" alt="HAPAKAT Logo" width={120} height={40} className="object-contain opacity-90 hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-xs text-gray-600 font-medium">
          <span className="text-emerald-600 font-bold">H</span>armonis, <span className="text-emerald-600 font-bold">A</span>manah, <span className="text-emerald-600 font-bold">P</span>rofesional, <span className="text-emerald-600 font-bold">A</span>kuntabel, <span className="text-emerald-600 font-bold">K</span>reatif, <span className="text-emerald-600 font-bold">A</span>dil dan <span className="text-emerald-600 font-bold">T</span>ransparan
        </p>
        <div className="mt-3 h-px w-16 bg-gray-200 rounded-full"></div>
        <p className="text-[11px] text-gray-400 mt-2">
          &copy; {new Date().getFullYear()} Kemenag Barito Utara. Hak Cipta Dilindungi. | <a href="https://baritoutara.kemenag.go.id" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">baritoutara.kemenag.go.id</a>
        </p>
      </div>
    </footer>
  )
}
