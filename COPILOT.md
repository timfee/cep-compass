# GitHub Copilot Instructions for CEP Compass

## Primary Instructions

Please refer to [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md) for the complete, authoritative instruction set that is shared across all AI agents.

## Copilot-Specific Configuration

### .github/copilot-instructions.md

When using GitHub Copilot, it will automatically read these instructions from your workspace.

### Key Patterns to Enforce

1. **Component Creation**
   - ALWAYS use `ChangeDetectionStrategy.OnPush`
   - ALWAYS use standalone components (no NgModule)
   - ALWAYS use signals for state management
   - ALWAYS use external template/style files

2. **Service Creation**
   - ALWAYS use `inject()` function
   - ALWAYS place in `/src/app/services/`
   - ALWAYS use async/await with firstValueFrom()
   - NEVER use googleapis SDK

3. **Template Patterns**
   - ALWAYS use new control flow (@if, @for, @switch)
   - NEVER use *ngIf, *ngFor, *ngSwitch
   - ALWAYS include track in @for loops
   - ALWAYS bind to signals directly

### Copilot Comments for Better Suggestions

Add these comments to guide Copilot:

```typescript
// Angular v20 standalone component with signals
// Uses OnPush change detection
// No RxJS except toSignal/toObservable

// Direct HTTP call, no googleapis SDK
// Returns Promise, not Observable

// Material Design 3 tokens only
// Use var(--mat-sys-*) CSS variables
```

### Quick Snippets

```typescript
// Component with all requirements
@Component({
  selector: 'app-$1',
  templateUrl: './$1.component.html',
  styleUrl: './$1.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule]
})
export class $1Component {
  private readonly $2Service = inject($2Service);
  
  loading = signal(false);
  data = signal<$3[]>([]);
  
  constructor() {
    effect(() => {
      // React to signals
    });
  }
}

// Service with HTTP calls
@Injectable({ providedIn: 'root' })
export class $1Service {
  private readonly http = inject(HttpClient);
  
  async get$2(): Promise<$2[]> {
    return firstValueFrom(
      this.http.get<$2[]>('/api/$3')
    );
  }
}

// Test template
describe('$1', () => {
  let component: $1;
  let fixture: ComponentFixture<$1>;
  let mockService: jasmine.SpyObj<$2Service>;
  
  beforeEach(() => {
    const spy = jasmine.createSpyObj('$2Service', ['method']);
    TestBed.configureTestingModule({
      imports: [$1],
      providers: [{ provide: $2Service, useValue: spy }]
    });
  });
  
  it('should $3', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Workspace Settings

Add to `.vscode/settings.json`:

```json
{
  "github.copilot.enable": {
    "*": true,
    "typescript": true,
    "typescriptreact": true,
    "html": true,
    "scss": true
  },
  "github.copilot.advanced": {
    "temperature": 0.3,
    "top_p": 0.95,
    "stops": ["NgModule", "*ngIf", "*ngFor", "googleapis"]
  }
}
```

### Common Copilot Corrections

When Copilot suggests old patterns, correct them:

❌ `constructor(private service: Service)`
✅ `private readonly service = inject(Service)`

❌ `*ngIf="condition"`
✅ `@if (condition()) { }`

❌ `import { googleapis } from 'googleapis'`
✅ `// Use direct HTTP calls via HttpClient`

❌ `Observable<T>`
✅ `Promise<T>` with `firstValueFrom()`

❌ `@NgModule({ })`
✅ `// Standalone component, no NgModule`

### Testing with Copilot

When writing tests:
1. Start with `describe('ComponentName', () => {`
2. Let Copilot complete the setup
3. Ensure mocks use `jasmine.createSpyObj`
4. Write descriptive test names
5. Follow AAA pattern (Arrange, Act, Assert)

Remember: The source of truth for all coding standards and patterns is [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md).