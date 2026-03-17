'use client';

import { cn } from '@/lib/utils';

interface SkipLinksProps {
  className?: string;
}

export function SkipLinks({ className }: SkipLinksProps) {
  return (
    <div className={cn('sr-only focus-within:not-sr-only', className)}>
      <a
        href="#main-content"
        className="bg-background text-foreground focus:ring-ring absolute top-4 left-4 z-50 -translate-y-full transform rounded-md border px-4 py-2 shadow-lg transition-transform duration-200 focus:translate-y-0 focus:ring-2 focus:ring-offset-2 focus:outline-none">
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="bg-background text-foreground focus:ring-ring absolute top-16 left-4 z-50 -translate-y-full transform rounded-md border px-4 py-2 shadow-lg transition-transform duration-200 focus:translate-y-0 focus:ring-2 focus:ring-offset-2 focus:outline-none">
        Skip to navigation
      </a>
      <a
        href="#examples"
        className="bg-background text-foreground focus:ring-ring absolute top-28 left-4 z-50 -translate-y-full transform rounded-md border px-4 py-2 shadow-lg transition-transform duration-200 focus:translate-y-0 focus:ring-2 focus:ring-offset-2 focus:outline-none">
        Skip to examples
      </a>
    </div>
  );
}
