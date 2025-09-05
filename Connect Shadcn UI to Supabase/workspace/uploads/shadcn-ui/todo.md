# NOVACREDIT MVP Todo List

## Core Features to Implement
1. **Authentication System** - Simple login for admin/collectors
2. **Client Panel** - Register and manage clients
3. **Calculator Panel** - Calculate loan interest and payments
4. **New Loan Panel** - Create loans with validation
5. **Refinancing Panel** - Handle loan refinancing

## Files to Create/Modify (Max 8 files)

### 1. src/pages/Index.tsx
- Main dashboard with navigation to different panels
- Authentication check and login form

### 2. src/pages/ClientPanel.tsx
- Client registration form with all required fields
- Client list and management
- File upload functionality (simulated with localStorage)

### 3. src/pages/Calculator.tsx
- Loan calculator with 0.52380952% daily interest
- Real-time calculations showing all required fields

### 4. src/pages/NewLoan.tsx
- Loan creation form connected to calculator
- Validation for $100-$6000 limits
- Max 2 active loans per client check
- Payment frequency options

### 5. src/pages/Refinancing.tsx
- Refinancing eligibility check
- Connected to loan history

### 6. src/lib/storage.ts
- LocalStorage utilities for data persistence
- Client, loan, and user data management

### 7. src/types/index.ts
- TypeScript interfaces for all data structures

### 8. index.html
- Update title and metadata for NOVACREDIT

## Implementation Notes
- Use localStorage for data persistence (MVP approach)
- Simple authentication with hardcoded admin credentials
- File uploads will be simulated (base64 storage)
- Google Maps location will use browser geolocation API
- Focus on core functionality over advanced security features for MVP