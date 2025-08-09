# Waitlist Backend

A Node.js/Express backend for managing a waitlist with both manual email/phone submission and Google OAuth integration.

## Features

- ✅ Manual waitlist signup with email and phone validation
- ✅ Google OAuth integration for seamless signup
- ✅ MongoDB database with Mongoose ODM
- ✅ Input validation and error handling
- ✅ Rate limiting and security middleware
- ✅ Admin endpoints for waitlist management
- ✅ Email notifications with beautiful templates
- ✅ RESTful API design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Google OAuth credentials

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017/waitlist_db

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRETE=your_google_client_secret
GOOGLE_CALLBACK=http://localhost:3000/api/auth/google/callback

# Session Configuration
SESSION_SECRET=your_session_secret_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM_NAME=Waitlist Team

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
   ```bash
   cp env.example .env
   # Edit .env file with your actual credentials
   ```

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm start
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Google OAuth
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/failure` - OAuth failure handler

#### User Management
- `GET /api/auth/logout` - Logout user
- `GET /api/auth/status` - Get current user status
- `GET /api/auth/check-email/:email` - Check if email exists in waitlist

### Waitlist Routes (`/api/waitlist`)

#### Manual Signup
- `POST /api/waitlist/add` - Add user to waitlist manually
  ```json
  {
    "email": "user@example.com",
    "phone": "+1234567890"
  }
  ```

#### Admin Endpoints
- `GET /api/waitlist/stats` - Get waitlist statistics
- `GET /api/waitlist/all` - Get all waitlist entries (with pagination)
- `PUT /api/waitlist/update-phone/:id` - Update user's phone number
- `DELETE /api/waitlist/remove/:id` - Remove user from waitlist
- `GET /api/waitlist/test-email` - Test email service

### Health Check
- `GET /health` - Server health check

## Usage Examples

### Frontend Integration

#### Manual Signup
```javascript
const addToWaitlist = async (email, phone) => {
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
      console.log('Successfully added to waitlist!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Google OAuth Signup
```javascript
const signInWithGoogle = () => {
  window.location.href = '/api/auth/google';
};

// Handle OAuth callback (if using popup or redirect)
const checkAuthStatus = async () => {
  const response = await fetch('/api/auth/status');
  const data = await response.json();
  
  if (data.authenticated) {
    console.log('User is authenticated:', data.user);
  }
};
```

#### Check Email Status
```javascript
const checkEmail = async (email) => {
  const response = await fetch(`/api/auth/check-email/${email}`);
  const data = await response.json();
  
  if (data.exists) {
    console.log('Email already in waitlist');
  }
};
```

## Database Schema

### Waitlist Model
```javascript
{
  email: String (required, unique),
  phone: String (required),
  googleId: String (optional, unique),
  googleProfile: {
    name: String,
    picture: String,
    email: String
  },
  isActive: Boolean (default: true),
  joinedAt: Date (default: now),
  source: String (enum: ['manual', 'google']),
  createdAt: Date,
  updatedAt: Date
}
```

## Email Features

The backend automatically sends beautiful welcome emails to users when they join the waitlist:

- **Welcome Emails** - Sent to all new waitlist members
- **Custom Templates** - Beautiful, responsive HTML email templates
- **Handlebars Integration** - Dynamic content with user data
- **SMTP Support** - Works with Gmail, SendGrid, and other SMTP providers
- **Fallback Templates** - Built-in templates if custom ones aren't found

### Email Templates

- `welcome.hbs` - Welcome email for new waitlist members
- `confirmation.hbs` - Confirmation email template

### Testing Email Service

```bash
GET /api/waitlist/test-email
```

## Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Data sanitization
- **Session Management** - Secure session handling

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Validation errors"] // Optional
}
```

## Development

### Project Structure
```
waitlist_back/
├── config/
│   └── passport.js          # Google OAuth configuration
├── middleware/
│   └── errorHandler.js      # Error handling middleware
├── models/
│   └── Waitlist.js          # Mongoose model
├── routes/
│   ├── auth.js              # Authentication routes
│   └── waitlist.js          # Waitlist management routes
├── services/
│   └── emailService.js      # Email service with templates
├── templates/
│   └── emails/
│       ├── welcome.hbs      # Welcome email template
│       └── confirmation.hbs # Confirmation email template
├── server.js                # Main server file
├── package.json
└── README.md
```

### Running Tests
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License 