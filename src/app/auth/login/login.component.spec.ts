import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    const mockAuth = jasmine.createSpyObj('Auth', [], {
      currentUser: null,
    });

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
