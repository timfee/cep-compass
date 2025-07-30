import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorDisplayComponent } from './error-display.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

describe('ErrorDisplayComponent', () => {
  let component: ErrorDisplayComponent;
  let fixture: ComponentFixture<ErrorDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorDisplayComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('message', 'Test error message');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display error message', () => {
    const testMessage = 'Something went wrong';
    fixture.componentRef.setInput('message', testMessage);
    fixture.detectChanges();

    const messageElement = fixture.debugElement.query(By.css('.error-message'));
    expect(messageElement.nativeElement.textContent.trim()).toBe(testMessage);
  });

  it('should display custom title', () => {
    const testTitle = 'Custom Error Title';
    fixture.componentRef.setInput('message', 'Test message');
    fixture.componentRef.setInput('title', testTitle);
    fixture.detectChanges();

    const titleElement = fixture.debugElement.query(By.css('.error-title'));
    expect(titleElement.nativeElement.textContent.trim()).toBe(testTitle);
  });

  it('should display default title when not provided', () => {
    fixture.componentRef.setInput('message', 'Test message');
    fixture.detectChanges();

    const titleElement = fixture.debugElement.query(By.css('.error-title'));
    expect(titleElement.nativeElement.textContent.trim()).toBe('Error');
  });

  it('should show retry button by default', () => {
    fixture.componentRef.setInput('message', 'Test message');
    fixture.detectChanges();

    const retryButton = fixture.debugElement.query(By.css('.retry-button'));
    expect(retryButton).toBeTruthy();
  });

  it('should hide retry button when showRetry is false', () => {
    fixture.componentRef.setInput('message', 'Test message');
    fixture.componentRef.setInput('showRetry', false);
    fixture.detectChanges();

    const retryButton = fixture.debugElement.query(By.css('.retry-button'));
    expect(retryButton).toBeFalsy();
  });

  it('should disable retry button when retryDisabled is true', () => {
    fixture.componentRef.setInput('message', 'Test message');
    fixture.componentRef.setInput('retryDisabled', true);
    fixture.detectChanges();

    const retryButton = fixture.debugElement.query(By.css('.retry-button'));
    expect(retryButton.nativeElement.disabled).toBe(true);
  });

  it('should emit retry event when retry button is clicked', () => {
    spyOn(component.retry, 'emit');

    fixture.componentRef.setInput('message', 'Test message');
    fixture.detectChanges();

    const retryButton = fixture.debugElement.query(By.css('.retry-button'));
    retryButton.nativeElement.click();

    expect(component.retry.emit).toHaveBeenCalled();
  });

  it('should display custom retry button text', () => {
    const customText = 'Reload Data';
    fixture.componentRef.setInput('message', 'Test message');
    fixture.componentRef.setInput('retryButtonText', customText);
    fixture.detectChanges();

    const retryButton = fixture.debugElement.query(By.css('.retry-button'));
    expect(retryButton.nativeElement.textContent.trim()).toContain(customText);
  });

  it('should display custom icon', () => {
    const customIcon = 'warning';
    fixture.componentRef.setInput('message', 'Test message');
    fixture.componentRef.setInput('icon', customIcon);
    fixture.detectChanges();

    const iconElement = fixture.debugElement.query(By.css('.error-icon'));
    expect(iconElement.nativeElement.textContent.trim()).toBe(customIcon);
  });
});
