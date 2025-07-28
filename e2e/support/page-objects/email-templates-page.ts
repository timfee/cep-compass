import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class EmailTemplatesPage extends BasePage {
  readonly pageTitle: Locator;
  readonly emailComposer: Locator;
  readonly templateSelect: Locator;
  readonly recipientInput: Locator;
  readonly previewButton: Locator;
  readonly sendButton: Locator;
  readonly recipientChips: Locator;
  readonly previewContent: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator('.templates-card mat-card-title');
    this.emailComposer = page.locator('app-email-composer');
    this.templateSelect = page.locator('mat-select[formControlName="templateId"]');
    this.recipientInput = page.locator('input[placeholder*="recipient"]');
    this.previewButton = page.locator('button:has-text("Preview")');
    this.sendButton = page.locator('button:has-text("Send")');
    this.recipientChips = page.locator('mat-chip');
    this.previewContent = page.locator('.preview-content');
  }

  async goto(): Promise<void> {
    await this.page.goto('/email-templates');
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' });
    await this.emailComposer.waitFor({ state: 'visible' });
  }

  async selectTemplate(): Promise<void> {
    await this.templateSelect.click();
    await this.page.locator('mat-option').first().click();
  }

  async addRecipient(email: string): Promise<void> {
    await this.recipientInput.fill(email);
    await this.recipientInput.press('Enter');
  }

  async clickPreview(): Promise<void> {
    await this.previewButton.click();
  }

  async getRecipientChips(): Promise<string[]> {
    const chips = await this.recipientChips.all();
    const chipTexts: string[] = [];
    for (const chip of chips) {
      const text = await chip.textContent();
      if (text) chipTexts.push(text.trim());
    }
    return chipTexts;
  }

  /** Check if we're on the email templates page */
  async isEmailTemplatesPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/email-templates');
  }
}