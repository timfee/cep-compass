import { Injectable, inject, signal } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { firstValueFrom } from 'rxjs';

interface UserCount {
  count: string;
}

@Injectable({
  providedIn: 'root',
})
export class DirectoryService {
  private functions: Functions = inject(Functions);
  public readonly userCount = signal('0');
  public readonly isLoading = signal(false);

  constructor() {
    this.loadUserCount();
  }

  private async loadUserCount(): Promise<void> {
    this.isLoading.set(true);
    const getCount = httpsCallableData<void, UserCount>(
      this.functions,
      'getDirectoryUserCount'
    );
    try {
      const result = await firstValueFrom(getCount());
      this.userCount.set(result.count);
    } catch (error) {
      console.error('Error fetching user count:', error);
      this.userCount.set('Error');
    } finally {
      this.isLoading.set(false);
    }
  }
}