import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { OrgUnitsService } from './org-units.service';
import { AuthService } from './auth.service';

describe('OrgUnitsService', () => {
  let service: OrgUnitsService;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  const mockOrgUnitsApiResponse = {
    organizationUnits: [
      {
        orgUnitPath: '/Sales',
        orgUnitId: 'sales-id',
        name: 'Sales',
        description: 'Sales department',
        parentOrgUnitPath: '/',
        parentOrgUnitId: 'root-id',
      },
      {
        orgUnitPath: '/Sales/West Coast',
        orgUnitId: 'west-coast-id',
        name: 'West Coast',
        description: 'West Coast sales team',
        parentOrgUnitPath: '/Sales',
        parentOrgUnitId: 'sales-id',
      },
      {
        orgUnitPath: '/Engineering',
        orgUnitId: 'engineering-id',
        name: 'Engineering',
        description: 'Engineering department',
        parentOrgUnitPath: '/',
        parentOrgUnitId: 'root-id',
      },
    ],
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getAccessToken'], {
      user: signal({ uid: 'test-user' }),
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrgUnitsService, { provide: AuthService, useValue: authSpy }],
    });

    service = TestBed.inject(OrgUnitsService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceMock = TestBed.inject(
      AuthService,
    ) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty state', () => {
      expect(service.orgUnits()).toEqual([]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.orgUnitTree()).toEqual([]);
    });
  });

  describe('fetchOrgUnits', () => {
    it('should fetch organizational units successfully', async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );

      const fetchPromise = service.fetchOrgUnits();

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(
        'Bearer test-token',
      );

      req.flush(mockOrgUnitsApiResponse);

      await fetchPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();

      const orgUnits = service.orgUnits();
      expect(orgUnits).toHaveSize(4); // 3 from API + 1 root

      // Should include root organization
      const rootUnit = orgUnits.find((unit) => unit.orgUnitPath === '/');
      expect(rootUnit).toBeDefined();
      expect(rootUnit?.name).toBe('Root Organization');

      // Should be sorted alphabetically
      const paths = orgUnits.map((unit) => unit.orgUnitPath);
      expect(paths).toEqual([
        '/',
        '/Engineering',
        '/Sales',
        '/Sales/West Coast',
      ]);
    });

    it('should handle authentication failure', async () => {
      authServiceMock.getAccessToken.and.returnValue(Promise.resolve(null));

      await service.fetchOrgUnits();

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe('Failed to get access token');
      expect(service.orgUnits()).toEqual([]);
    });

    it('should handle unauthenticated user', async () => {
      // Mock user signal to return null
      Object.defineProperty(authServiceMock, 'user', {
        get: () => signal(null),
      });

      await service.fetchOrgUnits();

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe('User not authenticated');
      expect(service.orgUnits()).toEqual([]);
    });

    it('should handle 403 permission error', async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );

      const fetchPromise = service.fetchOrgUnits();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req.flush(
        { error: 'Insufficient permissions' },
        { status: 403, statusText: 'Forbidden' },
      );

      await fetchPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe(
        'Insufficient permissions to access organizational units. Please ensure you have the required admin privileges.',
      );
      expect(service.orgUnits()).toEqual([]);
    });

    it('should handle 401 authentication error', async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );

      const fetchPromise = service.fetchOrgUnits();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req.flush(
        { error: 'Authentication required' },
        { status: 401, statusText: 'Unauthorized' },
      );

      await fetchPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe(
        'Authentication required. Please log in again.',
      );
    });

    it('should handle server errors', async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );

      const fetchPromise = service.fetchOrgUnits();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req.flush(
        { error: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' },
      );

      await fetchPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe(
        'Google service temporarily unavailable. Please try again later.',
      );
    });

    it('should use cache for subsequent calls within cache duration', async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );

      // First call
      const firstFetchPromise = service.fetchOrgUnits();
      const req1 = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req1.flush(mockOrgUnitsApiResponse);
      await firstFetchPromise;

      // Second call within cache duration - should not make HTTP request
      await service.fetchOrgUnits();
      httpMock.expectNone(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );

      expect(service.orgUnits()).toHaveSize(4);
    });
  });

  describe('orgUnitTree', () => {
    beforeEach(async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );
      const fetchPromise = service.fetchOrgUnits();
      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req.flush(mockOrgUnitsApiResponse);
      await fetchPromise;
    });

    it('should build hierarchical tree structure', () => {
      const tree = service.orgUnitTree();
      expect(tree).toHaveSize(1); // Only root node at top level

      const rootNode = tree[0];
      expect(rootNode.orgUnitPath).toBe('/');
      expect(rootNode.level).toBe(0);
      expect(rootNode.children).toHaveSize(2); // Sales and Engineering

      // Check Sales department
      const salesNode = rootNode.children.find(
        (child) => child.name === 'Sales',
      );
      expect(salesNode).toBeDefined();
      expect(salesNode?.level).toBe(1);
      expect(salesNode?.children).toHaveSize(1); // West Coast

      // Check West Coast under Sales
      const westCoastNode = salesNode?.children[0];
      expect(westCoastNode?.name).toBe('West Coast');
      expect(westCoastNode?.level).toBe(2);
      expect(westCoastNode?.children).toHaveSize(0);

      // Check Engineering department
      const engineeringNode = rootNode.children.find(
        (child) => child.name === 'Engineering',
      );
      expect(engineeringNode).toBeDefined();
      expect(engineeringNode?.level).toBe(1);
      expect(engineeringNode?.children).toHaveSize(0);
    });

    it('should sort tree nodes alphabetically', () => {
      const tree = service.orgUnitTree();
      const rootNode = tree[0];

      const childNames = rootNode.children.map((child) => child.name);
      expect(childNames).toEqual(['Engineering', 'Sales']);
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );
      const fetchPromise = service.fetchOrgUnits();
      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req.flush(mockOrgUnitsApiResponse);
      await fetchPromise;
    });

    describe('getOrgUnitsByName', () => {
      it('should find org units by name (case-insensitive)', () => {
        const results = service.getOrgUnitsByName('sales');
        expect(results).toHaveSize(2); // Sales and Sales/West Coast

        const salesPaths = results.map((unit) => unit.orgUnitPath);
        expect(salesPaths).toContain('/Sales');
        expect(salesPaths).toContain('/Sales/West Coast');
      });

      it('should find org units by partial name', () => {
        const results = service.getOrgUnitsByName('coast');
        expect(results).toHaveSize(1);
        expect(results[0].orgUnitPath).toBe('/Sales/West Coast');
      });

      it('should return empty array for no matches', () => {
        const results = service.getOrgUnitsByName('nonexistent');
        expect(results).toEqual([]);
      });
    });

    describe('getOrgUnitByPath', () => {
      it('should find org unit by exact path', () => {
        const result = service.getOrgUnitByPath('/Sales');
        expect(result).toBeDefined();
        expect(result?.name).toBe('Sales');
      });

      it('should return undefined for non-existent path', () => {
        const result = service.getOrgUnitByPath('/NonExistent');
        expect(result).toBeUndefined();
      });

      it('should find root organization', () => {
        const result = service.getOrgUnitByPath('/');
        expect(result).toBeDefined();
        expect(result?.name).toBe('Root Organization');
      });
    });

    describe('clearCache', () => {
      it('should clear cached data', () => {
        expect(service.orgUnits()).toHaveSize(4);

        service.clearCache();

        expect(service.orgUnits()).toEqual([]);
        expect(service.error()).toBeNull();
      });
    });
  });

  describe('error handling edge cases', () => {
    it('should handle network errors', async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );

      const fetchPromise = service.fetchOrgUnits();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req.error(new ProgressEvent('Network error'));

      await fetchPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toContain('Failed to fetch organizational units');
    });

    it('should handle empty API response', async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );

      const fetchPromise = service.fetchOrgUnits();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req.flush({}); // Empty response

      await fetchPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();

      // Should still have root organization
      const orgUnits = service.orgUnits();
      expect(orgUnits).toHaveSize(1);
      expect(orgUnits[0].orgUnitPath).toBe('/');
    });

    it('should handle malformed API response', async () => {
      authServiceMock.getAccessToken.and.returnValue(
        Promise.resolve('test-token'),
      );

      const fetchPromise = service.fetchOrgUnits();

      const req = httpMock.expectOne(
        'https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits',
      );
      req.flush({
        organizationUnits: [
          {
            // Missing required fields
            name: 'Incomplete Unit',
          },
        ],
      });

      await fetchPromise;

      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();

      const orgUnits = service.orgUnits();
      expect(orgUnits).toHaveSize(2); // Root + incomplete unit

      const incompleteUnit = orgUnits.find(
        (unit) => unit.name === 'Incomplete Unit',
      );
      expect(incompleteUnit).toBeDefined();
      expect(incompleteUnit?.orgUnitPath).toBe('');
      expect(incompleteUnit?.orgUnitId).toBe('');
    });
  });
});
