# MicroCare API Documentation

This document provides a professional overview of the MicroCare Backend API. For interactive documentation and testing, please use the Swagger UI.

## 🔗 Quick Links

-   **Base URL**: `http://localhost:3000/api/v1/v1`
-   **Interactive Docs (Swagger)**: `http://localhost:3000/api/docs`
-   **Health Check**: `http://localhost:3000/api/health`
-   **Prometheus Metrics**: `http://localhost:3000/metrics`

## 🔐 Authentication

All API endpoints (except registration and login) require authentication via a **Bearer Token**.

### Headers
Include the following header in your requests:
```http
Authorization: Bearer <your_access_token>
```

### Protocol
1.  **Login** or **Register** to receive an `accessToken` and `refreshToken`.
2.  Use the `accessToken` for subsequent requests.
3.  When the `accessToken` expires (15 minutes), use the `/api/v1/auth/refresh` endpoint with your `refreshToken` to get a new pair.

## 📦 Response Format

The API follows a strict JSON envelope standard for all responses.

### Success Reponse
```json
{
  "success": true,
  "data": {
    // Requested resource(s)
    "id": "uuid",
    "name": "John Doe"
  },
  "timestamp": "2024-03-20T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Descriptive error message",
    "details": {
      // Optional field validation errors
      "email": "Invalid email format"
    }
  },
  "timestamp": "2024-03-20T10:00:00.000Z"
}
```

## 📡 Common Status Codes

| Code | Description | Meaning |
| :--- | :--- | :--- |
| `200` | OK | Request succeeded. |
| `201` | Created | Resource successfully created. |
| `204` | No Content | Request succeeded, no body returned (e.g., DELETE). |
| `400` | Bad Request | Validation failed or missing parameters. |
| `401` | Unauthorized | Invalid or missing authentication token. |
| `403` | Forbidden | Authenticated, but no permission for this action. |
| `404` | Not Found | Resource does not exist. |
| `429` | Too Many Requests | Rate limit exceeded. Try again later. |
| `500` | Internal Server Error | Something went wrong on the server. |

## 🚀 Key Endpoints

### Auth
-   `POST /auth/register` - Create account
-   `POST /auth/login` - Sign in
-   `POST /auth/refresh` - Refresh token

### Journal Entries
-   `GET /entries` - List entries (supports pagination: `?page=1&limit=10`)
-   `POST /entries` - Create entry
-   `GET /entries/:id` - Get specific entry
-   `PUT /entries/:id` - Update entry
-   `DELETE /entries/:id` - Delete entry

### User
-   `GET /users/profile` - Get profile info
-   `PUT /users/profile` - Update profile
