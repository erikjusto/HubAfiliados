
export interface GeminiUsageLog {
  timestamp: string;
  action: string;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  totalTokens: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export const logGeminiUsage = (log: Omit<GeminiUsageLog, 'timestamp'>) => {
  try {
    const savedLogs = localStorage.getItem('gemini_usage_logs');
    const logs: GeminiUsageLog[] = savedLogs ? JSON.parse(savedLogs) : [];
    
    logs.push({
      ...log,
      timestamp: new Date().toISOString()
    });

    // Keep only last 500 logs to prevent localStorage bloat
    const trimmedLogs = logs.slice(-500);
    localStorage.setItem('gemini_usage_logs', JSON.stringify(trimmedLogs));
  } catch (err) {
    console.error('Failed to log Gemini usage:', err);
  }
};

export const getGeminiUsageLogs = (): GeminiUsageLog[] => {
  try {
    const savedLogs = localStorage.getItem('gemini_usage_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  } catch (err) {
    return [];
  }
};

export const clearGeminiUsageLogs = () => {
  localStorage.removeItem('gemini_usage_logs');
};
