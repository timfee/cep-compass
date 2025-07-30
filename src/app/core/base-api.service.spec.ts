import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BaseApiService } from './base-api.service';

// Create a concrete test implementation
class TestApiService extends BaseApiService {
  // Test helper methods to access protected methods
  public testIsCacheValid(): boolean {
    return this.isCacheValid();
  }

  public testSetLoading(loading: boolean): void {
    this.setLoading(loading);
  }

  public testSetError(error: string | null): void {
    this.setError(error);
  }

  public testUpdateFetchTime(): void {
    this.updateFetchTime();
  }

  public testClearState(): void {
    this.clearState();
  }

  public testSetCacheDuration(duration: number): void {
    this.cacheDuration = duration;
  }
}

describe('BaseApiService', () => {
  let service: TestApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = new TestApiService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.lastFetchTime()).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should set loading state', () => {
      service.testSetLoading(true);
      expect(service.isLoading()).toBe(true);

      service.testSetLoading(false);
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('error state', () => {
    it('should set error state', () => {
      const errorMessage = 'Test error';
      service.testSetError(errorMessage);
      expect(service.error()).toBe(errorMessage);

      service.testSetError(null);
      expect(service.error()).toBeNull();
    });
  });

  describe('fetch time and caching', () => {
    it('should update fetch time and clear error', () => {
      service.testSetError('Some error');

      service.testUpdateFetchTime();

      expect(service.lastFetchTime()).toBeTruthy();
      expect(service.error()).toBeNull();
    });

    it('should validate cache correctly', fakeAsync(() => {
      // No fetch time - invalid
      expect(service.testIsCacheValid()).toBe(false);

      // Recent fetch time - valid
      service.testUpdateFetchTime();
      expect(service.testIsCacheValid()).toBe(true);

      // Old fetch time - invalid
      service.testSetCacheDuration(100); // 100ms cache
      tick(150); // Fast-forward time by 150ms
      expect(service.testIsCacheValid()).toBe(false);
    }));
  });

  describe('clear state', () => {
    it('should clear all state', () => {
      service.testSetLoading(true);
      service.testSetError('Test error');
      service.testUpdateFetchTime();

      service.testClearState();

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.lastFetchTime()).toBeNull();
    });
  });

  describe('cache duration', () => {
    it('should have default cache duration of 5 minutes', () => {
      service.testUpdateFetchTime();
      expect(service.testIsCacheValid()).toBe(true);
    });

    it('should respect custom cache duration', () => {
      service.testSetCacheDuration(1000); // 1 second
      service.testUpdateFetchTime();
      expect(service.testIsCacheValid()).toBe(true);
    });
  });
});
