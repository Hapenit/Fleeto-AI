export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public metadata?: any;

  constructor(message: string, statusCode: number, errorCode?: string, metadata?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.metadata = metadata;
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.method && options.method.toUpperCase() === 'GET')) {
    headers.set('Content-Type', 'application/json');
  }

  const defaultOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || 'API request failed',
      response.status,
      errorData.errorCode,
      errorData
    );
  }

  return response.json();
}

export const api = {
  get: async <T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> => ({
    data: await fetchApi(endpoint, { ...options, method: 'GET' }),
  }),
  post: async <T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<{ data: T }> => ({
    data: await fetchApi(endpoint, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  }),
  put: async <T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<{ data: T }> => ({
    data: await fetchApi(endpoint, {
      ...options,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  }),
  patch: async <T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<{ data: T }> => ({
    data: await fetchApi(endpoint, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  }),
  delete: async <T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T }> => ({
    data: await fetchApi(endpoint, { ...options, method: 'DELETE' }),
  }),
};
