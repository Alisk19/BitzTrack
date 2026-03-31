import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * ScrollableTable — Premium bottom-scrollbar table wrapper.
 *
 * • Native scrollbar on the table body is hidden (no ugly default browser bar).
 * • A thin BOTTOM proxy scrollbar fades in when the wrapper is hovered.
 * • The proxy scrollbar bi-directionally mirrors the actual table scroll.
 * • Supports Shift+Wheel horizontal scroll and trackpad gestures.
 * • Uses multiple observers (ResizeObserver, MutationObserver, rAF polling)
 *   so it always picks up overflow even when rows load asynchronously.
 */
const ScrollableTable: React.FC<ScrollableTableProps> = ({ children, className = '' }) => {
  const wrapperRef     = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const bottomBarRef   = useRef<HTMLDivElement>(null);
  const proxyInnerRef  = useRef<HTMLDivElement>(null);
  const isSyncingRef   = useRef(false);
  const rafRef         = useRef<number>(0);

  const [isHovered,   setIsHovered]   = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  /* ─── Core measure function ─────────────────────────────────── */
  const measure = useCallback(() => {
    const tableEl = tableScrollRef.current;
    const inner   = proxyInnerRef.current;
    if (!tableEl) return;
    const sw = tableEl.scrollWidth;
    const cw = tableEl.clientWidth;
    const overflows = sw > cw + 1;
    setHasOverflow(overflows);
    if (inner) inner.style.width = `${sw}px`;
  }, []);

  /* ─── Poll via rAF until content stabilises (handles async data) */
  const startPolling = useCallback(() => {
    let ticks = 0;
    const poll = () => {
      measure();
      if (++ticks < 60) {           // poll for ~1 second at 60fps
        rafRef.current = requestAnimationFrame(poll);
      }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(poll);
  }, [measure]);

  /* ─── ResizeObserver ─────────────────────────────────────────── */
  useEffect(() => {
    startPolling();
    const ro = new ResizeObserver(measure);
    if (tableScrollRef.current) ro.observe(tableScrollRef.current);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [measure, startPolling]);

  /* ─── MutationObserver (rows load async from Firestore) ──────── */
  useEffect(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    const mo = new MutationObserver(startPolling);
    mo.observe(el, { childList: true, subtree: true, attributes: true });
    return () => mo.disconnect();
  }, [startPolling]);

  /* ─── Window resize ─────────────────────────────────────────── */
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  /* ─── Re-measure when children prop changes ──────────────────── */
  useEffect(() => {
    startPolling();
  }, [children, startPolling]);

  /* ─── Scroll sync: proxy → table ────────────────────────────── */
  const onProxyScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (tableScrollRef.current && bottomBarRef.current)
      tableScrollRef.current.scrollLeft = bottomBarRef.current.scrollLeft;
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, []);

  /* ─── Scroll sync: table → proxy ────────────────────────────── */
  const onTableScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (bottomBarRef.current && tableScrollRef.current)
      bottomBarRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  }, []);

  /* ─── Shift + Wheel = horizontal scroll ─────────────────────── */
  const onWheel = useCallback((e: WheelEvent) => {
    if (!tableScrollRef.current) return;
    // Horizontal trackpad gesture or Shift+Wheel
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      e.preventDefault();
      const delta = e.shiftKey ? e.deltaY : e.deltaX;
      tableScrollRef.current.scrollLeft += delta;
      if (bottomBarRef.current)
        bottomBarRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  return (
    <div
      ref={wrapperRef}
      className={`st-wrapper ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Actual table (scrolls silently — no visible scrollbar) ── */}
      <div
        ref={tableScrollRef}
        className="st-body"
        onScroll={onTableScroll}
      >
        {children}
      </div>

      {/* ── Bottom proxy scrollbar — fades in on hover ── */}
      <div
        ref={bottomBarRef}
        className="st-bottom-bar"
        onScroll={onProxyScroll}
        style={{
          opacity: (isHovered && hasOverflow) ? 1 : 0,
          pointerEvents: (isHovered && hasOverflow) ? 'auto' : 'none',
          height: hasOverflow ? '8px' : '0px',
          marginTop: hasOverflow ? '2px' : '0px',
          transition: 'opacity 0.3s cubic-bezier(0.16,1,0.3,1), height 0.15s ease, margin-top 0.15s ease',
        }}
        aria-hidden="true"
      >
        <div ref={proxyInnerRef} className="st-bottom-inner" />
      </div>
    </div>
  );
};

export default ScrollableTable;
