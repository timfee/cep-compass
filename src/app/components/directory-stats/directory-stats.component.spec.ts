import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { DirectoryStatsComponent } from './directory-stats.component';
import { DirectoryService, DirectoryUser, DirectoryGroup } from '../../services/directory.service';

// Mock data
const mockUsers: DirectoryUser[] = [
  {
    id: 'user1',
    primaryEmail: 'john.doe@example.com',
    name: {
      givenName: 'John',
      familyName: 'Doe',
      fullName: 'John Doe',
    },
    suspended: false,
    orgUnitPath: '/Sales',
    isAdmin: false,
    isDelegatedAdmin: false,
    lastLoginTime: '2024-01-15T10:30:00.000Z',
    creationTime: '2023-01-01T00:00:00.000Z',
    emails: [{ address: 'john.doe@example.com', primary: true }],
  },
  {
    id: 'user2',
    primaryEmail: 'jane.smith@example.com',
    name: {
      givenName: 'Jane',
      familyName: 'Smith',
      fullName: 'Jane Smith',
    },
    suspended: true,
    orgUnitPath: '/Marketing',
    isAdmin: true,
    isDelegatedAdmin: false,
    lastLoginTime: '2024-01-10T09:15:00.000Z',
    creationTime: '2023-02-01T00:00:00.000Z',
    emails: [{ address: 'jane.smith@example.com', primary: true }],
  },
];

const mockGroups: DirectoryGroup[] = [
  {
    id: 'group1',
    email: 'sales@example.com',
    name: 'Sales Team',
    description: 'Sales department group',
    directMembersCount: '15',
    adminCreated: true,
    aliases: ['sales-team@example.com'],
  },
];

describe('DirectoryStatsComponent', () => {
  let component: DirectoryStatsComponent;
  let fixture: ComponentFixture<DirectoryStatsComponent>;
  let directoryServiceMock: jasmine.SpyObj<DirectoryService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DirectoryService', [
      'fetchInitialData',
      'refreshStats',
      'loadMoreUsers',
      'loadMoreGroups',
      'searchUsers',
      'searchGroups',
    ], {
      users: signal(mockUsers),
      groups: signal(mockGroups),
      isLoading: signal(false),
      error: signal(null),
      hasMoreUsers: signal(true),
      hasMoreGroups: signal(true),
      stats: signal({
        totalUsers: 2,
        activeUsers: 1,
        suspendedUsers: 1,
        totalGroups: 1,
        lastSyncTime: new Date('2024-01-15T12:00:00.000Z'),
      }),
    });

    await TestBed.configureTestingModule({
      imports: [DirectoryStatsComponent, NoopAnimationsModule],
      providers: [
        { provide: DirectoryService, useValue: spy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectoryStatsComponent);
    component = fixture.componentInstance;
    directoryServiceMock = TestBed.inject(DirectoryService) as jasmine.SpyObj<DirectoryService>;

    directoryServiceMock.fetchInitialData.and.returnValue(Promise.resolve());
    directoryServiceMock.refreshStats.and.returnValue(Promise.resolve());
    directoryServiceMock.loadMoreUsers.and.returnValue(Promise.resolve());
    directoryServiceMock.loadMoreGroups.and.returnValue(Promise.resolve());
    directoryServiceMock.searchUsers.and.returnValue(Promise.resolve([mockUsers[0]]));
    directoryServiceMock.searchGroups.and.returnValue(Promise.resolve([mockGroups[0]]));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct statistics', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Check total users display
    expect(compiled.textContent).toContain('2'); // total users
    expect(compiled.textContent).toContain('1 active (50%)');
    expect(compiled.textContent).toContain('1 suspended (50%)');
    
    // Check total groups display
    expect(compiled.textContent).toContain('1'); // total groups
    
    // Check last sync time
    expect(compiled.textContent).toContain('1/15/24'); // formatted date
  });

  it('should call directoryService.fetchInitialData on init', async () => {
    await component.ngOnInit();
    expect(directoryServiceMock.fetchInitialData).toHaveBeenCalled();
  });

  it('should call directoryService.refreshStats when refresh button is clicked', async () => {
    const refreshButton = fixture.nativeElement.querySelector('button[color="primary"]') as HTMLButtonElement;
    refreshButton.click();
    
    expect(directoryServiceMock.refreshStats).toHaveBeenCalled();
  });

  it('should call directoryService.loadMoreUsers when load more users button is clicked', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const loadMoreUsersButton = Array.from(buttons)
      .find(btn => (btn as HTMLButtonElement).textContent?.includes('Load More Users')) as HTMLButtonElement;
    
    if (loadMoreUsersButton) {
      loadMoreUsersButton.click();
      expect(directoryServiceMock.loadMoreUsers).toHaveBeenCalled();
    }
  });

  it('should call directoryService.loadMoreGroups when load more groups button is clicked', async () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const loadMoreGroupsButton = Array.from(buttons)
      .find(btn => (btn as HTMLButtonElement).textContent?.includes('Load More Groups')) as HTMLButtonElement;
    
    if (loadMoreGroupsButton) {
      loadMoreGroupsButton.click();
      expect(directoryServiceMock.loadMoreGroups).toHaveBeenCalled();
    }
  });

  it('should perform search when search query is entered', async () => {
    component.searchQuery.set('john');
    await component.onSearch();
    
    expect(directoryServiceMock.searchUsers).toHaveBeenCalledWith('john');
    expect(directoryServiceMock.searchGroups).toHaveBeenCalledWith('john');
  });

  it('should filter locally for short queries', async () => {
    component.searchQuery.set('jo');
    await component.onSearch();
    
    // Should not call API search for short queries
    expect(directoryServiceMock.searchUsers).not.toHaveBeenCalled();
    expect(directoryServiceMock.searchGroups).not.toHaveBeenCalled();
    
    // Should have local results
    const results = component.searchResults();
    expect(results.users.length).toBe(1);
    expect(results.users[0].name.fullName).toBe('John Doe');
  });

  it('should clear search results when clear button is clicked', () => {
    component.searchQuery.set('test');
    component.searchResults.set({ users: [mockUsers[0]], groups: [mockGroups[0]] });
    
    component.onClearSearch();
    
    expect(component.searchQuery()).toBe('');
    expect(component.searchResults().users.length).toBe(0);
    expect(component.searchResults().groups.length).toBe(0);
  });

  it('should calculate active and suspended percentages correctly', () => {
    expect(component.activePercentage()).toBe(50);
    expect(component.suspendedPercentage()).toBe(50);
  });

  it('should handle zero users correctly', () => {
    // Create a signal with zero users
    const emptyUsersSignal = signal([]);
    Object.defineProperty(directoryServiceMock, 'users', {
      get: () => emptyUsersSignal,
    });
    Object.defineProperty(directoryServiceMock, 'stats', {
      get: () => signal({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        totalGroups: 0,
        lastSyncTime: new Date(),
      }),
    });
    
    // Recreate component with empty data
    fixture = TestBed.createComponent(DirectoryStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.activePercentage()).toBe(0);
    expect(component.suspendedPercentage()).toBe(0);
  });

  it('should display error message when error occurs', () => {
    // Set up error state
    const errorSignal = signal('Test error message');
    Object.defineProperty(directoryServiceMock, 'error', {
      get: () => errorSignal,
    });
    
    fixture = TestBed.createComponent(DirectoryStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test error message');
  });

  it('should show loading spinner when loading', () => {
    // Set up loading state
    const loadingSignal = signal(true);
    Object.defineProperty(directoryServiceMock, 'isLoading', {
      get: () => loadingSignal,
    });
    
    fixture = TestBed.createComponent(DirectoryStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    const spinners = fixture.nativeElement.querySelectorAll('mat-spinner');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('should disable load more buttons when no more data available', () => {
    // Set up no more data state
    const hasMoreUsersSignal = signal(false);
    const hasMoreGroupsSignal = signal(false);
    Object.defineProperty(directoryServiceMock, 'hasMoreUsers', {
      get: () => hasMoreUsersSignal,
    });
    Object.defineProperty(directoryServiceMock, 'hasMoreGroups', {
      get: () => hasMoreGroupsSignal,
    });
    
    fixture = TestBed.createComponent(DirectoryStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const loadMoreUsersButton = Array.from(buttons)
      .find(btn => (btn as HTMLButtonElement).textContent?.includes('Load More Users')) as HTMLButtonElement;
    const loadMoreGroupsButton = Array.from(buttons)
      .find(btn => (btn as HTMLButtonElement).textContent?.includes('Load More Groups')) as HTMLButtonElement;
    
    expect(loadMoreUsersButton?.disabled).toBe(true);
    expect(loadMoreGroupsButton?.disabled).toBe(true);
  });

  describe('user and group matching', () => {
    it('should match users by name', () => {
      const user = mockUsers[0];
      expect(component['matchesUserQuery'](user, 'john')).toBe(true);
      expect(component['matchesUserQuery'](user, 'doe')).toBe(true);
      expect(component['matchesUserQuery'](user, 'xyz')).toBe(false);
    });

    it('should match users by email', () => {
      const user = mockUsers[0];
      expect(component['matchesUserQuery'](user, 'john.doe')).toBe(true);
      expect(component['matchesUserQuery'](user, 'example.com')).toBe(true);
    });

    it('should match users by org unit', () => {
      const user = mockUsers[0];
      expect(component['matchesUserQuery'](user, 'sales')).toBe(true);
      expect(component['matchesUserQuery'](user, 'marketing')).toBe(false);
    });

    it('should match groups by name and email', () => {
      const group = mockGroups[0];
      expect(component['matchesGroupQuery'](group, 'sales')).toBe(true);
      expect(component['matchesGroupQuery'](group, 'team')).toBe(true);
      expect(component['matchesGroupQuery'](group, 'example.com')).toBe(true);
      expect(component['matchesGroupQuery'](group, 'marketing')).toBe(false);
    });

    it('should match groups by description', () => {
      const group = mockGroups[0];
      expect(component['matchesGroupQuery'](group, 'department')).toBe(true);
      expect(component['matchesGroupQuery'](group, 'engineering')).toBe(false);
    });
  });
});