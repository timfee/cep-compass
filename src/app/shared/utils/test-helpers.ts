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
 * Mock Response interface that extends the standard Response interface
 * This represents a test mock object, not a real Response instance
 */
export interface MockResponse extends Response {
  /** Mock implementation that allows multiple json() calls */
  json(): Promise<unknown>;
}

/**
 * Creates a mock Response object for testing fetch calls.
 * 
 * ⚠️ **Important**: This creates a mock object that implements the Response interface
 * but is NOT a real Response instance. It's designed for testing purposes and includes
 * mock implementations that may behave differently from the real Response API
 * (e.g., allows multiple json() calls).
 * 
 * @param options Configuration options for the mock response
 * @returns A mock object implementing the Response interface for use in tests
 */
export function createMockResponse(options: MockResponseOptions = {}): MockResponse {
  const {
    data = {},
    status = 200,
    headers = { 'Content-Type': 'application/json' },
    ok = status >= 200 && status < 300,
    statusText = ok ? 'OK' : 'Error'
  } = options;

  // Create a mock object that implements the Response interface for testing
  // Note: This is not a real Response instance but a mock with similar behavior
  const mockResponse: MockResponse = {
    json: () => Promise.resolve(data),
    ok,
    status,
    statusText,
    headers: new Headers(headers),
    // Standard Response properties
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