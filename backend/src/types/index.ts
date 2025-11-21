// User types
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Journal Entry types
export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateEntryRequest {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}

export interface UpdateEntryRequest {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
}

export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt';
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  statusCode: number;
  message: string;
  details?: Record<string, string>;
  timestamp: Date;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
  timestamp: Date;
}

// Authenticated Request
export interface AuthenticatedRequest {
  user?: {
    userId: string;
    email: string;
  };
}
