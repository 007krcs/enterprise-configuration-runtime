import {
  createPortal,
} from 'react-dom';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from './utils';

/* ──── PFPortal ──── */

export interface PFPortalProps {
  children: ReactNode;
  container?: HTMLElement | null;
}

export function PFPortal({ children, container }: PFPortalProps) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMountNode(container ?? document.body);
  }, [container]);

  if (!mountNode) return null;
  return createPortal(children, mountNode);
}

/* ──── PFNoSSR ──── */

export interface PFNoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function PFNoSSR({ children, fallback = null }: PFNoSSRProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return <>{mounted ? children : fallback}</>;
}

/* ──── PFClickAwayListener ──── */

export interface PFClickAwayListenerProps {
  children: ReactNode;
  onClickAway: (event: MouseEvent | TouchEvent) => void;
  mouseEvent?: 'mousedown' | 'mouseup' | 'click' | false;
  touchEvent?: 'touchstart' | 'touchend' | false;
}

export function PFClickAwayListener({
  children,
  onClickAway,
  mouseEvent = 'mousedown',
  touchEvent = 'touchstart',
}: PFClickAwayListenerProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEvent = (event: MouseEvent | TouchEvent): void => {
      if (!nodeRef.current) return;
      if (event.target instanceof Node && nodeRef.current.contains(event.target)) return;
      onClickAway(event);
    };

    if (mouseEvent) document.addEventListener(mouseEvent, handleEvent as EventListener);
    if (touchEvent) document.addEventListener(touchEvent, handleEvent as EventListener);

    return () => {
      if (mouseEvent) document.removeEventListener(mouseEvent, handleEvent as EventListener);
      if (touchEvent) document.removeEventListener(touchEvent, handleEvent as EventListener);
    };
  }, [mouseEvent, onClickAway, touchEvent]);

  return <div ref={nodeRef} style={{ display: 'contents' }}>{children}</div>;
}

/* ──── PFFocusTrap ──── */

export interface PFFocusTrapProps {
  children: ReactNode;
  active?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

export function PFFocusTrap({
  children,
  active = true,
  autoFocus = true,
  restoreFocus = true,
}: PFFocusTrapProps) {
  const trapRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previousFocus.current = document.activeElement as HTMLElement;

    const node = trapRef.current;
    if (!node) return;

    const focusableSelector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    if (autoFocus) {
      const first = node.querySelector<HTMLElement>(focusableSelector);
      first?.focus();
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      if (restoreFocus && previousFocus.current) {
        previousFocus.current.focus();
      }
    };
  }, [active, autoFocus, restoreFocus]);

  return <div ref={trapRef} style={{ display: 'contents' }}>{children}</div>;
}

/* ──── PFTransitionFade ──── */

export interface PFTransitionFadeProps extends HTMLAttributes<HTMLDivElement> {
  in: boolean;
  duration?: number;
  unmountOnExit?: boolean;
}

export function PFTransitionFade({
  in: show,
  duration = 200,
  unmountOnExit = false,
  className,
  style,
  children,
  ...rest
}: PFTransitionFadeProps) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return undefined;
    }
    setVisible(false);
    if (unmountOnExit) {
      const timeout = setTimeout(() => setMounted(false), duration);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [duration, show, unmountOnExit]);

  if (unmountOnExit && !mounted) return null;

  const mergedStyle: CSSProperties = {
    ...style,
    opacity: visible ? 1 : 0,
    transition: `opacity ${duration}ms ease`,
    pointerEvents: visible ? 'auto' : 'none',
  };

  return (
    <div
      className={cn('pf-transition-fade', visible && 'is-visible', className)}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ──── PFMasonry ──── */

export interface PFMasonryProps extends HTMLAttributes<HTMLDivElement> {
  columns?: number;
  gap?: number | string;
}

export function PFMasonry({
  className,
  columns = 3,
  gap = 'var(--pf-space-3)',
  style,
  ...rest
}: PFMasonryProps) {
  const mergedStyle: CSSProperties = {
    ...style,
    '--pf-masonry-columns': String(columns),
    '--pf-masonry-gap': typeof gap === 'number' ? `${gap}px` : gap,
  } as CSSProperties;

  return (
    <div
      className={cn('pf-masonry', className)}
      style={mergedStyle}
      {...rest}
    />
  );
}

/* ──── PFPopper ──── */

export interface PFPopperProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  anchorEl?: HTMLElement | null;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  children: ReactNode;
  className?: string;
}

export function PFPopper({
  open,
  anchorRef,
  anchorEl,
  placement = 'bottom',
  offset = 8,
  children,
  className,
}: PFPopperProps) {
  const popperRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: -9999, left: -9999 });

  const resolvedAnchor = anchorEl ?? anchorRef?.current ?? null;

  useEffect(() => {
    if (!open || !resolvedAnchor) return;

    const update = (): void => {
      const anchor = resolvedAnchor;
      const popper = popperRef.current;
      if (!anchor || !popper) return;

      const anchorRect = anchor.getBoundingClientRect();
      const popperRect = popper.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = anchorRect.top - popperRect.height - offset;
          left = anchorRect.left + anchorRect.width / 2 - popperRect.width / 2;
          break;
        case 'bottom':
          top = anchorRect.bottom + offset;
          left = anchorRect.left + anchorRect.width / 2 - popperRect.width / 2;
          break;
        case 'left':
          top = anchorRect.top + anchorRect.height / 2 - popperRect.height / 2;
          left = anchorRect.left - popperRect.width - offset;
          break;
        case 'right':
          top = anchorRect.top + anchorRect.height / 2 - popperRect.height / 2;
          left = anchorRect.right + offset;
          break;
      }

      const maxLeft = window.innerWidth - popperRect.width - 8;
      const maxTop = window.innerHeight - popperRect.height - 8;
      setPosition({
        left: Math.max(8, Math.min(left, maxLeft)),
        top: Math.max(8, Math.min(top, maxTop)),
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [offset, open, placement, resolvedAnchor]);

  if (!open) return null;

  return (
    <div
      ref={popperRef}
      className={cn('pf-popper', `pf-popper--${placement}`, className)}
      style={{
        position: 'fixed',
        zIndex: 'var(--pf-z-popover, 1300)' as unknown as number,
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>
  );
}
