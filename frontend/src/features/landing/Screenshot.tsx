// Real product screenshots for the marketing landing page.
//
// The files under public/screenshots/ are captured from the running app by
// scripts/capture-screenshots.mjs — see that script to re-shoot them after a
// UI change. Each view exists as a light/dark pair; we ship both and let CSS
// pick, so the landing page keeps working in either theme.
//
// Clicking a screenshot opens it full-size in a lightbox. The overlay is
// portalled to <body>: rendered in place it would be clipped by BrowserFrame's
// overflow-hidden, and the hero's 3D transform would make `position: fixed`
// resolve against the tilted card instead of the viewport.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getLandingCopy } from './copy';
import { useLanguage } from '../language/LanguageContext';

export type ShotName =
  | 'dashboard'
  | 'calendar-month'
  | 'patient-overview'
  | 'patient-vitals'
  | 'patient-billing'
  | 'appointment-modal'
  | 'prescription-modal'
  | 'invoices'
  | 'stock';

interface ScreenshotProps {
  name: ShotName;
  alt: string;
  /** The hero shot is above the fold — load it eagerly, lazy-load the rest. */
  priority?: boolean;
  className?: string;
}

/** The light/dark pair. Only one is ever displayed; CSS picks. */
const ShotPair: React.FC<{
  name: ShotName;
  alt: string;
  loading: 'eager' | 'lazy';
  className?: string;
}> = ({ name, alt, loading, className }) => (
  <>
    <img
      src={`/screenshots/${name}-light.png`}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn(className, 'dark:hidden')}
    />
    <img
      src={`/screenshots/${name}-dark.png`}
      alt={alt}
      loading={loading}
      decoding="async"
      aria-hidden
      className={cn(className, 'hidden dark:block')}
    />
  </>
);

const Lightbox: React.FC<{ name: ShotName; alt: string; onClose: () => void }> = ({
  name,
  alt,
  onClose,
}) => {
  const copy = getLandingCopy(useLanguage().language);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Freeze the page behind the overlay.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-surface-950/80 backdrop-blur-sm animate-blur-in cursor-zoom-out"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={copy.a11y.closeImage}
        className="absolute top-4 end-4 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
      >
        <X size={18} />
      </button>

      {/* Clicks on the image itself must not fall through to the backdrop. */}
      <figure
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[88vh] cursor-default"
      >
        <ShotPair
          name={name}
          alt={alt}
          loading="eager"
          className="max-w-[92vw] max-h-[80vh] w-auto h-auto rounded-xl border border-white/15 shadow-elevated"
        />
        <figcaption className="mt-3 text-center text-sm text-white/70">{alt}</figcaption>
      </figure>
    </div>,
    document.body,
  );
};

export const Screenshot: React.FC<ScreenshotProps> = ({
  name,
  alt,
  priority = false,
  className,
}) => {
  const copy = getLandingCopy(useLanguage().language);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${alt} — ${copy.a11y.expandImage}`}
        className="group relative block w-full h-full cursor-zoom-in"
      >
        <ShotPair
          name={name}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className={cn('w-full h-full object-cover object-left-top', className)}
        />
        {/* Hover affordance — hidden from AT, the button already announces itself. */}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-surface-950/0 group-hover:bg-surface-950/25 group-focus-visible:bg-surface-950/25 transition-colors"
        >
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/90 text-surface-900 shadow-elevated opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100 transition-all">
            <Maximize2 size={18} />
          </span>
        </span>
      </button>

      {open && <Lightbox name={name} alt={alt} onClose={close} />}
    </>
  );
};
