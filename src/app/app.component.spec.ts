import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { App } from './app.component';

describe('App', () => {
  beforeEach(async () => {
    const mockAuth = jasmine.createSpyObj('Auth', [], {
      currentUser: null,
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar span')?.textContent).toContain('CEP Compass');
  });
});
