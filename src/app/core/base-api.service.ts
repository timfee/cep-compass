import { signal } from '@angular/core';
import { CACHE_CONFIG } from '../shared/constants/app.constants';

/**
 * Base class for services that fetch data from APIs
 * Provides common state management for loading, errors, and caching
 */
export abstract class BaseApiService {
  // Private state signals
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastFetchTime = signal<number | null>(null);

  // Public readonly signals
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly lastFetchTime = this._lastFetchTime.asReadonly();

  // Cache duration in milliseconds (configurable)
  protected cacheDuration = CACHE_CONFIG.DEFAULT_DURATION;

  /**
   * Check if cached data is still valid
   */
  protected isCacheValid(): boolean {
    const lastFetch = this._lastFetchTime();
    if (!lastFetch) return false;
    return Date.now() - lastFetch < this.cacheDuration;
  }

  /**
   * Set loading state
   */
  protected setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  /**
   * Set error state
   */
  protected setError(error: string | null): void {
    this._error.set(error);
  }

  /**
   * Update fetch time when data is successfully fetched
   */
  protected updateFetchTime(): void {
    this._lastFetchTime.set(Date.now());
    this._error.set(null);
  }

  /**
   * Clear all state
   */
  protected clearState(): void {
    this._error.set(null);
    this._isLoading.set(false);
    this._lastFetchTime.set(null);
  }
}
