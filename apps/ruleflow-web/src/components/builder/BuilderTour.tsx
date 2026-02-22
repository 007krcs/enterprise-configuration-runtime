'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { markTourCompleted, isTourCompleted, onTourRestart } from '@/lib/tour';
import styles from './builder-tour.module.css';

type TourStep = {
  id: string;
  title: string;
  body: string;
  selector: string;
  optional?: boolean;
};

const steps: TourStep[] = [
  {
    id: 'palette',
    title: 'Component Palette',
    body: 'Pick adapters, drag them onto the canvas, and sprinkle metadata into each schema component.',
    selector: '[data-tour-target="palette"]',
  },
  {
    id: 'canvas',
    title: 'Canvas Workspace',
    body: 'Arrange elements, snap to grid, and see interactions exactly where they render.',
    selector: '[data-tour-target="canvas"]',
  },
  {
    id: 'inspector',
    title: 'Inspector Panel',
    body: 'Edit props, bindings, accessibility, and context rules for the selected component.',
    selector: '[data-tour-target="inspector"]',
  },
  {
    id: 'rules-panel',
    title: 'Rules Panel',
    body: 'Tame guard conditions and rule sets that power visibility, validation, and flow transitions.',
    selector: '[data-tour-target="rules-panel"]',
    optional: true,
  },
  {
    id: 'flow-bindings',
    title: 'Flow State Bindings',
    body: 'Map flow states to pages so runtime transitions resolve the correct layouts.',
    selector: '[data-tour-target="flow-bindings"]',
  },
  {
    id: 'preview-toggle',
    title: 'Preview Button',
    body: 'Instantly inspect the runtime output from the current schema and context.',
    selector: '[data-tour-target="preview-toggle"]',
  },
  {
    id: 'export-json',
    title: 'Export JSON',
    body: 'Download or review the generated bundle JSON to publish or version-control.',
    selector: '[data-tour-target="export-json"]',
  },
];

const noop = () => undefined;

export function BuilderTour() {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isTourCompleted()) {
      setVisible(true);
    }
    return onTourRestart(() => {
      setCurrentStep(0);
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    if (!visible) return noop;

    const step = steps[currentStep];
    if (!step) return noop;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      if (step.optional) {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      }
      return noop;
    }

    const updateRect = () => {
      setRect(el.getBoundingClientRect());
    };

    updateRect();

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateRect) : null;
    resizeObserver?.observe(el);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [visible, currentStep]);

  const handleNext = () => {
    if (currentStep >= steps.length - 1) {
      markTourCompleted(true);
      setVisible(false);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    markTourCompleted(true);
    setVisible(false);
  };

  const step = steps[currentStep];
  if (!step) return null;

  const tooltipStyle = useMemo<CSSProperties | undefined>(() => {
    if (!rect) return undefined;
    if (typeof window === 'undefined') return undefined;
    const top = rect.bottom + 12;
    const left = rect.left + rect.width / 2;
    return {
      top: Math.min(window.innerHeight - 120, top),
      left: Math.min(window.innerWidth - 280, Math.max(12, left - 140)),
    };
  }, [rect]);

  if (!visible) return null;

  const highlightStyle: CSSProperties | undefined = rect
    ? {
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      }
    : undefined;

  return (
    <div className={styles.tour}> 
      <div className={styles.backdrop} />
      {rect && <div className={styles.highlight} style={highlightStyle} aria-hidden />}
      <div className={styles.tooltip} style={tooltipStyle} role="dialog" aria-live="polite" aria-labelledby="tour-title">
        <div className={styles.tooltipHeader}>
          <p id="tour-title" className={styles.tooltipTitle}>{step.title}</p>
          <button type="button" onClick={handleClose} className={styles.closeButton}>×</button>
        </div>
        <p className={styles.tooltipBody}>{step.body}</p>
        <div className={styles.controls}>
          <button type="button" onClick={handlePrev} disabled={currentStep === 0} className={styles.controlButton}>
            Previous
          </button>
          <button type="button" onClick={handleNext} className={styles.actionButton}>
            {currentStep === steps.length - 1 ? 'Finish Tour' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
