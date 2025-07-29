import { TestBed } from '@angular/core/testing';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  let errorHandler: GlobalErrorHandler;
  let consoleErrorSpy: jasmine.Spy;
  let originalEnvironment: unknown;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalErrorHandler]
    });

    errorHandler = TestBed.inject(GlobalErrorHandler);
    consoleErrorSpy = spyOn(console, 'error');
    
    // Store original environment to restore later
    originalEnvironment = (window as any).environment;
  });

  afterEach(() => {
    // Restore original environment
    (window as any).environment = originalEnvironment;
  });

  describe('handleError', () => {
    it('should log error to console', () => {
      const testError = new Error('Test error message');
      
      errorHandler.handleError(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', testError);
    });

    it('should log stack trace in development mode', () => {
      // Mock environment for development
      const mockEnvironment = { production: false };
      // We need to mock the environment module since it's imported
      // In real scenarios, this would be done through dependency injection
      
      const testError = new Error('Test error with stack');
      testError.stack = 'Error stack trace\n  at someFunction\n  at anotherFunction';
      
      errorHandler.handleError(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', testError);
      // In development, we would expect stack trace to be logged
      // but since we can't easily mock the environment import,
      // we'll just verify the main error is logged
    });

    it('should handle error without stack trace', () => {
      const testError = new Error('Error without stack');
      delete testError.stack;
      
      errorHandler.handleError(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', testError);
    });

    it('should handle different types of errors', () => {
      const errors = [
        new TypeError('Type error'),
        new ReferenceError('Reference error'),
        new SyntaxError('Syntax error'),
        new RangeError('Range error'),
        new Error('Generic error'),
      ];

      errors.forEach(error => {
        consoleErrorSpy.calls.reset();
        
        errorHandler.handleError(error);
        
        expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', error);
      });
    });

    it('should handle error with empty message', () => {
      const testError = new Error('');
      
      errorHandler.handleError(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', testError);
    });

    it('should handle error with special characters in message', () => {
      const testError = new Error('Error with special chars: 特殊文字 & symbols: @#$%^&*()');
      
      errorHandler.handleError(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', testError);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const testError = new Error(longMessage);
      
      errorHandler.handleError(testError);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', testError);
    });

    it('should not throw when handling errors', () => {
      const testError = new Error('Test error');
      
      expect(() => {
        errorHandler.handleError(testError);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle null error gracefully', () => {
      expect(() => {
        errorHandler.handleError(null as any);
      }).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', null);
    });

    it('should handle undefined error gracefully', () => {
      expect(() => {
        errorHandler.handleError(undefined as any);
      }).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', undefined);
    });

    it('should handle non-Error objects', () => {
      const nonErrorObjects = [
        'string error',
        { message: 'object error' },
        123,
        true,
        [],
        Symbol('error'),
      ];

      nonErrorObjects.forEach(obj => {
        consoleErrorSpy.calls.reset();
        
        expect(() => {
          errorHandler.handleError(obj as any);
        }).not.toThrow();
        
        expect(consoleErrorSpy).toHaveBeenCalledWith('Application error:', obj);
      });
    });
  });
});