# Testing Framework Documentation

## Overview

MedCure-Pro uses Vitest as the primary testing framework along with React Testing Library for component testing. The setup provides comprehensive testing capabilities for unit tests, integration tests, and component testing.

## Testing Stack

- **Vitest**: Fast unit test framework with native ES modules support
- **React Testing Library**: Testing utilities for React components
- **Jest DOM**: Custom matchers for DOM node assertions
- **User Event**: Fire events the same way the user does
- **JSDOM**: DOM implementation for Node.js

## Getting Started

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest src/test/basic.test.js

# Run tests in watch mode
npm test -- --watch
```

### Test File Structure

```
src/test/
├── setup.js                    # Global test configuration
├── basic.test.js               # Basic framework verification
├── MLService.test.js           # ML service unit tests
├── NotificationService.test.js # Notification service tests
├── RealTimePredictionEngine.test.js # Prediction engine tests
└── NotificationPreferences.test.jsx # React component tests
```

## Writing Tests

### Unit Tests

```javascript
import { describe, it, expect, vi } from "vitest";

describe("MyService", () => {
  it("should perform expected behavior", () => {
    // Arrange
    const input = "test";

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

### Component Tests

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyComponent from "../components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("should handle user interactions", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    const button = screen.getByRole("button");
    await user.click(button);

    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

### Mocking

#### Service Mocking

```javascript
vi.mock("../services/myService.js", () => ({
  MyService: vi.fn(() => ({
    getData: vi.fn().mockResolvedValue({ data: "mock" }),
  })),
}));
```

#### Supabase Mocking

```javascript
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      data: mockData,
      error: null,
    })),
  })),
};
```

#### Browser API Mocking

```javascript
// Already configured in setup.js
globalThis.Notification = vi.fn();
globalThis.localStorage = { ... };
```

## Test Utilities

### Global Test Helpers

Available via `globalThis.test_helpers`:

```javascript
// Mock user data
const user = globalThis.test_helpers.mockSupabaseUser;

// Mock product data
const product = globalThis.test_helpers.mockProduct;
```

### Custom Matchers

From `@testing-library/jest-dom`:

```javascript
expect(element).toBeInTheDocument();
expect(element).toHaveClass("active");
expect(element).toBeVisible();
expect(input).toHaveValue("text");
```

## Configuration

### Vitest Config (vite.config.js)

```javascript
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
  },
});
```

### Setup File (src/test/setup.js)

- Imports Jest DOM matchers
- Mocks browser APIs (localStorage, sessionStorage, matchMedia)
- Provides cleanup after each test
- Defines global test helpers

## Best Practices

### 1. Test Structure

- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Group related tests with `describe`
- Use `beforeEach` for test setup

### 2. Component Testing

- Test behavior, not implementation
- Use accessible queries (getByRole, getByLabelText)
- Test user interactions realistically
- Mock external dependencies

### 3. Service Testing

- Test all public methods
- Mock external dependencies (Supabase, APIs)
- Test error conditions
- Verify side effects

### 4. Mocking Guidelines

- Mock at the module boundary
- Use realistic mock data
- Reset mocks between tests
- Mock only what you need

## Coverage

Run coverage reports to ensure comprehensive testing:

```bash
npm run test:coverage
```

Target coverage metrics:

- Functions: 80%+
- Lines: 80%+
- Branches: 70%+
- Statements: 80%+

## Debugging Tests

### VS Code Integration

- Install Vitest extension
- Set breakpoints in test files
- Use debug mode for step-through debugging

### Console Debugging

```javascript
import { screen } from "@testing-library/react";

// Debug rendered component
screen.debug();

// Debug specific element
screen.debug(screen.getByRole("button"));
```

### Failed Test Analysis

```javascript
// Check what was actually rendered
console.log(container.innerHTML);

// Check element properties
console.log(element.textContent);
console.log(element.className);
```

## Common Patterns

### Testing Async Operations

```javascript
it("should handle async data loading", async () => {
  render(<AsyncComponent />);

  expect(screen.getByText("Loading...")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText("Data loaded")).toBeInTheDocument();
  });
});
```

### Testing Form Interactions

```javascript
it("should submit form data", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  render(<Form onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Name"), "John Doe");
  await user.click(screen.getByRole("button", { name: "Submit" }));

  expect(onSubmit).toHaveBeenCalledWith({ name: "John Doe" });
});
```

### Testing Error States

```javascript
it("should display error message on failure", async () => {
  // Mock service to return error
  mockService.getData.mockRejectedValue(new Error("API Error"));

  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText("Error loading data")).toBeInTheDocument();
  });
});
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Tests
  run: npm test

- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure correct file paths and extensions
2. **Mock Issues**: Verify mock placement and module paths
3. **Async Issues**: Use proper async/await and waitFor
4. **DOM Issues**: Check JSDOM environment setup

### Performance

- Use `vi.mock()` for heavy dependencies
- Avoid unnecessary re-renders in tests
- Clean up subscriptions and timers
- Use `vi.useFakeTimers()` for time-dependent tests

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Maintain coverage standards
3. Update test documentation
4. Add integration tests for user workflows
5. Test error conditions and edge cases

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event API](https://testing-library.com/docs/user-event/intro/)
