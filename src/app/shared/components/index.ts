
export { ErrorDisplayComponent } from './error-display.component';
export { LoadingComponent } from './loading.component';

/**
 * Email validation utilities
 */
export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  static isValid(email: unknown): boolean {
    if (typeof email !== 'string') return false;
    if (!email) return false;
    return this.EMAIL_REGEX.test(email.trim());
  }
}

/**
 * Test utility functions for creating mock objects and responses
 */
export interface MockResponseOptions {
  data?: unknown;
  status?: number;
  headers?: Record<string, string>;
  ok?: boolean;
  statusText?: string;
}

export interface MockResponse extends Response {
  json(): Promise<unknown>;
}

export function createMockResponse(options: MockResponseOptions = {}): MockResponse {
  const {
    data = {},
    status = 200,
    headers = { 'Content-Type': 'application/json' },
    ok = status >= 200 && status < 300,
    statusText = ok ? 'OK' : 'Error'
  } = options;

  const mockResponse: MockResponse = {
    json: () => Promise.resolve(data),
    ok,
    status,
    statusText,
    headers: new Headers(headers),
    url: '',
    redirected: false,
    type: 'basic' as ResponseType,
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    bytes: () => Promise.resolve(new Uint8Array()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(data))
  };

  return mockResponse;
}