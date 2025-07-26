import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../auth/auth.service';
import { DirectoryService } from '../services/directory.service';
import { signal } from '@angular/core';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      user: signal(null),
      selectedRole: signal(null),
      availableRoles: signal({ isSuperAdmin: false, isCepAdmin: false }),
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const directoryServiceSpy = jasmine.createSpyObj('DirectoryService', ['fetchInitialData'], {
      stats: signal({ totalUsers: 0, activeUsers: 0, suspendedUsers: 0, totalGroups: 0 }),
      isLoading: signal(false),
      error: signal(null),
      hasMoreUsers: signal(false),
      hasMoreGroups: signal(false),
    });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: DirectoryService, useValue: directoryServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('canShowCard', () => {
    it('should show cards with "any" role requirement for any user', () => {
      const card = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: 'test',
        requiredRole: 'any' as const,
        category: 'setup' as const,
        order: 1,
        enabled: true,
      };

      expect(component.canShowCard(card)).toBe(true);
    });

    it('should show superAdmin cards only for superAdmin role', () => {
      const card = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: 'test',
        requiredRole: 'superAdmin' as const,
        category: 'setup' as const,
        order: 1,
        enabled: true,
      };

      // Set selectedRole to superAdmin
      mockAuthService.selectedRole.set('superAdmin');
      expect(component.canShowCard(card)).toBe(true);

      // Set selectedRole to cepAdmin
      mockAuthService.selectedRole.set('cepAdmin');
      expect(component.canShowCard(card)).toBe(false);

      // Set selectedRole to null
      mockAuthService.selectedRole.set(null);
      expect(component.canShowCard(card)).toBe(false);
    });

    it('should show cepAdmin cards for both cepAdmin and superAdmin roles', () => {
      const card = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: 'test',
        requiredRole: 'cepAdmin' as const,
        category: 'setup' as const,
        order: 1,
        enabled: true,
      };

      // Set selectedRole to superAdmin
      mockAuthService.selectedRole.set('superAdmin');
      expect(component.canShowCard(card)).toBe(true);

      // Set selectedRole to cepAdmin
      mockAuthService.selectedRole.set('cepAdmin');
      expect(component.canShowCard(card)).toBe(true);

      // Set selectedRole to null
      mockAuthService.selectedRole.set(null);
      expect(component.canShowCard(card)).toBe(false);
    });
  });

  describe('handleCardClick', () => {
    it('should navigate when card has route and is enabled', () => {
      const card = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: 'test',
        route: '/test-route',
        requiredRole: 'any' as const,
        category: 'setup' as const,
        order: 1,
        enabled: true,
      };

      component.handleCardClick(card);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/test-route']);
    });

    it('should not navigate when card is disabled', () => {
      const card = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: 'test',
        route: '/test-route',
        requiredRole: 'any' as const,
        category: 'setup' as const,
        order: 1,
        enabled: false,
      };

      component.handleCardClick(card);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should call action when card has action and is enabled', () => {
      const actionSpy = jasmine.createSpy('action');
      const card = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: 'test',
        action: actionSpy,
        requiredRole: 'any' as const,
        category: 'setup' as const,
        order: 1,
        enabled: true,
      };

      component.handleCardClick(card);
      expect(actionSpy).toHaveBeenCalled();
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return correct display names for roles', () => {
      expect(component.getRoleDisplayName('superAdmin')).toBe('Super Admin');
      expect(component.getRoleDisplayName('cepAdmin')).toBe('CEP Delegated Admin');
      expect(component.getRoleDisplayName(null)).toBe('Unknown Role');
    });
  });

  describe('getCardsByCategory', () => {
    it('should filter and sort cards by category', () => {
      const cards = component.getCardsByCategory('setup');
      expect(cards).toBeDefined();
      expect(Array.isArray(cards)).toBe(true);
      
      // All cards should be from setup category
      cards.forEach(card => {
        expect(card.category).toBe('setup');
      });
      
      // Cards should be sorted by order
      for (let i = 1; i < cards.length; i++) {
        expect(cards[i].order).toBeGreaterThanOrEqual(cards[i - 1].order);
      }
    });
  });
});