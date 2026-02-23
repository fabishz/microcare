/**
 * Input Validation Utilities and Schemas
 * Provides validation functions for emails, passwords, and request schemas
 * 
 * Requirements: 4.1, 4.2
 * - Validates all inputs and provides clear error messages
 * - Ensures data integrity and compliance with business rules
 */

/**
 * Email validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validation schema for structured validation
 */
export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * Individual validation rule
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => ValidationResult;
  errorMessage?: string;
}

/**
 * Validation error details
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Validate email format
 * 
 * Requirements: 4.1, 4.2
 * - Validates email format according to RFC 5322 (simplified)
 * - Returns validation result with error message if invalid
 * 
 * @param email - The email address to validate
 * @returns Validation result with error message if invalid
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  // RFC 5322 simplified regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Additional validation: check for consecutive dots
  if (trimmedEmail.includes('..')) {
    return { valid: false, error: 'Email cannot contain consecutive dots' };
  }

  // Additional validation: check local part length (before @)
  const [localPart] = trimmedEmail.split('@');
  if (localPart.length > 64) {
    return { valid: false, error: 'Email local part is too long (max 64 characters)' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 * 
 * Requirements: 4.1, 4.2
 * - Validates password meets security requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param password - The password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePasswordStrength(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character (!@#$%^&*...)' };
  }

  return { valid: true };
}

/**
 * Validate user name
 * 
 * Requirements: 4.1, 4.2
 * - Validates name is not empty and meets length requirements
 * 
 * @param name - The name to validate
 * @returns Validation result with error message if invalid
 */
export function validateName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: 'Name is required' };
  }

  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: 'Name is too long (max 100 characters)' };
  }

  return { valid: true };
}

/**
 * Validate journal entry title
 * 
 * Requirements: 4.1, 4.2
 * - Validates title is not empty and meets length requirements
 * 
 * @param title - The title to validate
 * @returns Validation result with error message if invalid
 */
export function validateEntryTitle(title: string): ValidationResult {
  if (!title) {
    return { valid: false, error: 'Title is required' };
  }

  if (typeof title !== 'string') {
    return { valid: false, error: 'Title must be a string' };
  }

  const trimmedTitle = title.trim();

  if (trimmedTitle.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  if (trimmedTitle.length < 1) {
    return { valid: false, error: 'Title must be at least 1 character long' };
  }

  if (trimmedTitle.length > 255) {
    return { valid: false, error: 'Title is too long (max 255 characters)' };
  }

  return { valid: true };
}

/**
 * Validate journal entry content
 * 
 * Requirements: 4.1, 4.2
 * - Validates content is not empty and meets length requirements
 * 
 * @param content - The content to validate
 * @returns Validation result with error message if invalid
 */
export function validateEntryContent(content: string): ValidationResult {
  if (!content) {
    return { valid: false, error: 'Content is required' };
  }

  if (typeof content !== 'string') {
    return { valid: false, error: 'Content must be a string' };
  }

  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }

  if (trimmedContent.length < 1) {
    return { valid: false, error: 'Content must be at least 1 character long' };
  }

  if (trimmedContent.length > 10000) {
    return { valid: false, error: 'Content is too long (max 10000 characters)' };
  }

  return { valid: true };
}

/**
 * Validate mood value
 * 
 * Requirements: 4.1, 4.2
 * - Validates mood is one of the allowed values
 * 
 * @param mood - The mood to validate
 * @returns Validation result with error message if invalid
 */
export function validateMood(mood: string): ValidationResult {
  if (!mood) {
    return { valid: false, error: 'Mood is required' };
  }

  if (typeof mood !== 'string') {
    return { valid: false, error: 'Mood must be a string' };
  }

  const allowedMoods = ['happy', 'sad', 'anxious', 'calm', 'angry', 'neutral', 'excited', 'tired'];

  if (!allowedMoods.includes(mood.toLowerCase())) {
    return {
      valid: false,
      error: `Mood must be one of: ${allowedMoods.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate tags array
 * 
 * Requirements: 4.1, 4.2
 * - Validates tags is an array of strings
 * - Each tag meets length requirements
 * 
 * @param tags - The tags array to validate
 * @returns Validation result with error message if invalid
 */
export function validateTags(tags: unknown): ValidationResult {
  if (!Array.isArray(tags)) {
    return { valid: false, error: 'Tags must be an array' };
  }

  if (tags.length > 10) {
    return { valid: false, error: 'Maximum 10 tags allowed' };
  }

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];

    if (typeof tag !== 'string') {
      return { valid: false, error: `Tag at index ${i} must be a string` };
    }

    if (tag.trim().length === 0) {
      return { valid: false, error: `Tag at index ${i} cannot be empty` };
    }

    if (tag.length > 50) {
      return { valid: false, error: `Tag at index ${i} is too long (max 50 characters)` };
    }
  }

  return { valid: true };
}

/**
 * Validate pagination parameters
 * 
 * Requirements: 4.1, 4.2
 * - Validates page and limit are positive integers within acceptable ranges
 * 
 * @param page - The page number
 * @param limit - The items per page limit
 * @returns Validation result with error message if invalid
 */
export function validatePagination(page: unknown, limit: unknown): ValidationResult {
  if (typeof page !== 'number' || !Number.isInteger(page)) {
    return { valid: false, error: 'Page must be an integer' };
  }

  if (page < 1) {
    return { valid: false, error: 'Page must be greater than 0' };
  }

  if (typeof limit !== 'number' || !Number.isInteger(limit)) {
    return { valid: false, error: 'Limit must be an integer' };
  }

  if (limit < 1) {
    return { valid: false, error: 'Limit must be greater than 0' };
  }

  if (limit > 100) {
    return { valid: false, error: 'Limit must not exceed 100' };
  }

  return { valid: true };
}

/**
 * Validate a single field against a validation rule
 * 
 * Requirements: 4.1, 4.2
 * - Validates a field against a defined rule
 * 
 * @param value - The value to validate
 * @param rule - The validation rule
 * @param fieldName - The field name for error messages
 * @returns Validation result with error message if invalid
 */
export function validateField(
  value: unknown,
  rule: ValidationRule,
  fieldName: string
): ValidationResult {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: rule.errorMessage || `${fieldName} is required` };
  }

  // If not required and empty, it's valid
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { valid: true };
  }

  // Check type
  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rule.type) {
      return {
        valid: false,
        error: rule.errorMessage || `${fieldName} must be of type ${rule.type}`,
      };
    }
  }

  // Check minLength
  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return {
      valid: false,
      error: rule.errorMessage || `${fieldName} must be at least ${rule.minLength} characters long`,
    };
  }

  // Check maxLength
  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return {
      valid: false,
      error: rule.errorMessage || `${fieldName} must not exceed ${rule.maxLength} characters`,
    };
  }

  // Check pattern
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return {
      valid: false,
      error: rule.errorMessage || `${fieldName} format is invalid`,
    };
  }

  // Check custom validation
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (!customResult.valid) {
      return {
        valid: false,
        error: customResult.error || rule.errorMessage || `${fieldName} validation failed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate an object against a validation schema
 * 
 * Requirements: 4.1, 4.2
 * - Validates all fields in an object against a schema
 * - Returns all validation errors
 * 
 * @param data - The object to validate
 * @param schema - The validation schema
 * @returns Object with validation result and errors
 */
export function validateSchema(
  data: Record<string, unknown>,
  schema: ValidationSchema
): { valid: boolean; errors?: ValidationErrors } {
  const errors: ValidationErrors = {};

  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = data[fieldName];
    const result = validateField(value, rule, fieldName);

    if (!result.valid) {
      errors[fieldName] = result.error || `${fieldName} validation failed`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Validation schemas for common request types
 */

/**
 * Schema for user registration request
 */
export const registrationSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'string',
    custom: (value) => validateEmail(value as string),
  },
  password: {
    required: true,
    type: 'string',
    custom: (value) => validatePasswordStrength(value as string),
  },
  name: {
    required: true,
    type: 'string',
    custom: (value) => validateName(value as string),
  },
};

/**
 * Schema for user login request
 */
export const loginSchema: ValidationSchema = {
  email: {
    required: true,
    type: 'string',
    custom: (value) => validateEmail(value as string),
  },
  password: {
    required: true,
    type: 'string',
  },
};

/**
 * Schema for profile update request
 */
export const updateProfileSchema: ValidationSchema = {
  name: {
    required: false,
    type: 'string',
    custom: (value) => (value ? validateName(value as string) : { valid: true }),
  },
  email: {
    required: false,
    type: 'string',
    custom: (value) => (value ? validateEmail(value as string) : { valid: true }),
  },
  aiConsent: {
    required: false,
    type: 'boolean',
  },
};

/**
 * Schema for change password request
 */
export const changePasswordSchema: ValidationSchema = {
  currentPassword: {
    required: true,
    type: 'string',
  },
  newPassword: {
    required: true,
    type: 'string',
    custom: (value) => validatePasswordStrength(value as string),
  },
};

/**
 * Schema for create journal entry request
 */
export const createEntrySchema: ValidationSchema = {
  title: {
    required: true,
    type: 'string',
    custom: (value) => validateEntryTitle(value as string),
  },
  content: {
    required: true,
    type: 'string',
    custom: (value) => validateEntryContent(value as string),
  },
  mood: {
    required: false,
    type: 'string',
    custom: (value) => (value ? validateMood(value as string) : { valid: true }),
  },
  tags: {
    required: false,
    type: 'array',
    custom: (value) => (value ? validateTags(value) : { valid: true }),
  },
};

/**
 * Schema for update journal entry request
 */
export const updateEntrySchema: ValidationSchema = {
  title: {
    required: false,
    type: 'string',
    custom: (value) => (value ? validateEntryTitle(value as string) : { valid: true }),
  },
  content: {
    required: false,
    type: 'string',
    custom: (value) => (value ? validateEntryContent(value as string) : { valid: true }),
  },
  mood: {
    required: false,
    type: 'string',
    custom: (value) => (value ? validateMood(value as string) : { valid: true }),
  },
  tags: {
    required: false,
    type: 'array',
    custom: (value) => (value ? validateTags(value) : { valid: true }),
  },
};
