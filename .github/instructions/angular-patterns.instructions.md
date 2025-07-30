---
applyTo: "src/app/**/*.ts"
---

# Angular v20+ Development Patterns

Use Angular v20+ with standalone components, signals for state management, and OnPush change detection.
Never use NgModules - all components are standalone by default.
Use the new control flow syntax: @if, @for, @switch instead of *ngIf, *ngFor, \*ngSwitch.
Prefer inject() function over constructor injection.
Use input() and output() functions instead of decorators.

## Component Structure

```typescript
@Component({
  selector: "app-feature-name",
  templateUrl: "./feature-name.component.html",
  styleUrl: "./feature-name.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule],
})
export class FeatureNameComponent {
  private readonly service = inject(ServiceName);

  loading = signal(false);
  error = signal<string | null>(null);
  data = signal<DataType | null>(null);

  async handleAction(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.service.performAction();
      this.data.set(result);
    } catch (err) {
      this.error.set(this.errorHandler.getMessage(err));
    } finally {
      this.loading.set(false);
    }
  }
}
```

## TypeScript Patterns

Use async/await instead of RxJS operators (except toSignal).
Use signals for all component state management.
Always enable strict typing.
Handle errors with try/catch blocks.
Use Promises with firstValueFrom() for single HTTP calls.
Never use the any type - use unknown with type guards instead.
