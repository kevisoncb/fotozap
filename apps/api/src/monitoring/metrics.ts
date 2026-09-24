/**
 * Metrics Collection
 * 
 * In-memory metrics for monitoring (can be exported to Prometheus/Datadog)
 */

interface MetricCounter {
  [key: string]: number;
}

interface MetricHistogram {
  [key: string]: number[];
}

class MetricsCollector {
  private counters: MetricCounter = {};
  private histograms: MetricHistogram = {};

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.counters[key] = (this.counters[key] || 0) + value;
  }

  /**
   * Record a histogram value (for durations, sizes, etc)
   */
  record(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    if (!this.histograms[key]) {
      this.histograms[key] = [];
    }
    this.histograms[key].push(value);

    // Keep only last 1000 values to prevent memory leak
    if (this.histograms[key].length > 1000) {
      this.histograms[key].shift();
    }
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.buildKey(name, labels);
    return this.counters[key] || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogram(name: string, labels?: Record<string, string>): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const key = this.buildKey(name, labels);
    const values = this.histograms[key] || [];

    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  /**
   * Get all metrics as JSON
   */
  getAll(): {
    counters: MetricCounter;
    histograms: Record<string, ReturnType<typeof this.getHistogram>>;
  } {
    const histograms: Record<string, ReturnType<typeof this.getHistogram>> = {};

    for (const key of Object.keys(this.histograms)) {
      histograms[key] = this.getHistogram(key);
    }

    return {
      counters: { ...this.counters },
      histograms,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters = {};
    this.histograms = {};
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");

    return `${name}{${labelStr}}`;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Global singleton
export const metrics = new MetricsCollector();

// Convenience functions for common metrics
export const httpMetrics = {
  requestReceived: (method: string, route: string) =>
    metrics.increment("http_requests_total", 1, { method, route }),

  requestDuration: (method: string, route: string, duration: number) =>
    metrics.record("http_request_duration_ms", duration, { method, route }),

  requestError: (method: string, route: string, statusCode: number) =>
    metrics.increment("http_requests_error_total", 1, { method, route, status: String(statusCode) }),
};

export const dbMetrics = {
  queryExecuted: (operation: string) =>
    metrics.increment("db_queries_total", 1, { operation }),

  queryDuration: (operation: string, duration: number) =>
    metrics.record("db_query_duration_ms", duration, { operation }),

  queryError: (operation: string) =>
    metrics.increment("db_query_errors_total", 1, { operation }),
};

export const workerMetrics = {
  jobStarted: (queue: string) =>
    metrics.increment("worker_jobs_started_total", 1, { queue }),

  jobCompleted: (queue: string, duration: number) => {
    metrics.increment("worker_jobs_completed_total", 1, { queue });
    metrics.record("worker_job_duration_ms", duration, { queue });
  },

  jobFailed: (queue: string) =>
    metrics.increment("worker_jobs_failed_total", 1, { queue }),
};

export const businessMetrics = {
  orderCreated: () => metrics.increment("orders_created_total"),
  paymentApproved: () => metrics.increment("payments_approved_total"),
  generationSucceeded: () => metrics.increment("generations_succeeded_total"),
  generationFailed: () => metrics.increment("generations_failed_total"),
  rateLimitBlocked: (type: string) => metrics.increment("rate_limit_blocked_total", 1, { type }),
};
