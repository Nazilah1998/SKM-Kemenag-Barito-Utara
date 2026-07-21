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
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 py-16 text-white md:py-24">
      {/* Mesh Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Decorative background glow circles */}
      <div className="absolute top-0 right-10 -mt-20 size-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-20 size-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

      <div className="relative mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center z-10">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm text-emerald-200/80">
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
                  <ChevronRight className="size-4" />
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
            <span className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-extrabold uppercase tracking-widest text-emerald-200 backdrop-blur-md shadow-xs">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              {eyebrow}
            </span>
          )}
          <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-balance leading-tight text-white">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-6 text-base text-emerald-100/90 text-balance md:text-lg font-medium leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </motion.div>
        
        {children && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
