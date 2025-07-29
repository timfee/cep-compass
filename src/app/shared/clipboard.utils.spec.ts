import { copyToClipboard } from './clipboard.utils';

describe('copyToClipboard', () => {
  beforeEach(() => {
    // Mock document.execCommand for fallback tests
    spyOn(document, 'execCommand').and.returnValue(true);
  });

  afterEach(() => {
    // Clean up any remaining elements
    const textAreas = document.querySelectorAll('textarea');
    textAreas.forEach(el => el.remove());
  });

  describe('when navigator.clipboard is available', () => {
    beforeEach(() => {
      // Mock navigator.clipboard API
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
      };
      
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
        writable: true
      });
      
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        configurable: true,
        writable: true
      });
    });

    it('should use navigator.clipboard.writeText', async () => {
      const testText = 'Hello, World!';
      
      await copyToClipboard(testText);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
      expect(document.execCommand).not.toHaveBeenCalled();
    });

    it('should handle clipboard API errors gracefully', async () => {
      const testText = 'Error test';
      (navigator.clipboard.writeText as jasmine.Spy).and.returnValue(
        Promise.reject(new Error('Clipboard API failed'))
      );

      await expectAsync(copyToClipboard(testText)).toBeRejected();
    });
  });

  describe('when navigator.clipboard is not available', () => {
    beforeEach(() => {
      // Remove clipboard API or set secure context to false
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
        writable: true
      });
    });

    it('should use document.execCommand fallback', async () => {
      const testText = 'Fallback test';
      
      await copyToClipboard(testText);
      
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      
      // Check that a textarea was created temporarily
      const textArea = document.querySelector('textarea');
      expect(textArea).toBeNull(); // Should be removed after use
    });

    it('should create and remove textarea element properly', async () => {
      const testText = 'Textarea test';
      spyOn(document.body, 'appendChild').and.callThrough();
      spyOn(document.body, 'removeChild').and.callThrough();
      
      await copyToClipboard(testText);
      
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
    });
  });

  describe('when window is not in secure context', () => {
    beforeEach(() => {
      // Mock navigator.clipboard as available but secure context as false
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve()),
      };
      
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
        writable: true
      });
      
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        configurable: true,
        writable: true
      });
    });

    it('should use fallback when not in secure context', async () => {
      const testText = 'Not secure test';
      
      await copyToClipboard(testText);
      
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      // Set up fallback scenario
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true,
        writable: true
      });
    });

    it('should handle empty string', async () => {
      await copyToClipboard('');
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('should handle special characters', async () => {
      const specialText = '特殊文字 & symbols: @#$%^&*()';
      await copyToClipboard(specialText);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(10000);
      await copyToClipboard(longText);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });
});