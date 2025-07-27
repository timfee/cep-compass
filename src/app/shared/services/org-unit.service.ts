import { Injectable, inject, signal } from '@angular/core';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { firstValueFrom } from 'rxjs';

// Define a simple interface for the frontend, avoiding backend dependencies.
export interface OrgUnit {
  name?: string | null;
  orgUnitPath?: string | null;
  parentOrgUnitPath?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class OrgUnitService {
  private functions: Functions = inject(Functions);
  public readonly orgUnits = signal<OrgUnit[]>([]);
  public readonly isLoading = signal(false);

  constructor() {
    this.loadOrgUnits();
  }

  private async loadOrgUnits(): Promise<void> {
    this.isLoading.set(true);
    const getOUs = httpsCallableData<void, OrgUnit[]>(
      this.functions,
      'listOrgUnits'
    );
    try {
      // Convert the observable to a promise to use await
      const ous = await firstValueFrom(getOUs());
      this.orgUnits.set(ous);
    } catch (error) {
      console.error('Error fetching org units:', error);
      this.orgUnits.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}