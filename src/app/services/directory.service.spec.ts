import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  DirectoryService,
  DirectoryUser,
  DirectoryGroup,
} from './directory.service';
import { AuthService } from '../auth/auth.service';
import { signal } from '@angular/core';

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
  {
    id: 'group2',
    email: 'marketing@example.com',
    name: 'Marketing Team',
    description: 'Marketing department group',
    directMembersCount: '8',
    adminCreated: true,
    aliases: [],
  },
];

const mockApiUsersResponse = {
  users: [
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
  ],
  nextPageToken: 'next-users-token',
};

const mockApiGroupsResponse = {
  groups: [
    {
      id: 'group1',
      email: 'sales@example.com',
      name: 'Sales Team',
      description: 'Sales department group',
      directMembersCount: '15',
      adminCreated: true,
      aliases: ['sales-team@example.com'],
    },
  ],
  nextPageToken: 'next-groups-token',
};

describe('DirectoryService', () => {
  let service: DirectoryService;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getAccessToken'], {
      user: signal({ uid: 'test-user', email: 'test@example.com' }),
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DirectoryService,
        { provide: AuthService, useValue: authSpy },
      ],
    });

    service = TestBed.inject(DirectoryService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceMock = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;

    authServiceMock.getAccessToken.and.returnValue(
      Promise.resolve('test-token'),
    );
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchInitialData', () => {
    it('should fetch initial users and groups', async () => {
      const fetchPromise = service.fetchInitialData();

      // Expect two HTTP requests (users and groups)
      const usersReq = httpMock.expectOne((req) => req.url.includes('/users'));
      const groupsReq = httpMock.expectOne((req) =>
        req.url.includes('/groups'),
      );

      expect(usersReq.request.method).toBe('GET');
      expect(groupsReq.request.method).toBe('GET');
      expect(usersReq.request.headers.get('Authorization')).toBe(
        'Bearer test-token',
      );
      expect(groupsReq.request.headers.get('Authorization')).toBe(
        'Bearer test-token',
      );

      usersReq.flush(mockApiUsersResponse);
      groupsReq.flush(mockApiGroupsResponse);

      await fetchPromise;

      expect(service.users().length).toBe(1);
      expect(service.groups().length).toBe(1);
      expect(service.hasMoreUsers()).toBe(true);
      expect(service.hasMoreGroups()).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should handle authentication errors', async () => {
      authServiceMock.getAccessToken.and.returnValue(Promise.resolve(null));

      await service.fetchInitialData();

      expect(service.error()).toBe('Failed to get access token');
      httpMock.expectNone(() => true);
    });

    it('should handle HTTP errors', async () => {
      const fetchPromise = service.fetchInitialData();

      const usersReq = httpMock.expectOne((req) => req.url.includes('/users'));
      usersReq.error(new ErrorEvent('Network error'));

      const groupsReq = httpMock.expectOne((req) =>
        req.url.includes('/groups'),
      );
      groupsReq.flush(mockApiGroupsResponse);

      await fetchPromise;

      expect(service.error()).toContain('Failed to fetch');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('loadMoreUsers', () => {
    it('should load additional users with pagination', async () => {
      // First, set up initial state
      service['userPageToken'] = 'existing-token';
      service['_hasMoreUsers'].set(true);

      const loadPromise = service.loadMoreUsers();

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes('/users') &&
          request.url.includes('pageToken=existing-token'),
      );

      expect(req.request.method).toBe('GET');
      req.flush({
        users: [mockApiUsersResponse.users[0]],
        nextPageToken: 'new-token',
      });

      await loadPromise;

      expect(service.users().length).toBe(1);
      expect(service.hasMoreUsers()).toBe(true);
    });

    it('should not load more when hasMoreUsers is false', async () => {
      service['_hasMoreUsers'].set(false);

      await service.loadMoreUsers();

      httpMock.expectNone(() => true);
    });
  });

  describe('searchUsers', () => {
    it('should search users with query', async () => {
      const searchPromise = service.searchUsers('john');

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes('/users') && request.url.includes('query=john'),
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockApiUsersResponse);

      const results = await searchPromise;

      expect(results.length).toBe(1);
      expect(results[0].primaryEmail).toBe('john.doe@example.com');
    });

    it('should filter locally for short queries', async () => {
      // Set up some users in the service
      service['_users'].set(mockUsers);

      const results = await service.searchUsers('jo');

      expect(results.length).toBe(1);
      expect(results[0].name.fullName).toBe('John Doe');
      httpMock.expectNone(() => true);
    });
  });

  describe('getUserGroups', () => {
    it('should get groups for a user', async () => {
      const groupsPromise = service.getUserGroups('john.doe@example.com');

      const req = httpMock.expectOne(
        (request) =>
          request.url.includes('/groups') &&
          request.url.includes('userKey=john.doe@example.com'),
      );

      expect(req.request.method).toBe('GET');
      req.flush(mockApiGroupsResponse);

      const results = await groupsPromise;

      expect(results.length).toBe(1);
      expect(results[0].email).toBe('sales@example.com');
    });
  });

  describe('stats computation', () => {
    it('should compute statistics correctly', () => {
      service['_users'].set(mockUsers);
      service['_groups'].set(mockGroups);

      const stats = service.stats();

      expect(stats.totalUsers).toBe(2);
      expect(stats.activeUsers).toBe(1);
      expect(stats.suspendedUsers).toBe(1);
      expect(stats.totalGroups).toBe(2);
      expect(stats.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should handle empty data', () => {
      service['_users'].set([]);
      service['_groups'].set([]);

      const stats = service.stats();

      expect(stats.totalUsers).toBe(0);
      expect(stats.activeUsers).toBe(0);
      expect(stats.suspendedUsers).toBe(0);
      expect(stats.totalGroups).toBe(0);
    });
  });

  describe('caching', () => {
    it('should use cached data within cache duration', async () => {
      // Set up cached data
      service['_lastFetchTime'].set(Date.now() - 60000); // 1 minute ago
      service['_users'].set(mockUsers);

      await service.fetchInitialData();

      // Should not make HTTP requests due to cache
      httpMock.expectNone(() => true);
    });

    it('should refresh data when cache expires', async () => {
      // Set up expired cache
      service['_lastFetchTime'].set(Date.now() - 400000); // 6+ minutes ago

      const fetchPromise = service.fetchInitialData();

      // Should make new HTTP requests
      const usersReq = httpMock.expectOne((req) => req.url.includes('/users'));
      const groupsReq = httpMock.expectOne((req) =>
        req.url.includes('/groups'),
      );

      usersReq.flush(mockApiUsersResponse);
      groupsReq.flush(mockApiGroupsResponse);

      await fetchPromise;

      expect(service.users().length).toBe(1);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      service['_users'].set(mockUsers);
      service['_groups'].set(mockGroups);
      service['_lastFetchTime'].set(Date.now());

      service.clearCache();

      expect(service.users().length).toBe(0);
      expect(service.groups().length).toBe(0);
      expect(service['_lastFetchTime']()).toBeNull();
      expect(service.hasMoreUsers()).toBe(true);
      expect(service.hasMoreGroups()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle 401 errors with appropriate message', async () => {
      const fetchPromise = service.fetchInitialData();

      const req = httpMock.expectOne((req) => req.url.includes('/users'));
      req.error(new ErrorEvent('Unauthorized'), { status: 401 });

      const groupsReq = httpMock.expectOne((req) =>
        req.url.includes('/groups'),
      );
      groupsReq.flush(mockApiGroupsResponse);

      await fetchPromise;

      expect(service.error()).toContain('Authentication required');
    });

    it('should handle 403 errors with appropriate message', async () => {
      const fetchPromise = service.fetchInitialData();

      const req = httpMock.expectOne((req) => req.url.includes('/users'));
      req.error(new ErrorEvent('Forbidden'), { status: 403 });

      const groupsReq = httpMock.expectOne((req) =>
        req.url.includes('/groups'),
      );
      groupsReq.flush(mockApiGroupsResponse);

      await fetchPromise;

      expect(service.error()).toContain('Insufficient permissions');
    });

    it('should handle rate limiting with appropriate message', async () => {
      const fetchPromise = service.fetchInitialData();

      const req = httpMock.expectOne((req) => req.url.includes('/users'));
      req.error(new ErrorEvent('Too Many Requests'), { status: 429 });

      const groupsReq = httpMock.expectOne((req) =>
        req.url.includes('/groups'),
      );
      groupsReq.flush(mockApiGroupsResponse);

      await fetchPromise;

      expect(service.error()).toContain('Too many requests');
    });
  });
});
