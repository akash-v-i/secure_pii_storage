# PiiVault Guard - Complete Project Overview

## 📋 Table of Contents
1. [Project Summary](#project-summary)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Frontend Architecture](#frontend-architecture)
5. [Key Features](#key-features)
6. [Component Breakdown](#component-breakdown)
7. [State Management](#state-management)
8. [Routing & Navigation](#routing--navigation)
9. [Authentication System](#authentication-system)
10. [Styling & Theming](#styling--theming)
11. [Data Flow](#data-flow)

---

## 🎯 Project Summary

**PiiVault Guard** is a secure React-based web application designed for storing and managing Personally Identifiable Information (PII). It provides a comprehensive vault system with encryption simulation, role-based access control, audit logging, and secure file management capabilities.

### Core Purpose
- Secure storage and management of sensitive personal information
- Role-based access control (Admin, User, Auditor)
- Audit trail and activity logging
- Encrypted data handling with secure reveal mechanisms
- File upload and management system

---

## 🛠 Tech Stack

### **Core Framework & Build Tools**
- **React 18.3.1** - UI library with modern hooks and functional components
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 7.3.0** - Fast build tool and dev server (port 8080)
- **@vitejs/plugin-react-swc** - Fast React refresh using SWC compiler

### **Routing**
- **React Router DOM 6.30.1** - Client-side routing and navigation

### **UI Component Library**
- **shadcn/ui** - Accessible component library built on Radix UI
- **Radix UI** - Headless UI primitives (49+ components)
  - Dialog, Dropdown, Select, Table, Toast, Tooltip, etc.
- **Lucide React 0.462.0** - Icon library

### **Form Management**
- **React Hook Form 7.61.1** - Performant form handling
- **Zod 3.25.76** - Schema validation
- **@hookform/resolvers 3.10.0** - Zod integration for React Hook Form

### **State Management & Data Fetching**
- **TanStack React Query 5.83.0** - Server state management and caching
- **Custom Store Pattern** - In-memory store for PII records using `useSyncExternalStore`

### **Styling**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **tailwindcss-animate 1.0.7** - Animation utilities
- **@tailwindcss/typography 0.5.16** - Typography plugin
- **PostCSS 8.5.6** - CSS processing
- **Autoprefixer 10.4.21** - CSS vendor prefixing

### **Notifications**
- **Sonner 1.7.4** - Toast notification system

### **Utilities**
- **date-fns 3.6.0** - Date manipulation
- **clsx 2.1.1** - Conditional class names
- **tailwind-merge 2.6.0** - Merge Tailwind classes
- **class-variance-authority 0.7.1** - Component variant management

### **Development Tools**
- **ESLint 9.32.0** - Code linting
- **TypeScript ESLint 8.38.0** - TypeScript-specific linting rules

---

## 📁 Project Structure

```
piivault-guard/
├── public/
│   ├── favicon.svg          # Application icon (shield/vault design)
│   └── robots.txt           # SEO robots file
│
├── src/
│   ├── main.tsx             # Application entry point
│   ├── App.tsx              # Root component with routing
│   ├── App.css              # Global app styles
│   ├── index.css            # Tailwind imports & CSS variables
│   │
│   ├── components/
│   │   ├── common/          # Shared/common components
│   │   │   ├── PageHeader.tsx      # Reusable page header
│   │   │   ├── SecureValueCell.tsx # Encrypted value reveal component
│   │   │   └── StatCard.tsx        # Dashboard statistics card
│   │   │
│   │   ├── layout/          # Layout components
│   │   │   ├── AppLayout.tsx       # Main app layout wrapper
│   │   │   └── AppSidebar.tsx      # Navigation sidebar
│   │   │
│   │   ├── ui/              # shadcn/ui components (49 files)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (44 more components)
│   │   │
│   │   └── NavLink.tsx      # Custom navigation link component
│   │
│   ├── pages/               # Route components
│   │   ├── Index.tsx        # Redirect handler
│   │   ├── Login.tsx        # Authentication page
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Vault.tsx        # PII records view
│   │   ├── AddPII.tsx       # Add new PII record form
│   │   ├── SecureFiles.tsx  # File management
│   │   ├── Alerts.tsx       # Security alerts
│   │   ├── LoginHistory.tsx # Login activity log
│   │   ├── AuditLogs.tsx    # Audit trail (admin/auditor)
│   │   ├── Privacy.tsx      # Privacy settings
│   │   └── NotFound.tsx        # 404 page
│   │
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.tsx  # Authentication state & methods
│   │
│   ├── stores/              # State stores
│   │   └── piiStore.ts      # PII records in-memory store
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx   # Mobile detection hook
│   │   └── use-toast.ts     # Toast notification hook
│   │
│   ├── lib/                 # Utility functions
│   │   └── utils.ts         # Helper functions (cn, etc.)
│   │
│   └── types/               # TypeScript type definitions
│       └── auth.ts          # Authentication types
│
├── dist/                    # Production build output
│   ├── assets/              # Bundled JS/CSS
│   ├── index.html           # Built HTML
│   └── robots.txt
│
├── node_modules/            # Dependencies
│
├── Configuration Files
│   ├── package.json         # Dependencies & scripts
│   ├── vite.config.ts       # Vite configuration
│   ├── tsconfig.json        # TypeScript config
│   ├── tsconfig.app.json    # App-specific TS config
│   ├── tsconfig.node.json   # Node-specific TS config
│   ├── tailwind.config.ts   # Tailwind configuration
│   ├── postcss.config.js    # PostCSS configuration
│   ├── components.json      # shadcn/ui configuration
│   ├── eslint.config.js     # ESLint configuration
│   └── index.html           # HTML template
│
└── README.md                # Project documentation
```

---

## 🏗 Frontend Architecture

### **Application Entry Point**

**`src/main.tsx`**
- Renders the root React component into `#root` DOM element
- Imports global CSS styles

**`src/App.tsx`** - Root Component
```typescript
Structure:
├── QueryClientProvider (TanStack React Query)
│   └── TooltipProvider (Radix UI)
│       └── AuthProvider (Custom Context)
│           ├── Toaster (Toast notifications)
│           └── Sonner (Alternative toast system)
│               └── BrowserRouter (React Router)
│                   └── Routes
│                       ├── /login → Login page
│                       ├── / → Redirect to /dashboard
│                       └── AppLayout (Protected routes)
│                           ├── /dashboard
│                           ├── /vault
│                           ├── /add-pii
│                           ├── /files
│                           ├── /alerts
│                           ├── /login-history
│                           ├── /audit-logs (role-based)
│                           └── /privacy
```

### **Layout System**

**AppLayout Component** (`src/components/layout/AppLayout.tsx`)
- Wraps all authenticated routes
- Provides authentication guard (redirects to `/login` if not authenticated)
- Contains:
  - **AppSidebar** - Left navigation panel
  - **Main Content Area** - Right side with page content

**AppSidebar Component** (`src/components/layout/AppSidebar.tsx`)
- Fixed left sidebar (256px width)
- Navigation menu with role-based filtering
- User profile section with logout
- Responsive design considerations

---

## 🔑 Key Features

### 1. **Authentication System**
- **Login/Registration**: Email + password with CAPTCHA verification
- **Role-Based Access**: Three roles (user, admin, auditor)
- **Session Management**: In-memory session state
- **Default Demo Users**:
  - `admin@vault.com` / `Admin123!` (admin role)
  - `user@vault.com` / `User1234!` (user role)
  - `auditor@vault.com` / `Audit123!` (auditor role)

### 2. **PII Vault Management**
- **View All Records**: Table view with search and filter
- **Add New Records**: Form-based entry with validation
- **Secure Value Display**: Encrypted values with temporary reveal (5 seconds)
- **Expiry Tracking**: Date-based expiration warnings
- **Delete Records**: Confirmation dialog with audit logging

### 3. **Dashboard**
- **Statistics Cards**: PII count, last login, alerts, file count
- **Security Status**: Encryption status, 2FA, session timeout
- **Recent Activity**: Timeline of recent actions

### 4. **Secure File Management**
- File upload interface
- Encrypted file storage simulation
- File listing and management

### 5. **Security Features**
- **Alerts System**: Security notifications
- **Login History**: Track authentication attempts
- **Audit Logs**: Comprehensive activity trail (admin/auditor only)
- **Privacy Settings**: User privacy controls

---

## 🧩 Component Breakdown

### **Common Components**

**PageHeader** (`src/components/common/PageHeader.tsx`)
- Reusable page title component
- Supports icon, description, and action buttons
- Consistent styling across pages

**SecureValueCell** (`src/components/common/SecureValueCell.tsx`)
- Displays encrypted values with blur effect
- "Reveal" button temporarily shows value (5 seconds)
- Logs access when revealed
- Visual feedback during reveal

**StatCard** (`src/components/common/StatCard.tsx`)
- Dashboard statistics display
- Icon, value, subtitle support
- Variant-based styling (secure, warning, default)

### **Page Components**

**Login** (`src/pages/Login.tsx`)
- Split-screen design (branding left, form right)
- Toggle between login/register modes
- Form validation (email, password strength)
- CAPTCHA verification ("SECURE" word)
- Demo credentials display

**Dashboard** (`src/pages/Dashboard.tsx`)
- Welcome message with user name
- 4-column stats grid
- Security status card
- Recent activity timeline

**Vault** (`src/pages/Vault.tsx`)
- Searchable PII records table
- Filter functionality
- Secure value cells with reveal
- Expiry date badges (expired/warning/normal)
- Delete confirmation dialogs

**AddPII** (`src/pages/AddPII.tsx`)
- Multi-step form with validation
- PII type selector (8 types)
- Dynamic placeholders based on type
- Optional notes and expiry date
- Encryption simulation on submit

---

## 📊 State Management

### **Authentication State** (`src/contexts/AuthContext.tsx`)

**Context API Pattern**
- Global authentication state
- User information (id, username, email, role, lastLogin)
- Authentication methods:
  - `login(email, password, captcha)` - Authenticates user
  - `logout()` - Clears session
  - `register(email, password, name)` - Creates new account
  - `hasRole(roles[])` - Role-based access check

**Storage**
- Registered users stored in `localStorage` (`vault_registered_users`)
- Default demo users hardcoded
- Session state in React Context (in-memory)

### **PII Store** (`src/stores/piiStore.ts`)

**Custom Store Pattern with `useSyncExternalStore`**
```typescript
Interface:
- getRecords(): PIIRecord[] - Get all records
- addRecord(record): PIIRecord - Add new record
- deleteRecord(id): void - Remove record
- subscribe(listener): unsubscribe - Subscribe to changes
```

**Features**
- In-memory storage (not persisted)
- Initial demo records (3 records)
- Reactive updates using subscription pattern
- Stable array references for React optimization

**PIIRecord Interface**
```typescript
{
  id: string
  type: string              // 'ssn', 'passport', etc.
  typeLabel: string         // 'Social Security Number'
  value: string            // Encrypted/masked value
  label: string            // User-friendly label
  notes?: string           // Optional notes
  lastAccessed: string     // ISO timestamp
  expiryDate?: string      // Optional expiry
}
```

### **React Query** (TanStack Query)
- Configured but primarily used for future API integration
- QueryClient setup in App.tsx
- Ready for server state management

---

## 🧭 Routing & Navigation

### **Route Structure**

**Public Routes**
- `/login` - Authentication page (redirects to dashboard if authenticated)

**Protected Routes** (wrapped in `AppLayout`)
- `/` - Redirects to `/dashboard`
- `/dashboard` - Main dashboard
- `/vault` - PII records view
- `/add-pii` - Add new PII record
- `/files` - Secure file management
- `/alerts` - Security alerts
- `/login-history` - Login activity log
- `/audit-logs` - Audit trail (admin/auditor only)
- `/privacy` - Privacy settings
- `*` - 404 Not Found page

### **Navigation Flow**

1. **Unauthenticated User**
   - All routes → Redirect to `/login`
   - Login success → Navigate to `/dashboard`

2. **Authenticated User**
   - `/login` → Redirect to `/dashboard`
   - All other routes → Access granted (role-based filtering)

3. **Role-Based Access**
   - Sidebar filters menu items based on user role
   - `/audit-logs` only visible to admin/auditor

### **Navigation Component**

**AppSidebar** provides:
- Visual navigation menu
- Active route highlighting
- Role-based menu filtering
- User profile display
- Logout functionality

---

## 🔐 Authentication System

### **Authentication Flow**

1. **User Registration**
   ```
   User fills form → Validation → Check existing email
   → Store in localStorage → Success message → Switch to login
   ```

2. **User Login**
   ```
   User enters credentials + CAPTCHA → Validate CAPTCHA ("secure")
   → Check user database (localStorage + defaults)
   → Create session → Update AuthContext → Navigate to dashboard
   ```

3. **Session Management**
   - Session stored in React Context (in-memory)
   - No persistent session (cleared on refresh)
   - Logout clears context state

### **User Roles**

**User** (default)
- Access to: Dashboard, Vault, Add PII, Files, Alerts, Login History, Privacy

**Admin**
- All user permissions
- Additional: Audit Logs access

**Auditor**
- All user permissions
- Additional: Audit Logs access (read-only audit trail)

### **Password Requirements**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## 🎨 Styling & Theming

### **Tailwind CSS Configuration**

**Color System** (HSL-based)
- **Primary**: Dark slate (authority/security)
- **Secondary**: Blue (actions)
- **Secure**: Green (security indicators)
- **Warning**: Amber (alerts)
- **Destructive**: Red (errors/danger)
- **Muted**: Gray (subtle elements)

**Custom Colors**
- `secure` - Green for security indicators
- `sidebar` - Dark theme for navigation
- Custom gradients for headers and secure elements

**CSS Variables** (`src/index.css`)
- HSL color values for theming
- Dark mode support via `.dark` class
- Custom gradients and shadows
- Animation keyframes

### **Design System**

**Typography**
- Font: Inter (Google Fonts)
- Responsive sizing
- Clear hierarchy

**Components**
- Consistent spacing (Tailwind scale)
- Rounded corners (border-radius: 0.625rem default)
- Shadow system (sm, md, lg, card, secure)
- Animation utilities (fade-in, slide-in, pulse)

**Responsive Design**
- Mobile-first approach
- Breakpoints: sm, md, lg, xl, 2xl
- Sidebar hidden on mobile (can be enhanced)
- Grid layouts adapt to screen size

### **Custom Utilities**

**CSS Classes**
- `.gradient-secure` - Green gradient background
- `.gradient-primary` - Dark gradient
- `.gradient-header` - Header gradient
- `.blur-secure` - Blur effect for encrypted values
- `.glass-card` - Glassmorphism effect
- `.secure-glow` - Green shadow glow
- `.animate-fade-in` - Fade animation
- `.animate-slide-in` - Slide animation

---

## 🔄 Data Flow

### **PII Record Lifecycle**

1. **Creation**
   ```
   User fills AddPII form → Validation (Zod)
   → Submit → Simulate encryption delay (1.5s)
   → piiStore.addRecord() → Update store
   → Toast notification → Navigate to /vault
   ```

2. **Viewing**
   ```
   Vault page → useSyncExternalStore(piiStore)
   → Subscribe to changes → Render table
   → User clicks "Reveal" → SecureValueCell
   → Temporarily show value (5s) → Log access
   ```

3. **Deletion**
   ```
   User clicks delete → AlertDialog confirmation
   → Confirm → piiStore.deleteRecord()
   → Update store → Toast notification
   → Table re-renders (subscription)
   ```

### **Authentication Flow**

1. **Login**
   ```
   Login form → Validate → AuthContext.login()
   → Check credentials → Update AuthContext state
   → React Router navigate → AppLayout renders
   → Sidebar + page content
   ```

2. **Route Protection**
   ```
   User navigates → AppLayout checks isAuthenticated
   → If false → Navigate to /login
   → If true → Render Outlet (page content)
   ```

### **State Updates**

**Reactive Updates**
- PII Store uses subscription pattern
- Components subscribe via `useSyncExternalStore`
- Store changes trigger re-renders
- Stable references prevent unnecessary updates

**Context Updates**
- AuthContext updates trigger re-renders in consumers
- Sidebar updates user info
- Protected routes re-evaluate access

---

## 🚀 Development Workflow

### **Available Scripts**

```bash
npm run dev        # Start development server (port 8080)
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### **Development Server**
- **Port**: 8080
- **Host**: `::` (all interfaces)
- **Hot Module Replacement**: Enabled via Vite
- **Fast Refresh**: SWC compiler for instant updates

### **Build Output**
- **Directory**: `dist/`
- **Assets**: Bundled and optimized JS/CSS
- **HTML**: Processed with asset injection

---

## 🔒 Security Features (Simulated)

### **Encryption Simulation**
- Values displayed as masked (e.g., `***-**-4567`)
- "Reveal" temporarily shows actual value
- Access logging when revealed
- Visual blur effect for encrypted values

### **Access Control**
- Role-based route protection
- Menu item filtering by role
- Audit trail for sensitive operations

### **Form Validation**
- Client-side validation (Zod schemas)
- Password strength requirements
- Email format validation
- CAPTCHA verification

---

## 📝 Notes & Considerations

### **Current Limitations**
- No backend API (all data in-memory/localStorage)
- No real encryption (simulated)
- Session not persisted (clears on refresh)
- No file upload functionality (UI only)

### **Future Enhancements**
- Backend API integration
- Real encryption implementation
- Persistent sessions (JWT tokens)
- File upload with encryption
- Real-time notifications
- Advanced audit logging
- Export/import functionality

### **Architecture Decisions**
- **In-memory store**: Fast development, easy to replace with API
- **Context API**: Simple auth state management
- **Subscription pattern**: Reactive updates without Redux
- **shadcn/ui**: Accessible, customizable components
- **TypeScript**: Type safety throughout
- **Vite**: Fast development experience

---

## 🎯 Summary

**PiiVault Guard** is a well-structured, modern React application built with:
- **Modern stack**: React 18 + TypeScript + Vite
- **Component library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom design system
- **State management**: Context API + custom store pattern
- **Routing**: React Router with protected routes
- **Form handling**: React Hook Form + Zod validation

The application demonstrates:
- Clean architecture and separation of concerns
- Reusable component patterns
- Type-safe development
- Responsive design
- Role-based access control
- Security-focused UI/UX

The codebase is production-ready in structure but currently uses simulated backend functionality, making it easy to integrate with a real API backend when needed.
