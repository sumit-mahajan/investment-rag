# Testing Guide

## Running Tests

The project uses Vitest for unit and integration testing.

### Commands

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized by layer:

- `lib/repositories/__tests__/` - Repository layer tests
- `lib/services/__tests__/` - Service layer tests

## Writing Tests

### Repository Tests

Repository tests should:
- Mock the database client
- Test CRUD operations
- Verify error handling
- Test complex queries

### Service Tests

Service tests should:
- Mock repository dependencies
- Test business logic
- Verify error handling
- Test orchestration between multiple repositories

## Example Test

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DocumentService } from "../document.service";

describe("DocumentService", () => {
  let service: DocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentService();
  });

  it("should create document successfully", async () => {
    // Arrange
    const mockData = { ... };
    
    // Act
    const result = await service.registerDocument(...);
    
    // Assert
    expect(result).toBeDefined();
  });
});
```

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Mock external dependencies**: Database, APIs, file system
3. **Test edge cases**: Not just happy paths
4. **Keep tests simple**: One assertion per test when possible
5. **Use descriptive names**: Test names should explain what is being tested

## Current Test Coverage

The testing infrastructure includes:
- Example repository tests (document.repository.test.ts)
- Example service tests (document.service.test.ts)
- Test setup configuration (vitest.config.ts)

You can expand these examples to cover more scenarios.
