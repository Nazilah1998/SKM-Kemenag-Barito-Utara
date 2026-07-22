"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBannerProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  eyebrow?: string;
  children?: React.ReactNode;
}

export default function PageBanner({
  title,
  description,
  breadcrumb,
  eyebrow,
  children
}: PageBannerProps) {
  return (
    <section className="relative w-full overflow-hidden bg-emerald-950 pt-10 pb-12 sm:pt-14 sm:pb-16 md:pt-18 md:pb-20 text-white">
      {/* Background image with realistic survey atmosphere */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{ backgroundImage: "url('/hero_survey_bg.png')" }}
      />

      {/* Soft dark teal/emerald overlay with subtle transparency to highlight Kemenag PTSP background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-teal-950/72 to-emerald-950/80 backdrop-blur-[0.5px]" />

      {/* Mesh Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Decorative background glow circles */}
      <div className="absolute top-0 right-10 -mt-20 size-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-20 size-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

      <div className="relative mx-auto w-full px-4 sm:px-8 lg:px-14 xl:px-16 text-center flex flex-col items-center z-10">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-4 flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-sm text-emerald-200/80">
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                {item.href ? (
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{item.label}</span>
                )}
                {index < breadcrumb.length - 1 && (
                  <ChevronRight className="size-3.5" />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl"
        >
          {eyebrow && (
            <span className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-emerald-200 backdrop-blur-md shadow-xs">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              {eyebrow}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-balance leading-tight text-white">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-3.5 text-xs sm:text-sm md:text-base text-emerald-100/90 text-balance font-medium leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </motion.div>
        
        {children && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 sm:mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
