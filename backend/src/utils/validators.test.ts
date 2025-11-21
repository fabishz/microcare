import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import {
  validateEmail,
  validatePasswordStrength,
  validateName,
  validateEntryTitle,
  validateEntryContent,
  validateMood,
  validateTags,
  validatePagination,
  validateField,
  validateSchema,
  registrationSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  createEntrySchema,
  updateEntrySchema,
} from './validators';

describe('Email Validation', () => {
  it('should validate correct email format', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
  });

  it('should reject email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid email format');
  });

  it('should reject email without domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject non-string email', () => {
    const result = validateEmail(123 as unknown as string);
    expect(result.valid).toBe(false);
  });

  it('should reject email with consecutive dots', () => {
    const result = validateEmail('user..name@example.com');
    expect(result.valid).toBe(false);
  });

  it('should reject email exceeding max length', () => {
    const longEmail = 'a'.repeat(255) + '@example.com';
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
  });
});

describe('Password Strength Validation', () => {
  it('should validate strong password', () => {
    const result = validatePasswordStrength('SecurePass123!');
    expect(result.valid).toBe(true);
  });

  it('should reject password without uppercase', () => {
    const result = validatePasswordStrength('securepass123!');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('uppercase');
  });

  it('should reject password without lowercase', () => {
    const result = validatePasswordStrength('SECUREPASS123!');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('lowercase');
  });

  it('should reject password without number', () => {
    const result = validatePasswordStrength('SecurePass!');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('number');
  });

  it('should reject password without special character', () => {
    const result = validatePasswordStrength('SecurePass123');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('special character');
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePasswordStrength('Pass1!');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 8');
  });

  it('should reject empty password', () => {
    const result = validatePasswordStrength('');
    expect(result.valid).toBe(false);
  });

  it('should reject non-string password', () => {
    const result = validatePasswordStrength(123 as unknown as string);
    expect(result.valid).toBe(false);
  });

  it('should reject password exceeding max length', () => {
    const longPassword = 'SecurePass123!' + 'a'.repeat(200);
    const result = validatePasswordStrength(longPassword);
    expect(result.valid).toBe(false);
  });
});

describe('Name Validation', () => {
  it('should validate correct name', () => {
    const result = validateName('John Doe');
    expect(result.valid).toBe(true);
  });

  it('should reject empty name', () => {
    const result = validateName('');
    expect(result.valid).toBe(false);
  });

  it('should reject name with only whitespace', () => {
    const result = validateName('   ');
    expect(result.valid).toBe(false);
  });

  it('should reject name shorter than 2 characters', () => {
    const result = validateName('J');
    expect(result.valid).toBe(false);
  });

  it('should reject name exceeding max length', () => {
    const longName = 'a'.repeat(101);
    const result = validateName(longName);
    expect(result.valid).toBe(false);
  });

  it('should reject non-string name', () => {
    const result = validateName(123 as unknown as string);
    expect(result.valid).toBe(false);
  });
});

describe('Entry Title Validation', () => {
  it('should validate correct title', () => {
    const result = validateEntryTitle('My Journal Entry');
    expect(result.valid).toBe(true);
  });

  it('should reject empty title', () => {
    const result = validateEntryTitle('');
    expect(result.valid).toBe(false);
  });

  it('should reject title with only whitespace', () => {
    const result = validateEntryTitle('   ');
    expect(result.valid).toBe(false);
  });

  it('should reject title exceeding max length', () => {
    const longTitle = 'a'.repeat(256);
    const result = validateEntryTitle(longTitle);
    expect(result.valid).toBe(false);
  });

  it('should reject non-string title', () => {
    const result = validateEntryTitle(123 as unknown as string);
    expect(result.valid).toBe(false);
  });
});

describe('Entry Content Validation', () => {
  it('should validate correct content', () => {
    const result = validateEntryContent('This is my journal entry content.');
    expect(result.valid).toBe(true);
  });

  it('should reject empty content', () => {
    const result = validateEntryContent('');
    expect(result.valid).toBe(false);
  });

  it('should reject content with only whitespace', () => {
    const result = validateEntryContent('   ');
    expect(result.valid).toBe(false);
  });

  it('should reject content exceeding max length', () => {
    const longContent = 'a'.repeat(10001);
    const result = validateEntryContent(longContent);
    expect(result.valid).toBe(false);
  });

  it('should reject non-string content', () => {
    const result = validateEntryContent(123 as unknown as string);
    expect(result.valid).toBe(false);
  });
});

describe('Mood Validation', () => {
  it('should validate allowed mood values', () => {
    const moods = ['happy', 'sad', 'anxious', 'calm', 'angry', 'neutral', 'excited', 'tired'];
    moods.forEach((mood) => {
      const result = validateMood(mood);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject invalid mood', () => {
    const result = validateMood('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be one of');
  });

  it('should reject empty mood', () => {
    const result = validateMood('');
    expect(result.valid).toBe(false);
  });

  it('should reject non-string mood', () => {
    const result = validateMood(123 as unknown as string);
    expect(result.valid).toBe(false);
  });
});

describe('Tags Validation', () => {
  it('should validate correct tags array', () => {
    const result = validateTags(['tag1', 'tag2', 'tag3']);
    expect(result.valid).toBe(true);
  });

  it('should reject non-array tags', () => {
    const result = validateTags('tag1');
    expect(result.valid).toBe(false);
  });

  it('should reject tags with non-string elements', () => {
    const result = validateTags(['tag1', 123, 'tag3']);
    expect(result.valid).toBe(false);
  });

  it('should reject empty tag strings', () => {
    const result = validateTags(['tag1', '', 'tag3']);
    expect(result.valid).toBe(false);
  });

  it('should reject tag exceeding max length', () => {
    const result = validateTags(['tag1', 'a'.repeat(51), 'tag3']);
    expect(result.valid).toBe(false);
  });

  it('should reject more than 10 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    const result = validateTags(tags);
    expect(result.valid).toBe(false);
  });
});

describe('Pagination Validation', () => {
  it('should validate correct pagination parameters', () => {
    const result = validatePagination(1, 10);
    expect(result.valid).toBe(true);
  });

  it('should reject page less than 1', () => {
    const result = validatePagination(0, 10);
    expect(result.valid).toBe(false);
  });

  it('should reject limit less than 1', () => {
    const result = validatePagination(1, 0);
    expect(result.valid).toBe(false);
  });

  it('should reject limit greater than 100', () => {
    const result = validatePagination(1, 101);
    expect(result.valid).toBe(false);
  });

  it('should reject non-integer page', () => {
    const result = validatePagination(1.5, 10);
    expect(result.valid).toBe(false);
  });

  it('should reject non-integer limit', () => {
    const result = validatePagination(1, 10.5);
    expect(result.valid).toBe(false);
  });
});

describe('Field Validation', () => {
  it('should validate required field', () => {
    const rule = { required: true, type: 'string' as const };
    const result = validateField('value', rule, 'testField');
    expect(result.valid).toBe(true);
  });

  it('should reject missing required field', () => {
    const rule = { required: true, type: 'string' as const };
    const result = validateField('', rule, 'testField');
    expect(result.valid).toBe(false);
  });

  it('should validate optional field', () => {
    const rule = { required: false, type: 'string' as const };
    const result = validateField('', rule, 'testField');
    expect(result.valid).toBe(true);
  });

  it('should validate field with custom validator', () => {
    const rule = {
      required: true,
      custom: (value: unknown) => validateEmail(value as string),
    };
    const result = validateField('user@example.com', rule, 'email');
    expect(result.valid).toBe(true);
  });

  it('should reject field with failed custom validator', () => {
    const rule = {
      required: true,
      custom: (value: unknown) => validateEmail(value as string),
    };
    const result = validateField('invalid-email', rule, 'email');
    expect(result.valid).toBe(false);
  });
});

describe('Schema Validation', () => {
  it('should validate registration schema with valid data', () => {
    const data = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'John Doe',
    };
    const result = validateSchema(data, registrationSchema);
    expect(result.valid).toBe(true);
  });

  it('should reject registration schema with invalid email', () => {
    const data = {
      email: 'invalid-email',
      password: 'SecurePass123!',
      name: 'John Doe',
    };
    const result = validateSchema(data, registrationSchema);
    expect(result.valid).toBe(false);
    expect(result.errors?.email).toBeDefined();
  });

  it('should reject registration schema with weak password', () => {
    const data = {
      email: 'user@example.com',
      password: 'weak',
      name: 'John Doe',
    };
    const result = validateSchema(data, registrationSchema);
    expect(result.valid).toBe(false);
    expect(result.errors?.password).toBeDefined();
  });

  it('should validate login schema with valid data', () => {
    const data = {
      email: 'user@example.com',
      password: 'SecurePass123!',
    };
    const result = validateSchema(data, loginSchema);
    expect(result.valid).toBe(true);
  });

  it('should validate update profile schema with partial data', () => {
    const data = {
      name: 'Jane Doe',
    };
    const result = validateSchema(data, updateProfileSchema);
    expect(result.valid).toBe(true);
  });

  it('should validate change password schema with valid data', () => {
    const data = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456!',
    };
    const result = validateSchema(data, changePasswordSchema);
    expect(result.valid).toBe(true);
  });

  it('should validate create entry schema with valid data', () => {
    const data = {
      title: 'My Entry',
      content: 'This is my journal entry.',
      mood: 'happy',
      tags: ['personal', 'reflection'],
    };
    const result = validateSchema(data, createEntrySchema);
    expect(result.valid).toBe(true);
  });

  it('should validate create entry schema with minimal data', () => {
    const data = {
      title: 'My Entry',
      content: 'This is my journal entry.',
    };
    const result = validateSchema(data, createEntrySchema);
    expect(result.valid).toBe(true);
  });

  it('should validate update entry schema with partial data', () => {
    const data = {
      content: 'Updated content.',
    };
    const result = validateSchema(data, updateEntrySchema);
    expect(result.valid).toBe(true);
  });

  it('should collect multiple validation errors', () => {
    const data = {
      email: 'invalid',
      password: 'weak',
      name: 'J',
    };
    const result = validateSchema(data, registrationSchema);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors || {}).length).toBeGreaterThan(1);
  });
});
