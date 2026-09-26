# Backend Testing Documentation

Comprehensive test suite for the Story Arc Engine backend API.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Continuous Integration](#continuous-integration)

## 🎯 Overview

The backend test suite uses:
- **Jest**: Testing framework
- **Supertest**: HTTP assertions for API testing
- **MongoDB Memory Server**: In-memory database for isolated testing
- **ts-jest**: TypeScript support for Jest

### Test Types

1. **Integration Tests** (`tests/integration/`)
   - Test complete API endpoints
   - Test request/response flows
   - Test database interactions
   
2. **Unit Tests** (`tests/unit/`)
   - Test individual models
   - Test service functions
   - Test middleware

## 📁 Test Structure

```
tests/
├── setup.ts                      # Global test setup
├── README.md                     # This file
│
├── integration/                  # Integration tests
│   ├── productionPlan.test.ts   # Production plan API tests
│   ├── gemini.test.ts           # Gemini API tests
│   └── chat.test.ts             # Chat API tests
│
├── unit/                         # Unit tests
│   └── models/
│       ├── ProductionPlan.test.ts
│       └── ChatSession.test.ts
│
├── utils/                        # Test utilities
│   └── testHelpers.ts           # Helper functions and mock data
│
└── mocks/                        # Mock implementations
    └── geminiServiceMock.ts     # Mocked Gemini service
```

## 🚀 Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Generate Coverage Report
```bash
npm run test:coverage
```

Coverage report will be available in `coverage/` directory.

## 📊 Test Coverage

Current test coverage includes:

### API Endpoints (Integration Tests)

#### Production Plan API
- ✅ POST `/api/production-plans` - Create production plan
- ✅ GET `/api/production-plans/:id` - Get production plan
- ✅ GET `/api/production-plans/user/:userId` - Get user's plans
- ✅ PATCH `/api/production-plans/:id/assets` - Update assets
- ✅ DELETE `/api/production-plans/:id` - Delete plan

#### Gemini API
- ✅ POST `/api/gemini/generate-image` - Generate image
- ✅ POST `/api/gemini/generate-video` - Generate video

#### Chat API
- ✅ POST `/api/chat/sessions` - Create chat session
- ✅ POST `/api/chat/sessions/:sessionId/messages` - Send message
- ✅ GET `/api/chat/sessions/:sessionId` - Get chat history
- ✅ DELETE `/api/chat/sessions/:sessionId` - Delete session

### Models (Unit Tests)

#### ProductionPlan Model
- ✅ Model validation
- ✅ Required fields
- ✅ Default values
- ✅ Generated assets storage
- ✅ Scenes validation
- ✅ Keyframes validation
- ✅ Database indexes

#### ChatSession Model
- ✅ Model validation
- ✅ Unique sessionId constraint
- ✅ Messages array handling
- ✅ Message role validation
- ✅ Production plan reference
- ✅ Database indexes

## ✍️ Writing Tests

### Integration Test Template

```typescript
import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import yourRoutes from '../../src/routes/yourRoutes.js';

describe('Your API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/your-endpoint', yourRoutes);
  });

  describe('GET /api/your-endpoint', () => {
    it('should return data', async () => {
      const response = await request(app)
        .get('/api/your-endpoint')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });
});
```

### Unit Test Template

```typescript
import YourModel from '../../../src/models/YourModel.js';

describe('YourModel Unit Tests', () => {
  describe('Model Validation', () => {
    it('should create a valid model', async () => {
      const valid = new YourModel({
        field1: 'value1',
        field2: 'value2'
      });

      const saved = await valid.save();
      expect(saved._id).toBeDefined();
      expect(saved.field1).toBe('value1');
    });

    it('should fail without required fields', async () => {
      const invalid = new YourModel({});
      await expect(invalid.save()).rejects.toThrow();
    });
  });
});
```

## 🛠️ Test Utilities

### Test Helpers (`utils/testHelpers.ts`)

#### Mock Data

```typescript
import { mockProductionPlan, mockImageBase64, mockGeneratedImage } from './utils/testHelpers.js';

// Use in your tests
const plan = mockProductionPlan;
const image = mockGeneratedImage;
```

#### Helper Functions

```typescript
import { createMockProductionPlanData, sleep } from './utils/testHelpers.js';

// Create mock data with overrides
const data = createMockProductionPlanData({
  drawingDesc: 'Custom description',
  userId: 'custom-user-id'
});

// Add delay in tests
await sleep(1000); // Wait 1 second
```

### Mocks (`mocks/`)

#### Gemini Service Mock

```typescript
import { mockGeminiService, resetGeminiServiceMocks } from '../mocks/geminiServiceMock.js';

// Mock is automatically applied
// Reset between tests if needed
beforeEach(() => {
  resetGeminiServiceMocks();
});
```

## 🧪 Test Best Practices

### 1. Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Clean up after tests with `afterEach`

### 2. Descriptive Names
```typescript
// ✅ Good
it('should return 404 when production plan does not exist', async () => {});

// ❌ Bad
it('test 1', async () => {});
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should create a production plan', async () => {
  // Arrange
  const mockData = createMockProductionPlanData();
  
  // Act
  const response = await request(app)
    .post('/api/production-plans')
    .send(mockData);
  
  // Assert
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
});
```

### 4. Test Error Cases
```typescript
describe('Error Handling', () => {
  it('should return 400 for invalid input', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({})
      .expect(400);
    
    expect(response.body.error).toBeDefined();
  });
});
```

### 5. Avoid Test Interdependence
```typescript
// ❌ Bad - Test 2 depends on Test 1
it('should create user', async () => {
  // Creates user with ID 'test-123'
});

it('should get user', async () => {
  // Assumes 'test-123' exists from previous test
});

// ✅ Good - Each test is independent
it('should get user', async () => {
  // Create user in this test
  const user = await createTestUser();
  
  // Then test getting it
  const response = await getUser(user.id);
  expect(response).toBeDefined();
});
```

## 🔄 Database State Management

### Automatic Cleanup

The test setup automatically:
- Creates a fresh in-memory MongoDB before all tests
- Clears all collections after each test
- Closes connection after all tests

### Manual Cleanup (if needed)

```typescript
afterEach(async () => {
  await YourModel.deleteMany({});
});
```

## 📈 Coverage Goals

Target coverage:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

View coverage:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## 🔍 Debugging Tests

### Run Single Test File
```bash
npm test -- productionPlan.test.ts
```

### Run Single Test Suite
```bash
npm test -- -t "Production Plan API"
```

### Run Single Test
```bash
npm test -- -t "should create a new production plan"
```

### Enable Verbose Output
```bash
npm test -- --verbose
```

## 🤖 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          directory: ./backend/coverage
```

## 🐛 Common Issues

### Issue: Tests Hang
**Solution**: Use `--detectOpenHandles --forceExit` flags
```bash
npm test -- --detectOpenHandles --forceExit
```

### Issue: MongoDB Connection Error
**Solution**: Check that MongoDB Memory Server is installed
```bash
npm install --save-dev mongodb-memory-server
```

### Issue: Module Not Found
**Solution**: Check that jest.config.js has correct module resolution
```javascript
moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.js$': '$1',
}
```

### Issue: TypeScript Errors
**Solution**: Make sure ts-jest is configured properly
```javascript
transform: {
  '^.+\\.ts$': ['ts-jest', {
    useESM: true,
  }],
}
```

## 📝 Test Checklist

When adding new features:

- [ ] Write integration tests for new API endpoints
- [ ] Write unit tests for new models
- [ ] Test happy path scenarios
- [ ] Test error scenarios (400, 404, 500)
- [ ] Test edge cases
- [ ] Test validation rules
- [ ] Update this documentation
- [ ] Ensure coverage stays above 80%

## 🎓 Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://testingjavascript.com/)

## 🤝 Contributing

When contributing tests:
1. Follow the existing structure
2. Use descriptive test names
3. Add comments for complex logic
4. Ensure all tests pass before PR
5. Maintain or improve coverage

---

**Happy Testing! 🧪**

