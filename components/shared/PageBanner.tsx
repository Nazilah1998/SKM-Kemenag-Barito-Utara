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
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 py-16 text-white md:py-24">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 size-72 rounded-full bg-white/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-72 rounded-full bg-white/10 blur-3xl"></div>

      <div className="relative mx-auto w-full px-6 sm:px-10 lg:px-16 xl:px-20 text-center flex flex-col items-center">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm text-emerald-100/80">
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
          className="max-w-3xl"
        >
          {eyebrow && (
            <span className="mb-3 block text-sm font-semibold uppercase tracking-wider text-teal-200">
              {eyebrow}
            </span>
          )}
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-balance">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-6 text-lg text-emerald-50/90 text-balance md:text-xl">
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
