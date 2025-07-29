import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoadingComponent } from './loading.component';

describe('LoadingComponent', () => {
  let component: LoadingComponent;
  let fixture: ComponentFixture<LoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
  });

  describe('spinner type', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('type', 'spinner');
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display spinner by default', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const spinner = compiled.querySelector('mat-spinner');
      const loadingContainer = compiled.querySelector('.loading-container');
      
      expect(spinner).toBeTruthy();
      expect(loadingContainer).toBeTruthy();
    });

    it('should use default diameter and stroke width', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const spinner = compiled.querySelector('mat-spinner');
      
      expect(spinner).toBeTruthy();
      // Default values should be applied
      expect(component.diameter()).toBe(40);
      expect(component.strokeWidth()).toBe(4);
    });

    it('should display message when provided', () => {
      fixture.componentRef.setInput('message', 'Loading data...');
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.loading-message');
      
      expect(message).toBeTruthy();
      expect(message?.textContent?.trim()).toBe('Loading data...');
    });

    it('should not display message when not provided', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const message = compiled.querySelector('.loading-message');
      
      expect(message).toBeFalsy();
    });

    it('should apply inline class when inline is true', () => {
      fixture.componentRef.setInput('inline', true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.loading-container');
      
      expect(container?.classList.contains('inline')).toBe(true);
    });

    it('should not apply inline class when inline is false', () => {
      fixture.componentRef.setInput('inline', false);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const container = compiled.querySelector('.loading-container');
      
      expect(container?.classList.contains('inline')).toBe(false);
    });

    it('should use custom diameter and stroke width', () => {
      fixture.componentRef.setInput('diameter', 60);
      fixture.componentRef.setInput('strokeWidth', 6);
      fixture.detectChanges();
      
      expect(component.diameter()).toBe(60);
      expect(component.strokeWidth()).toBe(6);
    });
  });

  describe('skeleton-card type', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('type', 'skeleton-card');
      fixture.detectChanges();
    });

    it('should display skeleton card', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const skeletonCard = compiled.querySelector('.skeleton-card');
      const header = compiled.querySelector('.skeleton-header');
      const content = compiled.querySelector('.skeleton-content');
      const actions = compiled.querySelector('.skeleton-actions');
      
      expect(skeletonCard).toBeTruthy();
      expect(header).toBeTruthy();
      expect(content).toBeTruthy();
      expect(actions).toBeTruthy();
    });

    it('should apply elevated class when elevated is true', () => {
      fixture.componentRef.setInput('elevated', true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('.skeleton-card');
      
      expect(card?.classList.contains('elevated')).toBe(true);
    });

    it('should not apply elevated class when elevated is false', () => {
      fixture.componentRef.setInput('elevated', false);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const card = compiled.querySelector('.skeleton-card');
      
      expect(card?.classList.contains('elevated')).toBe(false);
    });

    it('should display skeleton elements', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const avatar = compiled.querySelector('.skeleton-avatar');
      const title = compiled.querySelector('.skeleton-title');
      const subtitle = compiled.querySelector('.skeleton-subtitle');
      const lines = compiled.querySelectorAll('.skeleton-line');
      const button = compiled.querySelector('.skeleton-button');
      
      expect(avatar).toBeTruthy();
      expect(title).toBeTruthy();
      expect(subtitle).toBeTruthy();
      expect(lines.length).toBe(3); // full, medium, small
      expect(button).toBeTruthy();
    });

    it('should not display spinner or list items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const spinner = compiled.querySelector('mat-spinner');
      const listItems = compiled.querySelectorAll('.skeleton-list-item');
      
      expect(spinner).toBeFalsy();
      expect(listItems.length).toBe(0);
    });
  });

  describe('skeleton-list type', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('type', 'skeleton-list');
      fixture.detectChanges();
    });

    it('should display skeleton list with default items', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const listItems = compiled.querySelectorAll('.skeleton-list-item');
      
      expect(listItems.length).toBe(3); // Default items array [1, 2, 3]
    });

    it('should display custom number of items', () => {
      fixture.componentRef.setInput('items', [1, 2, 3, 4, 5]);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const listItems = compiled.querySelectorAll('.skeleton-list-item');
      
      expect(listItems.length).toBe(5);
    });

    it('should display skeleton elements in each list item', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const firstItem = compiled.querySelector('.skeleton-list-item');
      
      if (firstItem) {
        const avatar = firstItem.querySelector('.skeleton-avatar');
        const content = firstItem.querySelector('.skeleton-content');
        const lines = firstItem.querySelectorAll('.skeleton-line');
        const icon = firstItem.querySelector('.skeleton-icon');
        
        expect(avatar).toBeTruthy();
        expect(content).toBeTruthy();
        expect(lines.length).toBe(2); // primary, secondary
        expect(icon).toBeTruthy();
      } else {
        fail('No skeleton list items found');
      }
    });

    it('should not display spinner or card elements', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const spinner = compiled.querySelector('mat-spinner');
      const card = compiled.querySelector('.skeleton-card');
      
      expect(spinner).toBeFalsy();
      expect(card).toBeFalsy();
    });

    it('should handle empty items array', () => {
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const listItems = compiled.querySelectorAll('.skeleton-list-item');
      
      expect(listItems.length).toBe(0);
    });

    it('should handle single item array', () => {
      fixture.componentRef.setInput('items', [1]);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const listItems = compiled.querySelectorAll('.skeleton-list-item');
      
      expect(listItems.length).toBe(1);
    });
  });

  describe('input defaults', () => {
    it('should have correct default values', () => {
      expect(component.type()).toBe('spinner');
      expect(component.message()).toBeUndefined();
      expect(component.diameter()).toBe(40);
      expect(component.strokeWidth()).toBe(4);
      expect(component.inline()).toBe(false);
      expect(component.elevated()).toBe(false);
      expect(component.items()).toEqual([1, 2, 3]);
    });
  });

  describe('input changes', () => {
    it('should react to type changes', () => {
      // Start with spinner
      fixture.componentRef.setInput('type', 'spinner');
      fixture.detectChanges();
      let compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-spinner')).toBeTruthy();
      expect(compiled.querySelector('.skeleton-card')).toBeFalsy();
      
      // Change to skeleton-card
      fixture.componentRef.setInput('type', 'skeleton-card');
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-spinner')).toBeFalsy();
      expect(compiled.querySelector('.skeleton-card')).toBeTruthy();
      
      // Change to skeleton-list
      fixture.componentRef.setInput('type', 'skeleton-list');
      fixture.detectChanges();
      compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('mat-spinner')).toBeFalsy();
      expect(compiled.querySelector('.skeleton-card')).toBeFalsy();
      expect(compiled.querySelectorAll('.skeleton-list-item').length).toBe(3);
    });

    it('should react to message changes', () => {
      fixture.componentRef.setInput('type', 'spinner');
      fixture.componentRef.setInput('message', 'Initial message');
      fixture.detectChanges();
      
      let compiled = fixture.nativeElement as HTMLElement;
      let message = compiled.querySelector('.loading-message');
      expect(message?.textContent?.trim()).toBe('Initial message');
      
      // Change message
      fixture.componentRef.setInput('message', 'Updated message');
      fixture.detectChanges();
      
      compiled = fixture.nativeElement as HTMLElement;
      message = compiled.querySelector('.loading-message');
      expect(message?.textContent?.trim()).toBe('Updated message');
      
      // Remove message
      fixture.componentRef.setInput('message', undefined);
      fixture.detectChanges();
      
      compiled = fixture.nativeElement as HTMLElement;
      message = compiled.querySelector('.loading-message');
      expect(message).toBeFalsy();
    });
  });
});