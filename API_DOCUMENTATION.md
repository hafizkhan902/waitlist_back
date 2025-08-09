# Waitlist Backend API Documentation

## Base URL
```
http://localhost:2000
```

## Authentication Endpoints

### 1. Google OAuth Login
**Endpoint:** `GET /api/auth/google`

**Description:** Initiates Google OAuth login process

**Request:**
```javascript
// Redirect user to this URL
window.location.href = 'http://localhost:2000/api/auth/google';
```

**Response:** Redirects to Google OAuth consent screen

---

### 2. Google OAuth Callback
**Endpoint:** `GET /api/auth/google/callback`

**Description:** Handles Google OAuth callback after successful authentication

**Request:** Automatic redirect from Google

**Response:**
```json
{
  "success": true,
  "message": "Successfully added to waitlist via Google!",
  "user": {
    "id": "6894ae47a95068e334443c52",
    "email": "user@gmail.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/...",
    "source": "google"
  }
}
```

---

### 3. Logout
**Endpoint:** `GET /api/auth/logout`

**Description:** Logs out the current user

**Request:**
```javascript
fetch('/api/auth/logout')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

### 4. Get User Status
**Endpoint:** `GET /api/auth/status`

**Description:** Gets the current user's authentication status

**Request:**
```javascript
fetch('/api/auth/status')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "user": {
    "id": "6894ae47a95068e334443c52",
    "email": "user@gmail.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/...",
    "source": "google",
    "joinedAt": "2025-08-07T13:46:47.751Z"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```

---

### 5. Check Email Exists
**Endpoint:** `GET /api/auth/check-email/:email`

**Description:** Checks if an email already exists in the waitlist

**Request:**
```javascript
fetch('/api/auth/check-email/user@example.com')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response (Email Exists):**
```json
{
  "exists": true,
  "source": "manual",
  "joinedAt": "2025-08-07T11:44:21.021Z"
}
```

**Response (Email Doesn't Exist):**
```json
{
  "exists": false
}
```

---

## Waitlist Management Endpoints

### 6. Add to Waitlist (Manual)
**Endpoint:** `POST /api/waitlist/add`

**Description:** Adds a user to the waitlist manually with email and phone

**Request:**
```javascript
fetch('/api/waitlist/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    phone: '+1234567890'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Successfully added to waitlist!",
  "user": {
    "id": "6894ae47a95068e334443c52",
    "email": "user@example.com",
    "phone": "+1234567890",
    "source": "manual",
    "joinedAt": "2025-08-07T13:46:47.751Z"
  }
}
```

**Response (Email Already Exists):**
```json
{
  "success": false,
  "error": "Email already exists in waitlist",
  "existingUser": {
    "id": "68949195ffd34a749e55bf14",
    "email": "user@example.com",
    "source": "manual",
    "joinedAt": "2025-08-07T11:44:21.021Z"
  }
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Please provide a valid email address",
      "path": "email",
      "location": "body"
    }
  ]
}
```

---

### 7. Get Waitlist Statistics
**Endpoint:** `GET /api/waitlist/stats`

**Description:** Gets waitlist statistics (admin endpoint)

**Request:**
```javascript
fetch('/api/waitlist/stats')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 15,
    "google": 8,
    "manual": 7,
    "recentSignups": 3
  }
}
```

---

### 8. Get All Waitlist Entries
**Endpoint:** `GET /api/waitlist/all`

**Description:** Gets all waitlist entries with pagination (admin endpoint)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `source` (optional): Filter by source ("google" or "manual")

**Request:**
```javascript
// Get first page
fetch('/api/waitlist/all')
  .then(response => response.json())
  .then(data => console.log(data));

// Get second page with 10 items
fetch('/api/waitlist/all?page=2&limit=10')
  .then(response => response.json())
  .then(data => console.log(data));

// Get only Google signups
fetch('/api/waitlist/all?source=google')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "6894ae47a95068e334443c52",
      "email": "user@example.com",
      "phone": "+1234567890",
      "googleId": "123456789",
      "googleProfile": {
        "name": "John Doe",
        "picture": "https://lh3.googleusercontent.com/...",
        "email": "user@gmail.com"
      },
      "isActive": true,
      "joinedAt": "2025-08-07T13:46:47.751Z",
      "source": "google",
      "createdAt": "2025-08-07T13:46:47.751Z",
      "updatedAt": "2025-08-07T13:46:47.751Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalUsers": 150,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 9. Update User Phone Number
**Endpoint:** `PUT /api/waitlist/update-phone/:id`

**Description:** Updates a user's phone number (useful for Google OAuth users)

**Request:**
```javascript
fetch('/api/waitlist/update-phone/6894ae47a95068e334443c52', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '+1987654321'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Phone number updated successfully",
  "user": {
    "id": "6894ae47a95068e334443c52",
    "email": "user@example.com",
    "phone": "+1987654321",
    "source": "google"
  }
}
```

**Response (User Not Found):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

### 10. Remove from Waitlist
**Endpoint:** `DELETE /api/waitlist/remove/:id`

**Description:** Removes a user from the waitlist (admin endpoint)

**Request:**
```javascript
fetch('/api/waitlist/remove/6894ae47a95068e334443c52', {
  method: 'DELETE'
})
.then(response => response.json())
.then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "message": "User removed from waitlist successfully"
}
```

---

### 11. Test Email Service
**Endpoint:** `GET /api/waitlist/test-email`

**Description:** Tests the email service (admin endpoint)

**Request:**
```javascript
fetch('/api/waitlist/test-email')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Failed to send test email"
}
```

---

### 12. Get User's Referral Code
**Endpoint:** `GET /api/waitlist/referral-code/:email`

**Description:** Gets a user's referral code and statistics

**Request:**
```javascript
fetch('/api/waitlist/referral-code/user@example.com')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "referralCode": "ABC123",
  "referralCount": 5,
  "referralRewards": 10
}
```

---

### 13. Get Referral Statistics
**Endpoint:** `GET /api/waitlist/referral-stats`

**Description:** Gets overall referral statistics (admin endpoint)

**Request:**
```javascript
fetch('/api/waitlist/referral-stats')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalReferrals": 25,
    "totalReferrers": 10,
    "topReferrers": [
      {
        "_id": "6894b6602ab40b922839a19d",
        "email": "user@example.com",
        "referralCode": "ABC123",
        "referralCount": 5,
        "referralRewards": 10
      }
    ]
  }
}
```

---

### 14. Validate Referral Code
**Endpoint:** `GET /api/waitlist/validate-referral/:code`

**Description:** Validates a referral code

**Request:**
```javascript
fetch('/api/waitlist/validate-referral/ABC123')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response (Valid):**
```json
{
  "success": true,
  "valid": true,
  "referrer": {
    "id": "6894b6602ab40b922839a19d",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "valid": false,
  "error": "Invalid referral code"
}
```

---

### 15. Get Users Referred by Specific User
**Endpoint:** `GET /api/waitlist/referred-by/:userId`

**Description:** Gets all users referred by a specific user

**Request:**
```javascript
fetch('/api/waitlist/referred-by/6894b6602ab40b922839a19d')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "referredUsers": [
    {
      "_id": "6894b66d2ab40b922839a1a2",
      "email": "referred@example.com",
      "source": "manual",
      "joinedAt": "2025-08-07T14:21:33.923Z"
    }
  ]
}
```

---

### 16. Update Phone Number by Email
**Endpoint:** `PUT /api/waitlist/update-phone-by-email`

**Description:** Updates a user's phone number using their email (useful for Google OAuth users)

**Request:**
```javascript
fetch('/api/waitlist/update-phone-by-email', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    phone: '+1234567890'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number updated successfully",
  "user": {
    "id": "6894ae47a95068e334443c52",
    "email": "user@example.com",
    "phone": "+1234567890",
    "source": "google"
  }
}
```

---

## System Endpoints

### 12. Health Check
**Endpoint:** `GET /health`

**Description:** Checks if the server is running

**Request:**
```javascript
fetch('/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "status": "OK",
  "message": "Waitlist backend is running"
}
```

---

## Frontend Implementation Examples

### React/JavaScript Examples

#### 1. Manual Signup Form
```javascript
const handleSignup = async (email, phone) => {
  try {
    const response = await fetch('/api/waitlist/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, phone })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Successfully added to waitlist!');
      // Handle success
    } else {
      alert(data.error || 'Failed to add to waitlist');
      // Handle error
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Network error occurred');
  }
};
```

#### 2. Google OAuth Signup
```javascript
const handleGoogleSignup = () => {
  // Redirect to Google OAuth
  window.location.href = '/api/auth/google';
};

// Handle OAuth callback (if using popup)
const checkAuthStatus = async () => {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    if (data.authenticated) {
      console.log('User authenticated:', data.user);
      // Handle authenticated user
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
  }
};
```

#### 3. Check Email Before Signup
```javascript
const checkEmailExists = async (email) => {
  try {
    const response = await fetch(`/api/auth/check-email/${email}`);
    const data = await response.json();
    
    if (data.exists) {
      alert('Email already exists in waitlist');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};
```

#### 4. Admin Dashboard - Get Statistics
```javascript
const getWaitlistStats = async () => {
  try {
    const response = await fetch('/api/waitlist/stats');
    const data = await response.json();
    
    if (data.success) {
      console.log('Waitlist stats:', data.stats);
      // Update UI with statistics
    }
  } catch (error) {
    console.error('Error getting stats:', error);
  }
};
```

#### 5. Admin Dashboard - Get Users
```javascript
const getWaitlistUsers = async (page = 1, limit = 50, source = null) => {
  try {
    let url = `/api/waitlist/all?page=${page}&limit=${limit}`;
    if (source) url += `&source=${source}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      console.log('Users:', data.users);
      console.log('Pagination:', data.pagination);
      // Update UI with users and pagination
    }
  } catch (error) {
    console.error('Error getting users:', error);
  }
};
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation Error",
  "details": ["Please provide a valid email address"]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Route not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Something went wrong!"
}
```

---

## Environment Variables

Make sure these are set in your `.env` file:

```env
# Server Configuration
PORT=2000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URL=mongodb+srv://...

# Email Configuration
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password
EMAIL_HOST=smtp.domain.com
EMAIL_PORT=465

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRETE=your_google_client_secret
GOOGLE_CALLBACK=http://localhost:2000/api/auth/google/callback

# Session Configuration
SESSION_SECRET=your_session_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

---

## Notes

1. **CORS**: The server is configured to accept requests from `http://localhost:3000` by default
2. **Email Templates**: Beautiful HTML email templates are automatically sent when users join
3. **Validation**: All inputs are validated on both client and server side
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
5. **Security**: Helmet.js security headers are enabled
6. **Session Management**: Secure session handling for OAuth users 