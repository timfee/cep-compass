import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import {
  DirectoryService,
  DirectoryUser,
  DirectoryGroup,
} from '../../services/directory.service';
import { ErrorDisplayComponent } from '../../shared/components';

/**
 * Component for displaying directory statistics and search functionality
 */
@Component({
  selector: 'app-directory-stats',
  templateUrl: './directory-stats.component.html',
  styleUrl: './directory-stats.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ErrorDisplayComponent,
  ],
})
export class DirectoryStatsComponent implements OnInit {
  private readonly directoryService = inject(DirectoryService);

  // Search state
  public readonly searchQuery = signal<string>('');
  public readonly searchResults = signal<{
    users: DirectoryUser[];
    groups: DirectoryGroup[];
  }>({ users: [], groups: [] });
  public readonly isSearching = signal<boolean>(false);

  // Directory service state
  public readonly stats = this.directoryService.stats;
  public readonly isLoading = this.directoryService.isLoading;
  public readonly error = this.directoryService.error;
  public readonly hasMoreUsers = this.directoryService.hasMoreUsers;
  public readonly hasMoreGroups = this.directoryService.hasMoreGroups;

  // Computed properties for display
  public readonly activePercentage = computed(() => {
    const s = this.stats();
    if (s.totalUsers === 0) return 0;
    return Math.round((s.activeUsers / s.totalUsers) * 100);
  });

  public readonly suspendedPercentage = computed(() => {
    const s = this.stats();
    if (s.totalUsers === 0) return 0;
    return Math.round((s.suspendedUsers / s.totalUsers) * 100);
  });

  public readonly hasResults = computed(() => {
    const results = this.searchResults();
    return results.users.length > 0 || results.groups.length > 0;
  });

  async ngOnInit(): Promise<void> {
    // Load initial data if not already loaded
    await this.directoryService.fetchInitialData();
  }

  /**
   * Refreshes directory statistics from the API
   */
  async onRefresh(): Promise<void> {
    await this.directoryService.refreshStats();
  }

  async onLoadMoreUsers(): Promise<void> {
    await this.directoryService.loadMoreUsers();
  }

  async onLoadMoreGroups(): Promise<void> {
    await this.directoryService.loadMoreGroups();
  }

  /**
   * Performs search based on current query
   */
  async onSearch(): Promise<void> {
    const query = this.searchQuery().trim();

    if (query.length === 0) {
      this.searchResults.set({ users: [], groups: [] });
      return;
    }

    if (query.length < 3) {
      // For short queries, use local filtering
      const allUsers = this.directoryService.users();
      const allGroups = this.directoryService.groups();

      const filteredUsers = allUsers.filter((user) =>
        this.matchesUserQuery(user, query),
      );
      const filteredGroups = allGroups.filter((group) =>
        this.matchesGroupQuery(group, query),
      );

      this.searchResults.set({
        users: filteredUsers.slice(0, 20), // Limit display
        groups: filteredGroups.slice(0, 20),
      });
      return;
    }

    // For longer queries, use API search
    this.isSearching.set(true);
    try {
      const [users, groups] = await Promise.all([
        this.directoryService.searchUsers(query),
        this.directoryService.searchGroups(query),
      ]);

      this.searchResults.set({
        users: users.slice(0, 20), // Limit display
        groups: groups.slice(0, 20),
      });
    } catch (error) {
      console.error('Search failed:', error);
      this.searchResults.set({ users: [], groups: [] });
    } finally {
      this.isSearching.set(false);
    }
  }

  /**
   * Clears search query and results
   */
  onClearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set({ users: [], groups: [] });
  }

  private matchesUserQuery(user: DirectoryUser, query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      user.name.fullName.toLowerCase().includes(searchTerm) ||
      user.primaryEmail.toLowerCase().includes(searchTerm) ||
      user.orgUnitPath.toLowerCase().includes(searchTerm) ||
      user.name.givenName.toLowerCase().includes(searchTerm) ||
      user.name.familyName.toLowerCase().includes(searchTerm)
    );
  }

  private matchesGroupQuery(group: DirectoryGroup, query: string): boolean {
    const searchTerm = query.toLowerCase();
    return (
      group.name.toLowerCase().includes(searchTerm) ||
      group.email.toLowerCase().includes(searchTerm) ||
      (group.description
        ? group.description.toLowerCase().includes(searchTerm)
        : false)
    );
  }
}
