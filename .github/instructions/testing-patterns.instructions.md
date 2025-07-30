---
applyTo: "src/app/**/*.spec.ts"
---

# Testing Patterns

Write unit tests for all services and components.
Mock HTTP calls in tests - do not use real Google API calls.
Use TestBed for component testing.

## Service Testing

```typescript
describe("ServiceName", () => {
  let service: ServiceName;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ServiceName],
    });
    service = TestBed.inject(ServiceName);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it("should fetch data", async () => {
    const mockData = { id: 1, name: "test" };

    const promise = service.fetchData();
    const req = httpMock.expectOne("/api/endpoint");
    expect(req.request.method).toBe("GET");
    req.flush(mockData);

    const result = await promise;
    expect(result).toEqual(mockData);
  });
});
```

## Component Testing

Test component logic and signal updates.
Verify error handling paths.
Mock all external dependencies.
Aim for 80% code coverage.
