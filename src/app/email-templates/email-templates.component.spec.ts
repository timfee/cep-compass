import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EmailTemplatesComponent } from './email-templates.component';
import { ComposedEmail } from '../services/email-template.service';

describe('EmailTemplatesComponent', () => {
  let component: EmailTemplatesComponent;
  let fixture: ComponentFixture<EmailTemplatesComponent>;

  beforeEach(async () => {
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [EmailTemplatesComponent, NoopAnimationsModule],
      providers: [{ provide: MatSnackBar, useValue: snackBarSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onEmailComposed', () => {
    it('should log email to console and show snackbar', () => {
      const mockEmail: ComposedEmail = {
        to: ['test@example.com', 'test2@example.com'],
        cc: [],
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
      };

      spyOn(console, 'log');
      spyOn(component['snackBar'], 'open');

      component.onEmailComposed(mockEmail);

      expect(console.log).toHaveBeenCalledWith('Composed Email:', mockEmail);
      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Email composed for 2 recipient(s)',
        'Close',
        { duration: 3000 },
      );
    });

    it('should handle single recipient', () => {
      const mockEmail: ComposedEmail = {
        to: ['test@example.com'],
        cc: [],
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
      };

      spyOn(component['snackBar'], 'open');

      component.onEmailComposed(mockEmail);

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Email composed for 1 recipient(s)',
        'Close',
        { duration: 3000 },
      );
    });

    it('should handle no recipients', () => {
      const mockEmail: ComposedEmail = {
        to: [],
        cc: [],
        subject: 'Test Subject',
        body: '<p>Test Body</p>',
      };

      spyOn(component['snackBar'], 'open');

      component.onEmailComposed(mockEmail);

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Email composed for 0 recipient(s)',
        'Close',
        { duration: 3000 },
      );
    });
  });
});