import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EmailTemplatesComponent } from './email-templates.component';
import { NotificationService } from '../core/notification.service';
import { ComposedEmail } from '../services/email-template.service';

describe('EmailTemplatesComponent', () => {
  let component: EmailTemplatesComponent;
  let fixture: ComponentFixture<EmailTemplatesComponent>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['info']);

    await TestBed.configureTestingModule({
      imports: [EmailTemplatesComponent, NoopAnimationsModule],
      providers: [{ provide: NotificationService, useValue: notificationSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailTemplatesComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onEmailComposed', () => {
    it('should log email to console and show notification', () => {
      const mockEmail: ComposedEmail = {
        to: ['test@example.com', 'test2@example.com'],
        cc: [],
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
      };

      spyOn(console, 'log');

      component.onEmailComposed(mockEmail);

      expect(console.log).toHaveBeenCalledWith('Composed Email:', mockEmail);
      expect(notificationService.info).toHaveBeenCalledWith(
        'Email composed for 2 recipient(s)'
      );
    });

    it('should handle single recipient', () => {
      const mockEmail: ComposedEmail = {
        to: ['test@example.com'],
        cc: [],
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
      };

      component.onEmailComposed(mockEmail);

      expect(notificationService.info).toHaveBeenCalledWith(
        'Email composed for 1 recipient(s)'
      );
    });

    it('should handle no recipients', () => {
      const mockEmail: ComposedEmail = {
        to: [],
        cc: [],
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
      };

      component.onEmailComposed(mockEmail);

      expect(notificationService.info).toHaveBeenCalledWith(
        'Email composed for 0 recipient(s)'
      );
    });
  });
});
