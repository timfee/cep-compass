import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material Design imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Services
import {
  EnrollmentTokenService,
  EnrollmentToken,
  CreateTokenRequest,
  TokenCreationResponse,
} from '../../services/enrollment-token.service';
import { OrgUnitsService, OrgUnit } from '../../services/org-units.service';
import { EmailTemplateService } from '../../services/email-template.service';
import { NotificationService } from '../../core/notification.service';
import { copyToClipboard } from '../../shared/clipboard.utils';

// Components
import { EmailComposerComponent } from '../email-composer/email-composer.component';

interface BrowserEnrollmentState {
  selectedOrgUnit: string;
  createdToken: EnrollmentToken | null;
  isCreating: boolean;
  error: string | null;
  showEmailComposer: boolean;
}

/**
 * Browser Enrollment Management Component
 * Provides interface for managing Chrome browser enrollment tokens
 * and creating enrollment emails for IT administrators
 */
@Component({
  selector: 'app-browser-enrollment',
  templateUrl: './browser-enrollment.component.html',
  styleUrl: './browser-enrollment.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    EmailComposerComponent,
  ],
})
export class BrowserEnrollmentComponent implements OnInit {
  // Injected services
  private readonly enrollmentService = inject(EnrollmentTokenService);
  private readonly orgUnitService = inject(OrgUnitsService);
  private readonly emailService = inject(EmailTemplateService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  // Component state signals
  private readonly _state = signal<BrowserEnrollmentState>({
    selectedOrgUnit: '',
    createdToken: null,
    isCreating: false,
    error: null,
    showEmailComposer: false,
  });

  // Public computed state
  readonly selectedOrgUnit = computed(() => this._state().selectedOrgUnit);
  readonly createdToken = computed(() => this._state().createdToken);
  readonly isCreating = computed(() => this._state().isCreating);
  readonly error = computed(() => this._state().error);
  readonly showEmailComposer = computed(() => this._state().showEmailComposer);

  // Service state signals
  readonly orgUnits = this.orgUnitService.orgUnits;
  readonly isLoadingOrgUnits = this.orgUnitService.isLoading;
  readonly tokens = this.enrollmentService.tokens;
  readonly isLoadingTokens = this.enrollmentService.isLoading;
  readonly enrollmentError = this.enrollmentService.error;

  // Browser enrollment email template
  readonly enrollmentEmailTemplate = computed(() => {
    const templates = this.emailService.templates();
    return templates.find((t) => t.id === 'browser-enrollment') || undefined;
  });

  ngOnInit(): void {
    // Fetch org units and tokens on component initialization
    this.orgUnitService.fetchOrgUnits();
    this.enrollmentService.listTokens();
  }

  /**
   * Sets the selected organizational unit
   */
  setSelectedOrgUnit(orgUnitPath: string): void {
    this._state.update((state) => ({
      ...state,
      selectedOrgUnit: orgUnitPath,
      error: null,
    }));
  }

  /**
   * Creates a new enrollment token for the selected org unit
   */
  async createToken(): Promise<void> {
    const orgUnitPath = this.selectedOrgUnit();

    if (!orgUnitPath) {
      this.setError('Please select an organizational unit');
      return;
    }

    this._state.update((state) => ({
      ...state,
      isCreating: true,
      error: null,
    }));

    try {
      const request: CreateTokenRequest = {
        orgUnitPath,
      };

      const response: TokenCreationResponse =
        await this.enrollmentService.createToken(request);

      this._state.update((state) => ({
        ...state,
        isCreating: false,
        createdToken: response.token,
        error: null,
      }));

      this.notificationService.success(
        'Enrollment token created successfully!',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create token';
      this.setError(errorMessage);

      this._state.update((state) => ({
        ...state,
        isCreating: false,
      }));

      this.notificationService.error(errorMessage);
    }
  }

  /**
   * Copies the enrollment token to clipboard
   */
  async copyToken(): Promise<void> {
    const token = this.createdToken();
    if (!token) {
      return;
    }

    try {
      await copyToClipboard(token.token);
      this.notificationService.success('Token copied to clipboard!');
    } catch {
      this.notificationService.error('Failed to copy token to clipboard');
    }
  }

  /**
   * Opens the Google Admin Console for managing enrollment tokens
   */
  openAdminConsole(): void {
    const url = 'https://admin.google.com/ac/chrome/browser-tokens?org&hl=en';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Opens the email composer for drafting enrollment instructions
   */
  draftEmail(): void {
    const token = this.createdToken();
    if (!token) {
      this.notificationService.warning('Please create a token first');
      return;
    }

    // Set up the email template with variables
    this.emailService.selectTemplate('browser-enrollment');

    const orgUnit = this.orgUnits().find(
      (ou) => ou.orgUnitPath === token.orgUnitPath,
    );
    const expirationDate = token.expireTime
      ? new Date(token.expireTime).toLocaleDateString()
      : 'No expiration set';

    this.emailService.setVariableValues({
      orgUnitName: orgUnit?.name || token.orgUnitPath,
      enrollmentToken: token.token,
      expirationDate: expirationDate,
      adminName: '', // User will fill this in
      senderName: '', // User will fill this in
    });

    this._state.update((state) => ({
      ...state,
      showEmailComposer: true,
    }));
  }

  /**
   * Handles email composition completion
   */
  onEmailComposed(): void {
    this.notificationService.success('Email composed successfully!');

    this._state.update((state) => ({
      ...state,
      showEmailComposer: false,
    }));
  }

  /**
   * Closes the email composer
   */
  closeEmailComposer(): void {
    this._state.update((state) => ({
      ...state,
      showEmailComposer: false,
    }));
  }

  /**
   * Masks token value for display (shows only last 8 characters)
   */
  maskToken(token: string): string {
    return this.enrollmentService.maskToken(token);
  }

  /**
   * Gets formatted display name for org unit
   */
  getOrgUnitDisplayName(orgUnit: OrgUnit): string {
    return `${orgUnit.orgUnitPath} - ${orgUnit.name}`;
  }

  /**
   * Checks if token is active
   */
  isTokenActive(token: EnrollmentToken): boolean {
    return this.enrollmentService.isTokenActive(token);
  }

  /**
   * Gets formatted expiration date
   */
  getExpirationDate(token: EnrollmentToken): string {
    const date = this.enrollmentService.getTokenExpirationDate(token);
    return date ? date.toLocaleDateString() : 'No expiration';
  }

  /**
   * Gets email template variables for composition
   */
  getEmailVariables(): Record<string, string> {
    const token = this.createdToken();
    if (!token) return {};

    const orgUnit = this.orgUnits().find(
      (ou) => ou.orgUnitPath === token.orgUnitPath,
    );

    return {
      orgUnitName: orgUnit?.name || token.orgUnitPath,
      enrollmentToken: token.token,
      expirationDate: this.getExpirationDate(token),
    };
  }

  /**
   * Refreshes the tokens list
   */
  async refreshTokens(): Promise<void> {
    try {
      await this.enrollmentService.listTokens();
      this.notificationService.info('Tokens refreshed');
    } catch {
      this.notificationService.error('Failed to refresh tokens');
    }
  }

  /**
   * Refreshes the org units list
   */
  async refreshOrgUnits(): Promise<void> {
    try {
      await this.orgUnitService.fetchOrgUnits();
      this.notificationService.info('Organizational units refreshed');
    } catch {
      this.notificationService.error('Failed to refresh organizational units');
    }
  }

  /**
   * Sets error state
   */
  private setError(error: string): void {
    this._state.update((state) => ({
      ...state,
      error,
    }));
  }

  /**
   * Clears error state
   */
  clearError(): void {
    this._state.update((state) => ({
      ...state,
      error: null,
    }));
  }
}
