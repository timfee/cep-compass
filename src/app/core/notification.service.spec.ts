import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

/**
 * Comprehensive unit tests for NotificationService covering all notification types and configurations
 */
describe('NotificationService', () => {
  let service: NotificationService;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    service = TestBed.inject(NotificationService);
    mockSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('success notifications', () => {
    it('should display success message with correct configuration', () => {
      const message = 'Operation completed successfully';

      service.success(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: 'success-snackbar',
      });
    });

    it('should handle empty success message', () => {
      const message = '';

      service.success(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith('', 'Close', jasmine.any(Object));
    });

    it('should handle very long success message', () => {
      const message = 'A'.repeat(1000);

      service.success(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'Close', jasmine.any(Object));
    });

    it('should handle special characters in success message', () => {
      const message = 'Success! @#$%^&*()_+-={}[]|\\:";\'<>?,./';

      service.success(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'Close', jasmine.any(Object));
    });
  });

  describe('error notifications', () => {
    it('should display error message with correct configuration', () => {
      const message = 'An error occurred';

      service.error(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: 'error-snackbar',
      });
    });

    it('should use longer duration for error messages', () => {
      const message = 'Critical error occurred';

      service.error(message);

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      const config = callArgs[2] as MatSnackBarConfig;
      expect(config.duration).toBe(5000);
    });

    it('should handle error with HTML-like content', () => {
      const message = 'Error: <script>alert("test")</script>';

      service.error(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'Close', jasmine.any(Object));
    });
  });

  describe('info notifications', () => {
    it('should display info message with correct configuration', () => {
      const message = 'Information message';

      service.info(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: 'info-snackbar',
      });
    });

    it('should use same duration as success messages', () => {
      const message = 'Info message';

      service.info(message);

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      const config = callArgs[2] as MatSnackBarConfig;
      expect(config.duration).toBe(3000);
    });
  });

  describe('warning notifications', () => {
    it('should display warning message with correct configuration', () => {
      const message = 'Warning: Please review your settings';

      service.warning(message);

      expect(mockSnackBar.open).toHaveBeenCalledWith(message, 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: 'warning-snackbar',
      });
    });

    it('should use medium duration for warning messages', () => {
      const message = 'Warning message';

      service.warning(message);

      const callArgs = mockSnackBar.open.calls.mostRecent().args;
      const config = callArgs[2] as MatSnackBarConfig;
      expect(config.duration).toBe(4000);
    });
  });

  describe('configuration consistency', () => {
    it('should use consistent positioning for all notification types', () => {
      const message = 'Test message';

      service.success(message);
      service.error(message);
      service.info(message);
      service.warning(message);

      const calls = mockSnackBar.open.calls.all();
      
      calls.forEach(call => {
        const config = call.args[2] as MatSnackBarConfig;
        expect(config.horizontalPosition).toBe('center');
        expect(config.verticalPosition).toBe('bottom');
      });
    });

    it('should use "Close" action text for all notification types', () => {
      const message = 'Test message';

      service.success(message);
      service.error(message);
      service.info(message);
      service.warning(message);

      const calls = mockSnackBar.open.calls.all();
      
      calls.forEach(call => {
        expect(call.args[1]).toBe('Close');
      });
    });

    it('should apply unique panel classes for each notification type', () => {
      const message = 'Test message';

      service.success(message);
      service.error(message);
      service.info(message);
      service.warning(message);

      const calls = mockSnackBar.open.calls.all();
      const configs = calls.map(call => call.args[2] as MatSnackBarConfig);
      
      expect(configs[0].panelClass).toBe('success-snackbar');
      expect(configs[1].panelClass).toBe('error-snackbar');
      expect(configs[2].panelClass).toBe('info-snackbar');
      expect(configs[3].panelClass).toBe('warning-snackbar');
    });
  });

  describe('duration hierarchy', () => {
    it('should have correct duration hierarchy: error > warning > success = info', () => {
      const message = 'Test message';

      service.success(message);
      service.error(message);
      service.info(message);
      service.warning(message);

      const calls = mockSnackBar.open.calls.all();
      const durations = calls.map(call => (call.args[2] as MatSnackBarConfig).duration || 0);
      
      const successDuration = durations[0]; // 3000
      const errorDuration = durations[1];   // 5000
      const infoDuration = durations[2];    // 3000
      const warningDuration = durations[3]; // 4000

      expect(errorDuration).toBeGreaterThan(warningDuration);
      expect(warningDuration).toBeGreaterThan(successDuration);
      expect(successDuration).toBe(infoDuration);
    });
  });

  describe('multiple notification handling', () => {
    it('should handle rapid successive notifications', () => {
      service.success('First message');
      service.error('Second message');
      service.warning('Third message');

      expect(mockSnackBar.open).toHaveBeenCalledTimes(3);
    });

    it('should not interfere with previous notifications', () => {
      const firstMessage = 'First notification';
      const secondMessage = 'Second notification';

      service.success(firstMessage);
      service.error(secondMessage);

      const calls = mockSnackBar.open.calls.all();
      expect(calls[0].args[0]).toBe(firstMessage);
      expect(calls[1].args[0]).toBe(secondMessage);
    });
  });

  describe('edge cases', () => {
    it('should handle null message gracefully', () => {
      const nullMessage = null as unknown as string;
      service.success(nullMessage);

      expect(mockSnackBar.open).toHaveBeenCalledWith(nullMessage, 'Close', jasmine.any(Object));
    });

    it('should handle undefined message gracefully', () => {
      const undefinedMessage = undefined as unknown as string;
      service.error(undefinedMessage);

      expect(mockSnackBar.open).toHaveBeenCalledWith(undefinedMessage, 'Close', jasmine.any(Object));
    });

    it('should handle numeric message', () => {
      const numericMessage = 123 as unknown as string;
      service.info(numericMessage);

      expect(mockSnackBar.open).toHaveBeenCalledWith(numericMessage, 'Close', jasmine.any(Object));
    });

    it('should handle object message', () => {
      const objectMessage = { error: 'test' } as unknown as string;
      service.warning(objectMessage);

      expect(mockSnackBar.open).toHaveBeenCalledWith(objectMessage, 'Close', jasmine.any(Object));
    });
  });

  describe('accessibility and user experience', () => {
    it('should provide sufficient reading time for different message types', () => {
      const shortMessage = 'OK';
      const longMessage = 'This is a very long message that requires more time to read and understand the full context.';

      service.success(shortMessage);
      service.error(longMessage);

      const calls = mockSnackBar.open.calls.all();
      const shortMessageDuration = (calls[0].args[2] as MatSnackBarConfig).duration || 0;
      const longMessageDuration = (calls[1].args[2] as MatSnackBarConfig).duration || 0;

      // Error messages get longer duration regardless of length
      expect(longMessageDuration).toBeGreaterThan(shortMessageDuration);
    });

    it('should use semantic panel classes for styling', () => {
      service.success('Test');
      service.error('Test');
      service.info('Test');
      service.warning('Test');

      const calls = mockSnackBar.open.calls.all();
      const panelClasses = calls.map(call => (call.args[2] as MatSnackBarConfig).panelClass);

      expect(panelClasses).toEqual([
        'success-snackbar',
        'error-snackbar',
        'info-snackbar',
        'warning-snackbar'
      ]);
    });
  });

  describe('Material Design compliance', () => {
    it('should follow Material Design notification positioning', () => {
      service.success('Test message');

      const config = mockSnackBar.open.calls.mostRecent().args[2] as MatSnackBarConfig;
      expect(config.horizontalPosition).toBe('center');
      expect(config.verticalPosition).toBe('bottom');
    });

    it('should provide dismissible notifications', () => {
      service.error('Test error');

      const actionText = mockSnackBar.open.calls.mostRecent().args[1];
      expect(actionText).toBe('Close');
    });
  });
});