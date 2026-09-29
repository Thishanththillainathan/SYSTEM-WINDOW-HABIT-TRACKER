export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const timeoutMs = options.timeoutMs ?? 25000; // 25-second timeout for Render cold-starts & API calls
  const isGetRequest = !options.method || options.method.toUpperCase() === 'GET';
  const maxRetries = options.retries ?? (isGetRequest ? 1 : 0);

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timer);
      return response;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      
      if (err.name === 'AbortError') {
        throw new Error('Server response timed out. Please check your connection and try again.');
      }
      
      attempt++;
      if (attempt <= maxRetries) {
        // Wait 1.5 seconds before retrying GET requests
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  throw lastError || new Error('Network error connecting to backend server.');
}
