import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService, SelectedRole } from '../../services/auth.service';
import { DirectoryStatsComponent } from '../directory-stats/directory-stats.component';
import {
  UserRole,
  DashboardCategory,
  BadgeColor,
} from '../../shared/constants/enums';

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string; // Material icon name
  route?: string;
  action?: () => void;
  requiredRole: UserRole | 'any';
  category: DashboardCategory;
  order: number;
  enabled: boolean;
  badge?: {
    value: number | string;
    color: BadgeColor;
  };
}

interface CardCategory {
  name: DashboardCategory;
  displayName: string;
  description?: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    DirectoryStatsComponent,
  ],
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Dashboard cards configuration
  private readonly DASHBOARD_CARDS: DashboardCard[] = [
    {
      id: 'create-cep-admin',
      title: 'Create CEP Admin Role',
      description:
        'Set up delegated admin role for Chrome Enterprise management',
      icon: 'admin_panel_settings',
      route: '/admin/create-role',
      requiredRole: UserRole.SUPER_ADMIN,
      category: DashboardCategory.SETUP,
      order: 1,
      enabled: true,
    },
    {
      id: 'enroll-browsers',
      title: 'Enroll Browsers',
      description:
        'Generate enrollment tokens and configure browser management',
      icon: 'laptop_chromebook',
      route: '/enrollment/browsers',
      requiredRole: 'any',
      category: DashboardCategory.ENROLLMENT,
      order: 2,
      enabled: true,
    },
    {
      id: 'enroll-profiles',
      title: 'Enroll User Profiles',
      description: 'Guide users to sign in to Chrome with managed accounts',
      icon: 'account_circle',
      route: '/enrollment/profiles',
      requiredRole: 'any',
      category: DashboardCategory.ENROLLMENT,
      order: 3,
      enabled: true,
    },
    {
      id: 'one-click-setup',
      title: 'Activate One-Click Protection',
      description: 'Enable security insights and dashboard population',
      icon: 'security',
      route: '/security/one-click',
      requiredRole: 'any',
      category: DashboardCategory.SECURITY,
      order: 4,
      enabled: true,
    },
    {
      id: 'dlp-policies',
      title: 'Configure DLP Policies',
      description: 'Set up data loss prevention rules and monitoring',
      icon: 'policy',
      route: '/security/dlp',
      requiredRole: 'any',
      category: DashboardCategory.SECURITY,
      order: 5,
      enabled: true,
    },
    // Add existing demo links as management category cards
    {
      id: 'org-units',
      title: 'Organizational Units',
      description: 'Manage and configure organizational units structure',
      icon: 'account_tree',
      route: '/org-units',
      requiredRole: 'any',
      category: DashboardCategory.MANAGEMENT,
      order: 6,
      enabled: true,
    },
    {
      id: 'email-templates',
      title: 'Email Templates',
      description: 'Create and manage email templates for communications',
      icon: 'email',
      route: '/email-templates',
      requiredRole: 'any',
      category: DashboardCategory.MANAGEMENT,
      order: 7,
      enabled: true,
    },
    {
      id: 'directory-stats',
      title: 'Directory & Users',
      description: 'View directory statistics and manage user accounts',
      icon: 'people',
      route: '/directory-stats',
      requiredRole: 'any',
      category: DashboardCategory.MANAGEMENT,
      order: 8,
      enabled: true,
    },
  ];

  private readonly CARD_CATEGORIES: CardCategory[] = [
    {
      name: DashboardCategory.SETUP,
      displayName: 'Setup & Configuration',
      description: 'Initial setup and administrative configuration tasks',
    },
    {
      name: DashboardCategory.ENROLLMENT,
      displayName: 'Enrollment & Onboarding',
      description: 'Browser and user profile enrollment processes',
    },
    {
      name: DashboardCategory.SECURITY,
      displayName: 'Security & Compliance',
      description: 'Security policies and compliance monitoring',
    },
    {
      name: DashboardCategory.MANAGEMENT,
      displayName: 'Management & Monitoring',
      description: 'Ongoing management and monitoring tools',
    },
  ];

  // Computed signals for filtered cards and categories
  public readonly categories = computed(() => {
    const allCards = this.DASHBOARD_CARDS;
    const visibleCards = allCards.filter((card) => this.canShowCard(card));

    return this.CARD_CATEGORIES.filter((category) =>
      visibleCards.some((card) => card.category === category.name),
    );
  });

  public readonly user = this.authService.user;
  public readonly selectedRole = this.authService.selectedRole;
  public readonly availableRoles = this.authService.availableRoles;

  getCardsByCategory(categoryName: DashboardCategory): DashboardCard[] {
    return this.DASHBOARD_CARDS.filter((card) => card.category === categoryName)
      .filter((card) => this.canShowCard(card))
      .sort((a, b) => a.order - b.order);
  }

  canShowCard(card: DashboardCard): boolean {
    const currentRole = this.selectedRole();

    if (card.requiredRole === 'any') {
      return true;
    }

    if (card.requiredRole === UserRole.SUPER_ADMIN) {
      return currentRole === UserRole.SUPER_ADMIN;
    }

    if (card.requiredRole === UserRole.CEP_ADMIN) {
      return (
        currentRole === UserRole.CEP_ADMIN ||
        currentRole === UserRole.SUPER_ADMIN
      );
    }

    return false;
  }

  handleCardClick(card: DashboardCard): void {
    if (!card.enabled) {
      return;
    }

    if (card.action) {
      card.action();
    } else if (card.route) {
      this.router.navigate([card.route]);
    }
  }

  getRoleDisplayName(role: SelectedRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.CEP_ADMIN:
        return 'CEP Delegated Admin';
      default:
        return 'Unknown Role';
    }
  }
}
