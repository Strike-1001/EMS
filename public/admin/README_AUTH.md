# Admin Authentication System

This document explains how the admin authentication system works in the Employee Management System.

## Overview

The admin authentication system ensures that all admin pages require proper login before access. It consists of:

1. **auth.html** - Authentication wrapper page
2. **auth-check.js** - JavaScript authentication checker
3. **Backend verification endpoint** - `/api/admin/verify`

## How It Works

### 1. Authentication Flow

1. When an admin tries to access any admin page, `auth-check.js` runs automatically
2. The script checks for admin token in localStorage
3. If no token exists, redirects to `auth.html`
4. `auth.html` verifies the token with the server
5. If valid, redirects to the original page
6. If invalid, shows login prompt

### 2. Files Structure

```
public/admin/
├── auth.html              # Authentication wrapper page
├── auth-check.js          # Authentication checker script
├── login.html             # Admin login page
├── login.js               # Login functionality
├── dashboard/
│   └── dashboard.html     # Dashboard (includes auth-check.js)
├── employees/
│   └── employees.html     # Employees page (includes auth-check.js)
├── attendance/
│   └── attendance.html    # Attendance page (includes auth-check.js)
├── leaves/
│   └── leaves.html        # Leave management (includes auth-check.js)
├── tasks/
│   └── tasks.html         # Task management (includes auth-check.js)
├── messages/
│   └── messages.html      # Messages (includes auth-check.js)
├── reports/
│   └── reports.html       # Reports (includes auth-check.js)
├── settings/
│   └── settings.html      # Settings (includes auth-check.js)
└── profile/
    └── profile.html       # Profile (includes auth-check.js)
```

### 3. Usage

#### For Existing Pages
All admin pages already include the authentication check by adding:
```html
<script src="../auth-check.js"></script>
```

#### For New Admin Pages
To add authentication to a new admin page:

1. Add the script tag in the `<head>` section:
```html
<script src="../auth-check.js"></script>
```

2. Include a logout button with id="logoutBtn":
```html
<button id="logoutBtn" class="logout-btn">
    <i class="fas fa-sign-out-alt"></i> Logout
</button>
```

3. Optionally include admin info display elements:
```html
<span id="adminName">Admin</span>
<img id="headerAvatar" src="..." alt="Admin" class="user-avatar">
```

### 4. API Endpoints

#### Verify Admin Token
- **URL**: `GET /api/admin/verify`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: 
  ```json
  {
    "message": "Token verified",
    "admin": { /* admin info */ },
    "valid": true
  }
  ```

#### Login
- **URL**: `POST /api/admin/login`
- **Body**: `{ "email": "...", "password": "..." }`
- **Response**: 
  ```json
  {
    "message": "Login successful",
    "admin": { /* admin info */ },
    "token": "jwt_token_here"
  }
  ```

### 5. Security Features

1. **Token Verification**: Every page load verifies the JWT token with the server
2. **Automatic Logout**: Invalid tokens are cleared and user is redirected to login
3. **Offline Protection**: Network errors still require valid tokens for access
4. **Secure Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)

### 6. Customization

#### Changing Redirect Behavior
Modify the `redirectToAuth()` function in `auth-check.js`:
```javascript
function redirectToAuth() {
    const currentPath = window.location.pathname;
    const adminPath = currentPath.replace('/public/admin/', '');
    const authUrl = `auth.html?redirect=${encodeURIComponent(adminPath)}`;
    window.location.href = authUrl;
}
```

#### Custom Error Messages
Update the error messages in `auth.html`:
```html
<div class="error-message" id="error-message">
    You need to be logged in as an admin to access this page.
</div>
```

### 7. Testing

1. **Test Login**: Access any admin page without being logged in
2. **Test Logout**: Click logout button and verify redirect to login
3. **Test Token Expiry**: Manually clear localStorage and refresh page
4. **Test Network Issues**: Disconnect internet and verify offline behavior

## Troubleshooting

### Common Issues

1. **Infinite Redirect Loop**: Check if `auth.html` is being accessed correctly
2. **Token Not Found**: Verify login process stores tokens properly
3. **API Errors**: Check server logs for `/api/admin/verify` endpoint issues
4. **CORS Issues**: Ensure proper CORS configuration for API calls

### Debug Mode

Enable debug logging by adding to `auth-check.js`:
```javascript
console.log('Auth check running...');
console.log('Token:', localStorage.getItem('adminToken'));
console.log('Admin info:', localStorage.getItem('adminInfo'));
```
