interface ApiCallLog {
  timestamp: string;
  service: string;
  endpoint: string;
  status: number;
  durationMs: number;
}

class UsageMetricsService {
  private logsKey = 'sakae:api_call_logs';

  logCall(service: string, endpoint: string, status: number, durationMs: number) {
    try {
      const logs = this.getLogs();
      logs.push({
        timestamp: new Date().toISOString(),
        service,
        endpoint,
        status,
        durationMs
      });
      // Cap at 1000 logs to prevent LocalStorage bloat
      if (logs.length > 1000) {
        logs.shift();
      }
      localStorage.setItem(this.logsKey, JSON.stringify(logs));
    } catch (e) {
      console.warn('[UsageMetricsService] Failed to save api call log', e);
    }
  }

  getLogs(): ApiCallLog[] {
    try {
      const data = localStorage.getItem(this.logsKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  clearLogs() {
    try {
      localStorage.removeItem(this.logsKey);
    } catch {}
  }
}

export const usageMetricsService = new UsageMetricsService();
