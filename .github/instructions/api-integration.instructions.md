---
applyTo: "src/app/services/**/*.ts"
---

# Google API Integration Patterns

Use direct HTTP calls via Angular HttpClient - do NOT use googleapis SDK.
All Google API calls require OAuth token from AuthService.

## Key API Endpoints

- List organizational units: `GET /admin/directory/v1/customer/my_customer/orgunits`
- Create enrollment token: `POST /admin/directory/v1.1beta1/customer/my_customer/chrome/enrollmentTokens`
- List users: `GET /admin/directory/v1/users?customer=my_customer`
- Create admin role: `POST /admin/directory/v1/customer/my_customer/roles`

## Service Pattern

```typescript
@Injectable({
  providedIn: 'root'
})
export class ApiService extends BaseApiService {
  private readonly http = inject(HttpClient);
  
  async fetchData(): Promise<ApiResponse> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse>('/api/endpoint')
      );
      return response;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
}
```

## Error Handling

Always wrap API calls in try/catch blocks.
Use the NotificationService for user feedback, not raw MatSnackBar.
Implement proper loading states with signals.
