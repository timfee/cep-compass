import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { OrgUnitsComponent } from './org-units.component';
import {
  OrgUnitsService,
  OrgUnit,
  OrgUnitNode,
} from '../../services/org-units.service';

describe('OrgUnitsComponent', () => {
  let component: OrgUnitsComponent;
  let fixture: ComponentFixture<OrgUnitsComponent>;
  let orgUnitsService: jasmine.SpyObj<OrgUnitsService>;

  const mockOrgUnits: OrgUnit[] = [
    {
      orgUnitId: '1',
      orgUnitPath: '/',
      name: 'Root Organization',
      description: 'Root organizational unit',
      parentOrgUnitId: '',
      parentOrgUnitPath: '',
    },
    {
      orgUnitId: '2',
      orgUnitPath: '/Engineering',
      name: 'Engineering',
      description: 'Engineering department',
      parentOrgUnitId: '1',
      parentOrgUnitPath: '/',
    },
  ];

  const mockOrgUnitTree: OrgUnitNode[] = [
    {
      orgUnitId: '1',
      orgUnitPath: '/',
      name: 'Root Organization',
      description: 'Root organizational unit',
      parentOrgUnitId: '',
      parentOrgUnitPath: '',
      children: [
        {
          orgUnitId: '2',
          orgUnitPath: '/Engineering',
          name: 'Engineering',
          description: 'Engineering department',
          parentOrgUnitId: '1',
          parentOrgUnitPath: '/',
          children: [],
          level: 1,
        },
      ],
      level: 0,
    },
  ];

  beforeEach(async () => {
    const mockOrgUnitsService = {
      fetchOrgUnits: jasmine.createSpy('fetchOrgUnits'),
      clearCache: jasmine.createSpy('clearCache'),
      orgUnits: signal(mockOrgUnits),
      orgUnitTree: signal(mockOrgUnitTree),
      isLoading: signal(false),
      error: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [OrgUnitsComponent, NoopAnimationsModule],
      providers: [{ provide: OrgUnitsService, useValue: mockOrgUnitsService }],
    }).compileComponents();

    orgUnitsService = TestBed.inject(
      OrgUnitsService,
    ) as jasmine.SpyObj<OrgUnitsService>;
    fixture = TestBed.createComponent(OrgUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display org units when available', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Root Organization');
    expect(compiled.textContent).toContain('Engineering');
  });

  it('should show loading spinner when loading', () => {
    // Test with existing mock service that has isLoading() returning true
    const mockService = {
      fetchOrgUnits: jasmine.createSpy('fetchOrgUnits'),
      clearCache: jasmine.createSpy('clearCache'),
      orgUnits: signal([]),
      orgUnitTree: signal([]),
      isLoading: signal(true),
      error: signal(null),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OrgUnitsComponent, NoopAnimationsModule],
      providers: [{ provide: OrgUnitsService, useValue: mockService }],
    });

    const loadingFixture = TestBed.createComponent(OrgUnitsComponent);
    loadingFixture.detectChanges();

    const compiled = loadingFixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-spinner')).toBeTruthy();
    expect(compiled.textContent).toContain('Loading organizational units...');
  });

  it('should show error message when error occurs', () => {
    const mockService = {
      fetchOrgUnits: jasmine.createSpy('fetchOrgUnits'),
      clearCache: jasmine.createSpy('clearCache'),
      orgUnits: signal([]),
      orgUnitTree: signal([]),
      isLoading: signal(false),
      error: signal('Failed to fetch org units'),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OrgUnitsComponent, NoopAnimationsModule],
      providers: [{ provide: OrgUnitsService, useValue: mockService }],
    });

    const errorFixture = TestBed.createComponent(OrgUnitsComponent);
    errorFixture.detectChanges();

    const compiled = errorFixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Failed to fetch org units');
  });

  it('should disable buttons when loading', () => {
    const mockService = {
      fetchOrgUnits: jasmine.createSpy('fetchOrgUnits'),
      clearCache: jasmine.createSpy('clearCache'),
      orgUnits: signal(mockOrgUnits),
      orgUnitTree: signal(mockOrgUnitTree),
      isLoading: signal(true),
      error: signal(null),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OrgUnitsComponent, NoopAnimationsModule],
      providers: [{ provide: OrgUnitsService, useValue: mockService }],
    });

    const loadingFixture = TestBed.createComponent(OrgUnitsComponent);
    loadingFixture.detectChanges();

    const buttons = loadingFixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons.forEach((button) => {
      expect(button.disabled).toBeTruthy();
    });
  });

  it('should call fetchOrgUnits when fetch button is clicked', () => {
    const button = fixture.nativeElement.querySelector(
      'button[color="primary"]',
    ) as HTMLButtonElement;
    button.click();

    expect(orgUnitsService.fetchOrgUnits).toHaveBeenCalled();
  });

  it('should call clearCache when clear button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const clearButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Clear Cache'),
    );
    clearButton?.click();

    expect(orgUnitsService.clearCache).toHaveBeenCalled();
  });

  it('should display tree structure correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Tree Structure:');
    expect(compiled.querySelector('.tree-container')).toBeTruthy();
  });

  it('should display correct count of org units', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('(2 units)');
  });
});
