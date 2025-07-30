import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { SelectRoleComponent } from './select-role.component';

describe('SelectRoleComponent', () => {
  let component: SelectRoleComponent;
  let fixture: ComponentFixture<SelectRoleComponent>;

  beforeEach(async () => {
    const mockAuth = jasmine.createSpyObj('Auth', [], {
      currentUser: null,
    });

    await TestBed.configureTestingModule({
      imports: [SelectRoleComponent],
      providers: [{ provide: Auth, useValue: mockAuth }],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
