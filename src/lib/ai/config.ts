export const AI_CONFIG = {
  models: {
    analysis: 'gpt-4o',
    quick: 'gpt-4o-mini',
    embedding: 'text-embedding-3-small',
  },
  costs: {
    maxPerTrack: 0.05,
    dailyLimit: 50.0,
    monthlyLimit: 1000.0,
  },
  rateLimit: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    concurrentRequests: 3,
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },

  // Analysis confidence thresholds
  confidence: {
    minimum: 0.7, // Reject below 70%
    high: 0.85, // Mark as high confidence
  },
}
