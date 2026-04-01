import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useId,
} from 'react';
import { createPortal } from 'react-dom';

/* ─────────────────────────────────────────────────────────────────────────
   FloatingScrollbar — a SINGLE fixed-to-viewport scrollbar rendered via
   a React portal.  It is shared across all ScrollableTable instances on
   the page.  The active table's geometry is pushed into it via a tiny
   global event bus so the bar always represents the currently-hovered table.
   ───────────────────────────────────────────────────────────────────────── */

type FloatingBarEvent = {
  type: 'activate';
  tableId: string;
  left: number;
  width: number;
  scrollLeft: number;
  scrollWidth: number;
  onBarScroll: (left: number) => void;
} | {
  type: 'deactivate';
  tableId: string;
} | {
  type: 'syncScroll';
  tableId: string;
  scrollLeft: number;
};

// Simple global event emitter (no dependencies needed)
type Listener = (e: FloatingBarEvent) => void;
const listeners: Set<Listener> = new Set();
const floatingBus = {
  emit: (e: FloatingBarEvent) => listeners.forEach(fn => fn(e)),
  on:   (fn: Listener) => { listeners.add(fn); return () => listeners.delete(fn); },
};

/* ── The single floating bar component ───────────────────────────────── */
const FloatingScrollbar: React.FC = () => {
  const barRef        = useRef<HTMLDivElement>(null);
  const innerRef      = useRef<HTMLDivElement>(null);
  const isSyncingRef  = useRef(false);
  const hideTimerRef  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeIdRef   = useRef<string | null>(null);
  const onBarScrollCb = useRef<((left: number) => void) | null>(null);

  const [visible, setVisible] = useState(false);
  const [geometry, setGeometry] = useState({ left: 0, width: 0, scrollWidth: 0 });

  const show = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setVisible(true);
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 600);
  }, []);

  // Listen to bus events
  useEffect(() => {
    const off = floatingBus.on((e) => {
      if (e.type === 'activate') {
        activeIdRef.current   = e.tableId;
        onBarScrollCb.current = e.onBarScroll;
        setGeometry({ left: e.left, width: e.width, scrollWidth: e.scrollWidth });

        // Sync bar's scrollLeft to match the table
        if (barRef.current) {
          isSyncingRef.current = true;
          barRef.current.scrollLeft = e.scrollLeft;
          requestAnimationFrame(() => { isSyncingRef.current = false; });
        }
        show();
      } else if (e.type === 'deactivate') {
        if (activeIdRef.current === e.tableId) {
          scheduleHide();
        }
      } else if (e.type === 'syncScroll') {
        if (activeIdRef.current === e.tableId && barRef.current) {
          if (isSyncingRef.current) return;
          isSyncingRef.current = true;
          barRef.current.scrollLeft = e.scrollLeft;
          requestAnimationFrame(() => { isSyncingRef.current = false; });
        }
      }
    });
    return off;
  }, [show, scheduleHide]);

  // Update inner width when geometry changes
  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.style.width = `${geometry.scrollWidth}px`;
    }
  }, [geometry.scrollWidth]);

  const onBarScroll = useCallback(() => {
    if (isSyncingRef.current || !barRef.current) return;
    isSyncingRef.current = true;
    onBarScrollCb.current?.(barRef.current.scrollLeft);
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, []);

  const hasOverflow = geometry.scrollWidth > geometry.width + 1;

  if (!hasOverflow) return null;

  return createPortal(
    <div
      ref={barRef}
      onScroll={onBarScroll}
      onMouseEnter={show}
      onMouseLeave={scheduleHide}
      aria-hidden="true"
      data-floating-scrollbar="true"
      style={{
        position: 'fixed',
        bottom: '6px',
        left:   `${geometry.left}px`,
        width:  `${geometry.width}px`,
        height: '10px',
        zIndex: 9999,
        overflowX: 'auto',
        overflowY: 'hidden',
        opacity:   visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), left 0.15s ease, width 0.15s ease',
        borderRadius: '99px',
        /* Firefox */
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(212,175,55,0.7) rgba(40,40,40,0.6)',
      } as React.CSSProperties}
    >
      <div
        ref={innerRef}
        style={{ height: '1px', minWidth: '100%' }}
      />
    </div>,
    document.body
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   ScrollableTable — the per-table wrapper component
   ───────────────────────────────────────────────────────────────────────── */

interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
}

// Global registry of portal-ownership setters.
// The first registered setter "owns" the portal (renders it).
const portalOwnerRegistry: Set<React.Dispatch<React.SetStateAction<boolean>>> = new Set();

const ScrollableTable: React.FC<ScrollableTableProps> = ({ children, className = '' }) => {
  const tableId        = useId();
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef   = useRef(false);
  const rafRef         = useRef<number>(0);
  const isActiveRef    = useRef(false);   // true while mouse is over this table

  const [renderPortal, setRenderPortal] = useState(false);

  // Claim / release portal ownership
  useEffect(() => {
    portalOwnerRegistry.add(setRenderPortal);
    // The first in the set is the owner
    const reassign = () => {
      let first = true;
      portalOwnerRegistry.forEach((setter) => {
        setter(first);
        first = false;
      });
    };
    reassign();
    return () => {
      portalOwnerRegistry.delete(setRenderPortal);
      setRenderPortal(false);
      reassign();
    };
  }, []);


  /* ── Measure & broadcast geometry ─────────────────────────────────── */
  const broadcastGeometry = useCallback((scrollLeft?: number) => {
    const el = tableScrollRef.current;
    if (!el || !isActiveRef.current) return;   // only broadcast while hovered
    const rect = el.getBoundingClientRect();
    floatingBus.emit({
      type:        'activate',
      tableId,
      left:        rect.left,
      width:       rect.width,
      scrollLeft:  scrollLeft ?? el.scrollLeft,
      scrollWidth: el.scrollWidth,
      onBarScroll: (left) => {
        if (isSyncingRef.current || !tableScrollRef.current) return;
        isSyncingRef.current = true;
        tableScrollRef.current.scrollLeft = left;
        requestAnimationFrame(() => { isSyncingRef.current = false; });
      },
    });
  }, [tableId]);

  /* ── One-shot measure (no broadcast) for overflow detection on init ── */
  const measureSilent = useCallback(() => {
    /* intentionally empty — ResizeObserver fires broadcastGeometry which
       self-guards on isActiveRef, so no-op when not hovered. */
  }, []);

  /* ── rAF poll for async content ───────────────────────────────────── */
  const startPolling = useCallback(() => {
    let ticks = 0;
    const poll = () => {
      broadcastGeometry();
      if (++ticks < 60) rafRef.current = requestAnimationFrame(poll);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(poll);
  }, [broadcastGeometry]);

  /* ── ResizeObserver ────────────────────────────────────────────────── */
  useEffect(() => {
    startPolling();
    const ro = new ResizeObserver(() => broadcastGeometry());
    if (tableScrollRef.current) ro.observe(tableScrollRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, [broadcastGeometry, startPolling]);

  /* ── MutationObserver (async rows from Firestore) ─────────────────── */
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const mo = new MutationObserver(startPolling);
    mo.observe(el, { childList: true, subtree: true, attributes: true });
    return () => mo.disconnect();
  }, [startPolling]);

  /* ── Window resize ─────────────────────────────────────────────────── */
  useEffect(() => {
    const onResize = () => broadcastGeometry();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [broadcastGeometry]);

  /* ── Re-measure on children change ────────────────────────────────── */
  useEffect(() => { startPolling(); }, [children, startPolling]);

  /* ── Hover handlers ─────────────────────────────────────────── */
  const onMouseEnter = useCallback(() => {
    isActiveRef.current = true;
    broadcastGeometry();
  }, [broadcastGeometry]);

  const onMouseLeave = useCallback(() => {
    isActiveRef.current = false;
    floatingBus.emit({ type: 'deactivate', tableId });
  }, [tableId]);

  /* ── Table native scroll → sync floating bar ──────────────────────── */
  const onTableScroll = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    floatingBus.emit({ type: 'syncScroll', tableId, scrollLeft: el.scrollLeft });
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, [tableId]);

  /* ── Shift+Wheel / trackpad horizontal ────────────────────────────── */
  const onWheel = useCallback((e: WheelEvent) => {
    const el = tableScrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      e.preventDefault();
      el.scrollLeft += e.shiftKey ? e.deltaY : e.deltaX;
      floatingBus.emit({ type: 'syncScroll', tableId, scrollLeft: el.scrollLeft });
    }
  }, [tableId]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  return (
    <>
      {/* First instance renders the one shared portal */}
      {renderPortal && <FloatingScrollbar />}

      <div
        ref={wrapperRef}
        className={`st-wrapper ${className}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Table scroll container — native scrollbar hidden */}
        <div
          ref={tableScrollRef}
          className="st-body"
          onScroll={onTableScroll}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default ScrollableTable;
