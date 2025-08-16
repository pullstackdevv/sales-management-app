# Settings Components

This document outlines the structure and requirements for implementing settings components in the Sales Management Application.

## Detailed Settings Components

### 1. General Settings Component
**Features:**
- Company name, logo, address
- Business hours and timezone
- Default currency and language
- Application theme preferences

### 2. Order Settings Component
**Features:**
- Order prefix and numbering
- Default order status
- Order workflow configuration
- Auto-confirmation settings

### 3. Product Settings Component
**Features:**
- Product categories management
- Default product attributes
- Inventory tracking settings
- Price calculation rules

### 4. Customer Settings Component
**Features:**
- Customer registration fields
- Customer groups and tiers
- Communication preferences
- Loyalty program settings

### 5. Payment Settings Component
**Features:**
- Payment method configuration
- Bank account details
- Payment terms and conditions
- Gateway integrations

### 6. Courier Settings Component
**Features:**
- Shipping provider management
- Rate calculation settings
- Delivery zones configuration
- Default shipping options

### 7. Origin Settings Component
**Features:**
- Warehouse/store locations
- Default pickup addresses
- Origin-specific settings
- Shipping origin management

### 8. Template Settings Component
**Features:**
- Email template customization
- Invoice and receipt templates
- Report template configuration
- Document formatting options

### 9. User Management Component
**Features:**
- User list with search and filter
- Add/Edit user modals
- Role and permission management
- User activity tracking

### 10. Dashboard Settings Component
**Features:**
- Widget arrangement
- Dashboard layout options
- Display preferences
- Performance metrics configuration

### 11. API Settings Component
**Features:**
- API key management
- Webhook configuration
- Third-party integrations
- API usage monitoring

## User Management Modals

### Add User Modal
**Fields:**
- Name (required)
- Email (required)
- Password (required)
- Confirm Password (required)
- Role (dropdown: Admin, Manager, Staff)

**Validation:**
- Name: minimum 2 characters
- Email: valid email format, unique
- Password: minimum 8 characters, must contain uppercase, lowercase, number
- Confirm Password: must match password
- Role: required selection

**Modal Behavior:**
- Opens when "Add User" button is clicked
- Form resets when modal opens
- Shows loading state during submission
- Closes automatically on successful creation
- Shows error messages for validation failures
- Has Cancel and Save buttons

### Edit User Modal
**Fields:**
- Name (required, pre-filled)
- Email (required, pre-filled)
- Password (optional, leave blank to keep current)
- Confirm Password (required if password is filled)
- Role (dropdown, pre-selected)
- Status (Active/Inactive toggle)

**Validation:**
- Same as Add User Modal
- Password is optional (only validate if provided)

**Modal Behavior:**
- Opens when "Edit" button is clicked on user row
- Form pre-fills with existing user data
- Shows loading state during submission
- Closes automatically on successful update
- Shows error messages for validation failures
- Has Cancel and Update buttons

## Implementation Guidelines

### File Structure
```
resources/js/Pages/Settings/
├── index.jsx                 # Main settings page with menu navigation
├── GeneralSettings.jsx       # Company and app preferences
├── OrderSettings.jsx         # Order workflow configuration
├── ProductSettings.jsx       # Product management settings
├── CustomerSettings.jsx      # Customer-related settings
├── PaymentSettings.jsx       # Payment methods and gateways
├── CourierSettings.jsx       # Shipping and courier settings
├── OriginSettings.jsx        # Warehouse and origin locations
├── TemplateSettings.jsx      # Email and document templates
├── UserSettings.jsx          # User management (already implemented)
├── DashboardSettings.jsx     # Dashboard customization
├── ApiSettings.jsx           # API and integration settings
└── settings.md              # This documentation
```

### Common Patterns

**State Management:**
- Use React hooks (useState, useEffect)
- Separate loading, error, and data states
- Form state management with controlled components

**API Integration:**
- Use axios instance from `@/api/axios`
- Follow REST conventions: GET, POST, PUT, DELETE
- Handle errors with try-catch and user feedback

**UI Components:**
- Use Flowbite React components (Card, Button, Modal, etc.)
- Iconify icons with consistent naming
- Tailwind CSS for styling
- SweetAlert2 for notifications

**Form Validation:**
- Client-side validation before submission
- Server-side validation error handling
- Real-time validation feedback

### API Endpoints Convention

Each settings component should use these endpoint patterns:

```
GET    /api/settings/{category}           # Get settings
PUT    /api/settings/{category}           # Update settings
POST   /api/settings/{category}/test      # Test configuration
GET    /api/settings/{category}/options   # Get dropdown options
```

Example for User Management:
```
GET    /api/users                        # List users
POST   /api/users                        # Create user
PUT    /api/users/{id}                   # Update user
DELETE /api/users/{id}                   # Delete user
```

### Error Handling

- 422: Validation errors (show field-specific messages)
- 401: Authentication required (redirect to login)
- 403: Insufficient permissions (show access denied)
- 500: Server error (show generic error message)

### Success Feedback

- Use SweetAlert2 for success notifications
- Auto-close after 2 seconds for non-critical actions
- Refresh data after successful operations
- Show loading states during operations
