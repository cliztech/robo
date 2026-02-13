export const motion = {
  easing: {
    standard: [0.22, 1, 0.36, 1] as const,
    accelerate: [0.3, 0, 0.8, 0.15] as const,
    decelerate: [0.05, 0.7, 0.1, 1] as const,
  },
  durationMs: {
    micro: 140,
    quick: 200,
    standard: 280,
    route: 420,
  },
  spring: {
    gentle: { type: 'spring', stiffness: 280, damping: 30, mass: 0.9 },
    snappy: { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 },
  },
} as const;

export const reducedMotion = {
  durationMs: {
    micro: 80,
    quick: 100,
    standard: 140,
    route: 140,
  },
  strategy: {
    movement: 'opacity-only',
    disableDecorativeLoops: true,
  },
} as const;
