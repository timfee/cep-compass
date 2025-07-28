/**
 * Test utility functions for creating mock objects and responses
 */

export interface MockResponseOptions {
  /** Response data to be JSON.stringify'd */
  data?: unknown;
  /** HTTP status code */
  status?: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Whether the response is ok (status 200-299) */
  ok?: boolean;
  /** Status text */
  statusText?: string;
}

/**
 * Creates a mock Response object for testing fetch calls
 * @param options Configuration options for the mock response
 * @returns A mock Response object that can be used with Promise.resolve()
 */
export function createMockResponse(options: MockResponseOptions = {}): Response {
  const {
    data = {},
    status = 200,
    headers = { 'Content-Type': 'application/json' },
    ok = status >= 200 && status < 300,
    statusText = ok ? 'OK' : 'Error'
  } = options;

  // Create a mock object that behaves like Response but allows multiple json() calls
  const mockResponse = {
    json: () => Promise.resolve(data),
    ok,
    status,
    statusText,
    headers: new Headers(headers),
    // Add other Response properties that might be needed
    url: '',
    redirected: false,
    type: 'basic' as ResponseType,
    clone: () => mockResponse,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(JSON.stringify(data))
  };

  return mockResponse as unknown as Response;
}