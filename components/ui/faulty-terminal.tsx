"use client";

import { useEffect, useRef } from "react";

export interface FaultyTerminalProps {
  scale?: number;
  digitSize?: number;
  scanlineIntensity?: number;
  glitchAmount?: number;
  flickerAmount?: number;
  noiseAmp?: number;
  chromaticAberration?: number;
  dither?: number;
  curvature?: number;
  tint?: string;
  mouseReact?: boolean;
  mouseStrength?: number;
  brightness?: number;
  className?: string;
}

const CHARSET = "01#$%&*+-:.<>/\\";

function hash(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [184, 255, 0];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/**
 * Canvas2D reconstruction of react-bits' FaultyTerminal — a CRT-style grid
 * of glitching terminal glyphs. Same prop surface as the WebGL/OGL original;
 * reimplemented on Canvas2D so it renders reliably as a decorative section
 * background without a shader-compile dependency.
 */
export function FaultyTerminal({
  scale = 1.5,
  digitSize = 1.2,
  scanlineIntensity = 0.5,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  chromaticAberration = 0,
  dither = 0,
  curvature = 0.1,
  tint = "#b8ff00",
  mouseReact = true,
  mouseStrength = 0.5,
  brightness = 0.6,
  className = "",
}: FaultyTerminalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [r, g, b] = hexToRgb(tint);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cellPx = Math.max(10, 20 / scale);

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    // Per-row glitch offset timers, re-rolled independently of the draw loop
    let rowGlitch: number[] = [];

    function resize() {
      const rect = container!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / cellPx) + 1;
      rows = Math.ceil(height / cellPx) + 1;
      rowGlitch = new Array(rows).fill(0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    function onMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        active: true,
      };
    }
    if (mouseReact) container.addEventListener("mousemove", onMouseMove);

    const fontSize = Math.max(8, cellPx * digitSize * 0.72);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    let raf = 0;
    let start = performance.now();

    function frame(now: number) {
      const t = (now - start) / 1000;

      // Global flicker — sum of two slow sines plus an occasional random dip
      const flicker =
        1 -
        flickerAmount *
          (0.08 * (1 + Math.sin(t * 7)) +
            (hash(Math.floor(t * 6), 0, 1) < 0.05 ? 0.3 : 0));

      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = "source-over";

      const timeBucket = Math.floor(t * 4); // glyphs/brightness re-roll ~4x/sec
      const mouse = mouseRef.current;

      for (let row = 0; row < rows; row++) {
        // Rare per-row horizontal glitch offset
        if (rowGlitch[row] <= 0 && hash(row, timeBucket, 3) < 0.008 * glitchAmount) {
          rowGlitch[row] = 4 + Math.floor(hash(row, timeBucket, 4) * 8);
        }
        const glitching = rowGlitch[row] > 0;
        if (glitching) rowGlitch[row]--;
        const offsetX = glitching ? (hash(row, timeBucket, 5) - 0.5) * cellPx * 6 : 0;

        for (let col = 0; col < cols; col++) {
          const cx = col * cellPx + cellPx / 2 + offsetX;
          const cy = row * cellPx + cellPx / 2;

          const charSeed = hash(col, row, timeBucket);
          const char = CHARSET[Math.floor(charSeed * CHARSET.length)];

          let alpha =
            brightness *
            flicker *
            (0.25 + noiseAmp * 0.5 * hash(col, row, timeBucket + 0.5)) *
            (glitching ? 1.6 : 1);

          if (mouseReact && mouse.active) {
            const nx = cx / width;
            const ny = cy / height;
            const dist = Math.hypot(nx - mouse.x, ny - mouse.y);
            alpha += mouseStrength * Math.max(0, 1 - dist * 3);
          }
          alpha = Math.min(1, Math.max(0, alpha));
          if (alpha < 0.02) continue;

          if (chromaticAberration > 0.05) {
            ctx!.fillStyle = `rgba(255,80,80,${alpha * 0.35})`;
            ctx!.fillText(char, cx - chromaticAberration, cy);
            ctx!.fillStyle = `rgba(80,220,255,${alpha * 0.35})`;
            ctx!.fillText(char, cx + chromaticAberration, cy);
          }
          ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx!.fillText(char, cx, cy);
        }
      }

      // Scanlines
      if (scanlineIntensity > 0) {
        ctx!.fillStyle = `rgba(0,0,0,${Math.min(0.5, scanlineIntensity * 0.35)})`;
        for (let y = 0; y < height; y += 3) {
          ctx!.fillRect(0, y, width, 1);
        }
      }

      // Dither (subtle tiled noise to break up banding)
      if (dither > 0) {
        ctx!.fillStyle = `rgba(255,255,255,${dither * 0.03})`;
        for (let i = 0; i < 40; i++) {
          const x = hash(i, timeBucket, 9) * width;
          const y = hash(i, timeBucket, 11) * height;
          ctx!.fillRect(x, y, 1, 1);
        }
      }

      // Curvature vignette (CRT edge darkening)
      if (curvature > 0) {
        const grad = ctx!.createRadialGradient(
          width / 2, height / 2, Math.min(width, height) * 0.3,
          width / 2, height / 2, Math.max(width, height) * 0.75
        );
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(1, `rgba(0,0,0,${Math.min(0.6, curvature * 2)})`);
        ctx!.fillStyle = grad;
        ctx!.fillRect(0, 0, width, height);
      }

      if (!reducedMotion) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    if (reducedMotion) {
      // Draw exactly one frame for users who don't want motion
      cancelAnimationFrame(raf);
      frame(performance.now());
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (mouseReact) container!.removeEventListener("mousemove", onMouseMove);
    };
  }, [scale, digitSize, scanlineIntensity, glitchAmount, flickerAmount, noiseAmp, chromaticAberration, dither, curvature, tint, mouseReact, mouseStrength, brightness]);

  return <canvas ref={canvasRef} className={`block ${className}`} />;
}
