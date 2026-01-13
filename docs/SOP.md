# TECHNICAL STANDARD OPERATING PROCEDURE (SOP)

## Full Stack Mobile Finance System (UIU Cash)

---

## DOCUMENT CONTROL

| **Field**            | **Details**                                 |
| -------------------- | ------------------------------------------- |
| **Project Name**     | Full Stack Mobile Finance System (UIU Cash) |
| **Team Number**      | 02                                          |
| **Document Version** | 1.0                                         |
| **Date**             | December 28, 2025                           |
| **Status**           | Active                                      |

### Team Members

1. **Tahsin Ahmed Tushar** (0112430028) - Project Lead
2. **Forhad Hassan** (011221063)
3. **Md. Saif Al Islam** (0112430004)

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Project Scope & Objectives](#2-project-scope--objectives)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Design & Architecture](#5-database-design--architecture)
6. [Security Framework](#6-security-framework)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Core Features & Functionalities](#8-core-features--functionalities)
9. [Financial Operations & Accounting](#9-financial-operations--accounting)
10. [API Design & Specifications](#10-api-design--specifications)
11. [Development Workflow](#11-development-workflow)
12. [Compliance & Regulatory Standards](#12-compliance--regulatory-standards)


15. [Risk Management](#15-risk-management)
16. [Project Timeline & Milestones](#16-project-timeline--milestones)
17. [References & Resources](#17-references--resources)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Overview

The Full Stack Mobile Finance System (UIU Cash) is a comprehensive digital financial services platform inspired by successful Mobile Financial Services (MFS) like bKash and Nagad. This system aims to provide a secure, scalable, and user-friendly solution for digital financial transactions in Bangladesh's growing fintech ecosystem.

### 1.2 Vision Statement

To create a robust, database-driven digital finance system that enables seamless financial transactions while maintaining the highest standards of security, compliance, and user experience.

### 1.3 Key Objectives

- Develop a multi-role financial platform supporting Personal, Agent, and Admin users
- Implement secure peer-to-peer (P2P) money transfer capabilities
- Enable cash-in and cash-out operations through agent networks
- Maintain real-time transaction ledgers with double-entry accounting
- Provide comprehensive admin controls for platform management
- Ensure ACID-compliant financial operations

### 1.4 Project Scope Boundaries

#### In Scope:

- User registration with email/phone verification
- Digital wallet management
- P2P transfers (Personal to Personal)
- Agent-based cash-out operations
- Mock debit card integration for adding money
- Settlement bank account simulation
- Transaction history and statement generation
- Admin dashboard and management panel
- Promotional offers and coupons system
- Government bill payment simulation
- Bank transfer simulation

#### Out of Scope:

- Real payment gateway integration (mock implementation only)
- Physical agent network establishment
- Real banking system integration
- Mobile app development (web-based only)
- International transfers
- Credit/loan facilities
- Investment products

---

## 2. PROJECT SCOPE & OBJECTIVES

### 2.1 Business Requirements

#### 2.1.1 Functional Requirements

**User Management:**

- FR-001: System shall support three distinct user roles (Personal, Agent, Admin)
- FR-002: System shall implement secure registration with email/phone verification
- FR-003: System shall maintain user profile with status tracking (Active, Suspended, Pending)
- FR-004: System shall support role-based access control (RBAC)

**Wallet & Balance Management:**

- FR-006: Each user shall have a digital wallet with real-time balance tracking
- FR-007: System shall prevent negative balance transactions
- FR-008: System shall display available balance and total balance separately
- FR-009: System shall maintain transaction history with pagination
- FR-010: System shall support multi-currency display (BDT primary)

**Transaction Processing:**

- FR-011: System shall process Send Money (P2P) transactions
- FR-012: System shall support Add Money via mock debit card
- FR-013: System shall enable Cash Out through verified agents
- FR-014: System shall calculate and apply transaction fees automatically
- FR-015: System shall generate unique transaction IDs (TRX ID)

**Agent Operations:**

- FR-021: Agents shall process cash-out requests
- FR-022: System shall calculate and credit agent commissions
- FR-023: Agents shall view earnings history and pending requests
- FR-024: System shall maintain agent float balance

**Admin Controls:**

- FR-021: Admin shall approve/reject agent registrations
- FR-022: Admin shall configure system parameters (fees, bonuses, limits)
- FR-028: Admin shall suspend/activate user accounts
- FR-029: Admin shall view all platform transactions
- FR-030: Admin shall generate platform-wide reports

#### 2.1.2 Non-Functional Requirements

**Security:**

- NFR-008: Passwords shall be hashed using bcrypt (cost factor 12)
- NFR-010: Session tokens shall expire after 30 minutes of inactivity
- NFR-011: System shall log all security-relevant events

**Reliability:**

- NFR-013: System uptime shall be 99.9%
- NFR-014: All financial transactions shall be ACID-compliant
- NFR-015: System shall implement automatic failover mechanisms
- NFR-017: Recovery Point Objective (RPO) shall be 1 hour
- NFR-018: Recovery Time Objective (RTO) shall be 4 hours

**Usability:**

- NFR-022: UI shall be responsive across devices (mobile, tablet, desktop)
- NFR-023: System shall support modern browsers (Chrome, Firefox, Safari, Edge)
- NFR-024: UI shall follow WCAG 2.1 Level AA accessibility standards
- NFR-025: System shall provide multi-language support (English, Bengali)

**Maintainability:**

- NFR-026: Code shall follow consistent style guidelines
- NFR-027: Code coverage shall be minimum 80%
- NFR-028: All APIs shall be documented with clear README files
- NFR-029: System shall implement comprehensive logging
- NFR-030: Codebase shall follow modular architecture

### 2.2 Success Criteria

| **Criteria**                   | **Target**     | **Measurement Method**           |
| ------------------------------ | -------------- | -------------------------------- |
| User Registration Success Rate | > 95%          | Registration completion tracking |
| User Satisfaction Score        | > 4.5/5        | User feedback surveys            |
| Security Incidents             | 0 critical     | Security audit logs              |

---

## 3. SYSTEM ARCHITECTURE

### 3.1 Architecture Overview

The UIU Cash platform follows a **three-tier architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Admin Panel │  │   Mobile Web │     │
│  │ (HTML/CSS/JS)│  │  (Next.js)   │  │  (Responsive)│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Node.js REST API Server                  │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │  Auth  │ │  User  │ │  Txn   │ │ Admin  │       │  │
│  │  │ Service│ │Service │ │Service │ │Service │       │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │    MySQL     │  │  File Storage│                        │
│  │  (Primary DB)│  │   (S3/Local) │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Architectural Patterns

#### 3.2.1 Layered Architecture

- **Presentation Layer**: User interfaces (web applications)
- **Business Logic Layer**: API services and business rules
- **Data Access Layer**: Database interactions via native MySQL queries
- **Integration Layer**: External service connectors

#### 3.2.2 Service-Oriented Design

The backend is organized into logical services:

1. **Authentication Service**: Handles user authentication, JWT generation, session management
2. **User Service**: Manages user profiles and role management
3. **Transaction Service**: Processes all financial transactions
4. **Wallet Service**: Manages wallet balances and operations
5. **Agent Service**: Handles agent operations and commissions
6. **Admin Service**: Administrative functions and configurations
7. **Notification Service**: Email/SMS notifications
8. **Reporting Service**: Generates reports and analytics

#### 3.2.3 Design Patterns

**Repository Pattern**: Abstracts data access logic

```typescript
interface IUserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
}
```

**Service Pattern**: Encapsulates business logic

```typescript
class TransactionService {
  async sendMoney(
    from: string,
    to: string,
    amount: number
  ): Promise<Transaction>;
  async cashOut(
    userId: string,
    agentId: string,
    amount: number
  ): Promise<Transaction>;
}
```

**Factory Pattern**: Creates transaction objects based on type

```typescript
class TransactionFactory {
  static createTransaction(type: TransactionType, data: any): Transaction;
}
```

**Middleware Pattern**: Request processing pipeline

```typescript
app.use(authenticate);
app.use(authorize);
app.use(validateRequest);
app.use(handleRequest);
```

### 3.3 Component Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                      │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                     API GATEWAY                             │
└────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│Auth Module   │   │ User Module  │   │ Txn Module   │
│• Login       │   │• Profile     │   │• Send Money  │
│• Register    │   │• Roles       │   │• Add Money   │
│• JWT Mgmt    │   │              │   │• Cash Out    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────┐
│                  DATABASE ACCESS LAYER                      │
│  • Native MySQL Queries  • Query Builder                   │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                       MySQL DATABASE                        │
└────────────────────────────────────────────────────────────┘
```

### 3.4 Data Flow Architecture

#### 3.4.1 Transaction Flow Example (Send Money)

```
User Request → API Gateway → Authentication Middleware
                                      │
                                      ▼
                          Authorization Middleware
                                      │
                                      ▼
                          Validation Middleware
                                      │
                                      ▼
                          Transaction Controller
                                      │
                                      ▼
                          Transaction Service
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            Check Balance     Validate Recipient   Calculate Fees
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ▼
                          BEGIN DATABASE TRANSACTION
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            Debit Sender      Credit Recipient    Create Ledger Entry
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ▼
                          COMMIT TRANSACTION
                                      │
                                      ▼
                          Send Notifications
                                      │
                                      ▼
                          Return Response
```

---

## 4. TECHNOLOGY STACK

### 4.1 Frontend Technologies

#### 4.1.1 Core Technologies

| **Technology** | **Version** | **Purpose**  | **Justification**                              |
| -------------- | ----------- | ------------ | ---------------------------------------------- |
| HTML5          | Latest      | Markup       | Standard web markup with semantic elements     |
| CSS3           | Latest      | Styling      | Modern styling with Flexbox, Grid, Animations  |
| JavaScript     | ES2022+     | Client Logic | Modern JS with async/await, modules            |
| TypeScript     | 5.x         | Type Safety  | Enhanced code quality and developer experience |

#### 4.1.2 Frontend Framework & Libraries

| **Technology**  | **Version** | **Purpose**                                  |
| --------------- | ----------- | -------------------------------------------- |
| Next.js         | 14.x        | Admin Panel Framework (SSR, SSG, API Routes) |
| React           | 18.x        | UI Component Library                         |
| Tailwind CSS    | 3.x         | Utility-first CSS Framework                  |
| Shadcn/UI       | Latest      | Pre-built Component Library                  |
| React Hook Form | 7.x         | Form Management                              |
| Zod             | 3.x         | Schema Validation (Frontend & Backend)       |
| Axios           | 1.x         | HTTP Client                                  |
| React Query     | 5.x         | Server State Management                      |
| Zustand         | 4.x         | Client State Management                      |
| Chart.js        | 4.x         | Data Visualization                           |
| Date-fns        | 3.x         | Date Manipulation                            |
| React-PDF       | Latest      | PDF Generation                               |

### 4.2 Backend Technologies

#### 4.2.1 Core Backend Stack

| **Technology** | **Version** | **Purpose**         |
| -------------- | ----------- | ------------------- |
| Node.js        | 20.x LTS    | Runtime Environment |
| Express.js     | 4.x         | Web Framework       |
| TypeScript     | 5.x         | Language            |

#### 4.2.2 Backend Libraries & Tools

| **Library**                   | **Purpose**                     |
| ----------------------------- | ------------------------------- |
| **Authentication & Security** |
| jsonwebtoken                  | JWT token generation/validation |
| bcrypt                        | Password hashing                |
| helmet                        | Security headers                |
| cors                          | CORS management                 |
| zod                           | Request validation & schemas    |
| **Database**                  |
| mysql2                        | MySQL driver                    |
| **Utilities**                 |
| dotenv                        | Environment variables           |
| winston                       | Logging                         |
| morgan                        | HTTP request logging            |
| nodemailer                    | Email notifications             |
| uuid                          | Unique ID generation            |
| dayjs                         | Date handling                   |
| **Process Management**        |
| PM2                           | Process manager                 |

### 4.3 Database Technologies

#### 4.3.1 Primary Database

| **Technology** | **Version** | **Purpose**                 |
| -------------- | ----------- | --------------------------- |
| MySQL          | 8.0.x       | Primary relational database |

**Justification for MySQL:**

- ACID compliance for financial transactions
- Strong data integrity and consistency
- High reliability
- Excellent for read-heavy operations
- Robust transaction management with InnoDB
- Wide community support and ecosystem
- Easy replication and scaling

#### 4.3.2 Database Tools

- **MySQL Workbench**: Database administration
- **DBeaver**: Database development
- **Liquibase/Flyway**: Database migrations (alternative to ORM migrations)

### 4.4 DevOps & Infrastructure

#### 4.4.1 Development Tools

| **Tool**   | **Purpose**                       |
| ---------- | --------------------------------- |
| Git        | Version control                   |
| GitHub     | Code repository and collaboration |
| VS Code    | Primary IDE                       |
| ESLint     | Code linting                      |
| Prettier   | Code formatting                   |
| Husky      | Git hooks                         |
| Commitlint | Commit message linting            |

### 4.5 Development Environment Setup

#### 4.5.1 Prerequisites

```bash
# Required installations
Node.js 20.x LTS
MySQL 8.0.x
Git 2.x
npm or pnpm or yarn
```

#### 4.5.2 Environment Structure

```
uiu-cash/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── middlewares/    # Express middlewares
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Helper functions
│   │   ├── validators/     # Input validators
│   │   └── types/          # TypeScript types
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # User-facing web app
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── utils/
│   │   └── types/
│   └── package.json
├── admin/                  # Next.js admin panel
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── schema.sql
├── docs/                   # Documentation
└── docker-compose.yml     # Docker setup
```

---

## 5. DATABASE DESIGN & ARCHITECTURE

### 5.1 Database Strategy

The UIU Cash platform implements a **double-entry bookkeeping system** to ensure financial accuracy and auditability. Every financial transaction creates corresponding debit and credit entries, maintaining a zero-sum balance across the system.

#### 5.1.1 Design Principles

- **ACID Compliance**: All transactions are Atomic, Consistent, Isolated, and Durable
- **Normalization**: Database follows 3NF to minimize redundancy
- **Referential Integrity**: Foreign keys enforce data consistency
- **Audit Trail**: All critical operations are logged
- **Timestamps**: All tables include created_at and updated_at fields

### 5.2 Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    users    │────────<│  wallets    │>────────│transactions │
└─────────────┘         └─────────────┘         └─────────────┘
      │                                                 │
      │                                                 │
      ▼                                                 ▼
┌─────────────┐                                 ┌─────────────┐
│  sessions   │                                 │   ledgers   │
└─────────────┘                                 └─────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   agents    │────────<│agent_cashout│>────────│  commissions│
└─────────────┘         └─────────────┘         └─────────────┘

┌─────────────┐         ┌─────────────┐
│   offers    │────────<│user_offers  │
└─────────────┘         └─────────────┘

┌─────────────┐         ┌─────────────┐
│system_config│         │bill_payments│
└─────────────┘         └─────────────┘
```

### 5.3 Database Schema

#### 5.3.1 users Table

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('PERSONAL', 'AGENT') NOT NULL,
    status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    nid_number VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### 5.3.2 admins Table

```sql
CREATE TABLE admins (
    id CHAR(8) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(8),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_status ON admins(status);
```

#### 5.3.3 wallets Table

```sql
CREATE TABLE wallets (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    available_balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (available_balance >= 0),
    pending_balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'BDT',
    daily_limit DECIMAL(15, 2) DEFAULT 50000.00,
    monthly_limit DECIMAL(15, 2) DEFAULT 200000.00,
    daily_spent DECIMAL(15, 2) DEFAULT 0.00,
    monthly_spent DECIMAL(15, 2) DEFAULT 0.00,
    last_transaction_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT check_balance CHECK (balance = available_balance + pending_balance)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_balance ON wallets(balance);
```

#### 5.3.4 transactions Table

```sql
CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    sender_id CHAR(36),
    receiver_id CHAR(36),
    sender_wallet_id CHAR(36),
    receiver_wallet_id CHAR(36),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(15, 2) DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(100),
    metadata JSON,
    user_agent TEXT,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    failed_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (sender_wallet_id) REFERENCES wallets(id),
    FOREIGN KEY (receiver_wallet_id) REFERENCES wallets(id),
    CONSTRAINT check_different_parties CHECK (sender_id != receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX idx_transactions_trx_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_sender ON transactions(sender_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(created_at DESC);
CREATE INDEX idx_transactions_metadata ON transactions USING GIN (metadata);
```

#### 5.3.5 ledgers Table (Double-Entry Bookkeeping)

```sql
CREATE TABLE ledgers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    transaction_id CHAR(36) NOT NULL,
    wallet_id CHAR(36) NOT NULL,
    entry_type ENUM('DEBIT', 'CREDIT') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ledgers_transaction ON ledgers(transaction_id);
CREATE INDEX idx_ledgers_wallet ON ledgers(wallet_id);
CREATE INDEX idx_ledgers_date ON ledgers(created_at);

-- Note: Double-entry bookkeeping validation should be handled at application level
-- Use MySQL stored procedures or application logic for complex validations
```

#### 5.3.6 agents Table

```sql
CREATE TABLE agents (
    id CHAR(8) PRIMARY KEY,
    user_id CHAR(8) UNIQUE NOT NULL,
    agent_code VARCHAR(20) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    total_cashouts INT DEFAULT 0,
    total_commission_earned DECIMAL(15, 2) DEFAULT 0.00,
    status ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED') DEFAULT 'PENDING',
    approved_by CHAR(8),
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_code ON agents(agent_code);
CREATE INDEX idx_agents_status ON agents(status);
```

#### 5.3.7 agent_cashouts Table

```sql
CREATE TABLE agent_cashouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    agent_id UUID NOT NULL REFERENCES agents(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) NOT NULL,
    commission DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_cashouts_agent ON agent_cashouts(agent_id);
CREATE INDEX idx_agent_cashouts_user ON agent_cashouts(user_id);
CREATE INDEX idx_agent_cashouts_status ON agent_cashouts(status);
```

#### 5.3.8 offers Table

```sql
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    offer_type VARCHAR(30) NOT NULL CHECK (offer_type IN (
        'CASHBACK',
        'DISCOUNT',
        'BONUS'
    )),
    transaction_type VARCHAR(30) CHECK (transaction_type IN (
        'SEND_MONEY',
        'ADD_MONEY',
        'CASH_OUT',
        'BILL_PAYMENT'
    )),
    discount_type VARCHAR(20) CHECK (discount_type IN ('PERCENTAGE', 'FIXED')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_amount DECIMAL(15, 2) DEFAULT 0,
    max_cashback DECIMAL(15, 2),
    usage_limit_per_user INTEGER DEFAULT 1,
    total_usage_limit INTEGER,
    current_usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_valid_dates CHECK (valid_until > valid_from)
);

CREATE INDEX idx_offers_code ON offers(code);
CREATE INDEX idx_offers_active ON offers(is_active);
CREATE INDEX idx_offers_validity ON offers(valid_from, valid_until);
```

#### 5.3.9 user_offers Table

```sql
CREATE TABLE user_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    offer_id UUID NOT NULL REFERENCES offers(id),
    transaction_id UUID REFERENCES transactions(id),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, offer_id)
);

CREATE INDEX idx_user_offers_user ON user_offers(user_id);
CREATE INDEX idx_user_offers_offer ON user_offers(offer_id);
```

#### 5.3.10 billers Table

```sql
CREATE TABLE billers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    biller_code VARCHAR(20) UNIQUE NOT NULL,
    biller_name VARCHAR(255) NOT NULL,
    bill_type ENUM('ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'MOBILE') NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    total_payments INT DEFAULT 0,
    status ENUM('ACTIVE', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by CHAR(36) NOT NULL,
    FOREIGN KEY (created_by) REFERENCES admins(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_billers_code ON billers(biller_code);
CREATE INDEX idx_billers_type ON billers(bill_type);
CREATE INDEX idx_billers_status ON billers(status);
```

#### 5.3.11 bill_payments Table

```sql
CREATE TABLE bill_payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    transaction_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    biller_id CHAR(36) NOT NULL,
    bill_type ENUM('ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'MOBILE') NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    bill_month VARCHAR(7),
    due_date DATE,
    late_fee DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('PENDING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (biller_id) REFERENCES billers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bill_payments_user ON bill_payments(user_id);
CREATE INDEX idx_bill_payments_biller ON bill_payments(biller_id);
CREATE INDEX idx_bill_payments_type ON bill_payments(bill_type);
CREATE INDEX idx_bill_payments_status ON bill_payments(status);
```

#### 5.3.12 bank_transfers Table

```sql
CREATE TABLE bank_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    routing_number VARCHAR(20),
    amount DECIMAL(15, 2) NOT NULL,
    transfer_type VARCHAR(20) CHECK (transfer_type IN ('INSTANT', 'STANDARD')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED'
    )),
    processing_fee DECIMAL(10, 2) DEFAULT 0.00,
    estimated_completion TIMESTAMP,
    completed_at TIMESTAMP,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_transfers_user ON bank_transfers(user_id);
CREATE INDEX idx_bank_transfers_status ON bank_transfers(status);
```

#### 5.3.12 system_config Table

```sql
CREATE TABLE system_config (
    id CHAR(8) PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_system_config_key (config_key)
);

-- Default configurations
INSERT INTO system_config (config_key, config_value, description) VALUES
('agent_commission_rate', '1.50', 'Global commission rate percentage for all agents (e.g., 1.50 for 1.5%)'),
('onboarding_bonus', '50.00', 'Bonus amount given to new users upon registration (in BDT)'),
('send_money_fee', '5.00', 'Flat fee for send money transactions (in BDT)'),
('cash_out_fee_percentage', '1.85', 'Percentage fee for cash out transactions (e.g., 1.85 for 1.85%)'),
('bank_transfer_fee_percentage', '1.50', 'Percentage fee for bank transfer transactions (e.g., 1.50 for 1.5%)'),
('bank_transfer_min_fee', '10.00', 'Minimum fee for bank transfer transactions (in BDT)'),
('max_transaction_limit', '25000.00', 'Maximum amount per single transaction (in BDT)'),
('personal_daily_limit', '50000.00', 'Daily transaction limit for personal users (in BDT)'),
('personal_monthly_limit', '200000.00', 'Monthly transaction limit for personal users (in BDT)'),
('agent_daily_limit', '100000.00', 'Daily transaction limit for agent users (in BDT)'),
('agent_monthly_limit', '500000.00', 'Monthly transaction limit for agent users (in BDT)'),
('min_wallet_balance', '0.00', 'Minimum wallet balance that must be maintained (in BDT)'),
('agent_min_float', '1000.00', 'Minimum float balance agents must maintain (in BDT)');
```

#### 5.3.13 audit_logs Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at DESC);
```

#### 5.3.15 sessions Table

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 5.4 Database Triggers & Functions

#### 5.4.1 Auto-Update Timestamp

```sql
-- MySQL automatically handles updated_at with ON UPDATE CURRENT_TIMESTAMP
-- This is defined in the table schema itself
-- No separate triggers needed for updated_at column

-- Example: Table already has this in CREATE TABLE statement
-- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

#### 5.4.2 Auto-Create Wallet on User Registration

```sql
-- MySQL Trigger for auto-creating wallet
DELIMITER $$

CREATE TRIGGER trigger_create_wallet
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.role IN ('PERSONAL', 'AGENT') THEN
        INSERT INTO wallets (id, user_id, balance, available_balance)
        VALUES (UUID(), NEW.id, 0.00, 0.00);
    END IF;
END$$

DELIMITER ;
```

#### 5.4.3 Prevent Negative Balance

```sql
-- MySQL Trigger for preventing negative balance
DELIMITER $$

CREATE TRIGGER check_wallet_balance
BEFORE UPDATE ON wallets
FOR EACH ROW
BEGIN
    IF NEW.balance < 0 OR NEW.available_balance < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient balance';
    END IF;
END$$

DELIMITER ;
```

### 5.5 Database Indexes Strategy

#### 5.5.1 Database Indexes



```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASE="uiu_cash_db"
USER="root"
PASSWORD="your_password"



# Upload to cloud storage (S3, Google Cloud Storage, etc.)
```

---

## 6. SECURITY FRAMEWORK

### 6.1 Security Architecture Overview

Security is the cornerstone of the UIU Cash platform. The system implements defense-in-depth strategy with multiple layers of security controls.

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Network Security (Firewall, DDoS Protection)      │
│  Layer 3: Authentication & Authorization (JWT, RBAC)        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Authentication & Authorization

#### 6.2.1 Authentication Strategy

**JWT Token Structure**

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: "PERSONAL" | "AGENT";
  sessionId: string;
  iat: number; // Issued at
  exp: number; // Expires at (3 hours)
}
```

**Token Management**

- **Token**: Single JWT token with 3 hours validity, contains user info
- **Token Revocation**: Logout invalidates all user sessions
- **Token Expiry**: Users must re-login after 3 hours

#### 6.2.2 Password Security

**Password Requirements**

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Cannot contain common patterns or user info

**Password Hashing**

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

**Password Reset Flow**

1. User requests password reset
2. System generates secure token (valid for 15 minutes)
3. Token sent to user's verified email/phone
4. User clicks link and enters new password
5. System validates token and updates password
6. All existing sessions invalidated

#### 6.2.3 Role-Based Access Control (RBAC)

**Permission Matrix**

| **Feature**           | **Personal** | **Agent** | **Admin** |
| --------------------- | ------------ | --------- | --------- |
| View Own Wallet       | ✅           | ✅        | ✅        |
| Send Money            | ✅           | ❌        | ❌        |
| Add Money             | ✅           | ✅        | ❌        |
| Cash Out              | ✅           | ✅        | ❌        |
| Receive Payments      | ✅           | ❌        | ❌        |
| Process Cash Out      | ❌           | ✅        | ❌        |
| View Commission       | ❌           | ✅        | ✅        |
| Approve Accounts      | ❌           | ❌        | ✅        |
| Manage Billers        | ❌           | ❌        | ✅        |
| Manage Offers         | ❌           | ❌        | ✅        |
| View All Transactions | ❌           | ❌        | ✅        |
| System Configuration  | ❌           | ❌        | ✅        |
| Suspend Users         | ❌           | ❌        | ✅        |

**RBAC Implementation**

```typescript
// Middleware for route protection
const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

// Usage
router.post(
  "/admin/approve-agent",
  authenticate,
  authorize("ADMIN"),
  approveAgentController
);
```




```sql

INSERT INTO users (nid_number)

FROM users;

```


- **HSTS**: HTTP Strict Transport Security enabled
- **Certificate Pinning**: For mobile apps

**Express.js Configuration**

```typescript
import helmet from "helmet";
import https from "https";
import fs from "fs";

const app = express();

// Security headers
app.use(
  helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// HTTPS server
const options = {
  key: fs.readFileSync("private-key.pem"),
  cert: fs.readFileSync("certificate.pem"),
};

https.createServer(options, app).listen(443);
```

### 6.4 API Security

#### 6.4.2 Input Validation & Sanitization

All API endpoints use **Zod** for request validation with strongly-typed schemas:

```typescript
import { z } from "zod";
import { validateRequest } from "../middleware/app/validateRequest";

// Define validation schema
const sendMoneySchema = z.object({
  body: z.object({
    recipientId: z.string().length(8, "Invalid recipient ID format"),
    amount: z
      .number()
      .min(1, "Amount must be at least 1")
      .max(25000, "Amount cannot exceed 25,000"),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
  }),
});

// Apply to route
router.post("/send", validateRequest(sendMoneySchema), sendMoneyController);
```

**Validation Middleware** (`src/middleware/app/validateRequest.ts`):

```typescript
import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          message: "Validation failed",
          errors,
        });
        return;
      }

      res.status(500).json({
        message: "Internal server error during validation",
      });
    }
  };
};
```

**Validation Files**:

- `src/validators/user.auth.validator.ts` - User authentication schemas
- `src/validators/admin.auth.validator.ts` - Admin authentication schemas
- `src/validators/user.management.validator.ts` - User management schemas
- `src/validators/system.config.validator.ts` - System configuration schemas
```

#### 6.4.3 CORS Configuration

```typescript
import cors from "cors";

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://uiu-cash.com", "https://admin.uiu-cash.com"]
      : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
```

#### 6.4.4 SQL Injection Prevention

- Use parameterized queries with ORM (Sequelize/TypeORM)
- Never concatenate user input into SQL queries
- Input validation and sanitization

```typescript
// GOOD: Parameterized query (Sequelize)
const user = await User.findOne({
  where: { email: req.body.email },
});

// BAD: String concatenation (NEVER DO THIS)
// const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
```

#### 6.4.5 XSS Prevention

- Sanitize all user inputs
- Set appropriate Content-Security-Policy headers
- Use templating engines that auto-escape
- Validate and sanitize rich text

```typescript
// Sanitize user input
import DOMPurify from "isomorphic-dompurify";

const sanitizedInput = DOMPurify.sanitize(userInput);
```

### 6.5 Transaction Security

#### 6.5.1 Transaction PIN

- Users set 6-digit PIN for transaction authorization
- PIN required for Send Money, Cash Out, Bill Payment
- PIN hashed using bcrypt
- 3 failed attempts = temporary lock (15 minutes)

```typescript
interface TransactionPIN {
  userId: string;
  pinHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
}

async function verifyTransactionPIN(
  userId: string,
  pin: string
): Promise<boolean> {
  const pinData = await getPINData(userId);

  if (pinData.lockedUntil && pinData.lockedUntil > new Date()) {
    throw new Error("PIN locked due to multiple failed attempts");
  }

  const isValid = await bcrypt.compare(pin, pinData.pinHash);

  if (!isValid) {
    await incrementFailedAttempts(userId);
    return false;
  }

  await resetFailedAttempts(userId);
  return true;
}
```

#### 6.5.2 Transaction Idempotency

- Prevent duplicate transactions
- Use idempotency keys for critical operations
- Transaction deduplication window: 24 hours

```typescript
async function processTransaction(req: Request): Promise<Transaction> {
  const idempotencyKey = req.headers["idempotency-key"] as string;

  // Check if transaction with this key already exists
  const existingTxn = await Transaction.findOne({
    where: { idempotencyKey },
  });

  if (existingTxn) {
    return existingTxn; // Return existing transaction
  }

  // Process new transaction
  return await createTransaction({
    ...req.body,
    idempotencyKey,
  });
}
```

#### 6.5.3 Transaction Limits & Fraud Detection

**Transaction Limits**

```typescript
const TRANSACTION_LIMITS = {
  PERSONAL: {
    MAX_PER_TRANSACTION: 25000,
    MAX_DAILY: 50000,
    MAX_MONTHLY: 200000,
  },
  AGENT: {
    MAX_PER_TRANSACTION: 25000,
    MAX_DAILY: 100000,
    MAX_MONTHLY: 500000,
  },
};
```

**Fraud Detection Rules**

- Multiple transactions in short time span
- Transaction patterns deviation
- Unusual transaction amounts
- Transactions from new/suspicious locations
- High-risk recipient patterns

```typescript
async function detectFraud(transaction: Transaction): Promise<FraudScore> {
  const riskScore = 0;

  // Check velocity (transactions in last hour)
  const recentTxns = await getRecentTransactions(transaction.senderId, 1);
  if (recentTxns.length > 5) riskScore += 30;

  // Check amount deviation
  const avgAmount = await getAverageTransactionAmount(transaction.senderId);
  if (transaction.amount > avgAmount * 3) riskScore += 25;

  // Check location
  const lastLocation = await getLastTransactionLocation(transaction.senderId);
    riskScore += 45;

  return {
    score: riskScore,
    level: riskScore < 30 ? "LOW" : riskScore < 60 ? "MEDIUM" : "HIGH",
    shouldBlock: riskScore >= 80,
  };
}
```

## 7. USER ROLES & PERMISSIONS

### 7.1 Role Definitions

#### 7.1.1 Personal User

**Description**: Individual users using the platform for personal financial transactions.

**Capabilities**:

- Register with email/phone
- View and manage wallet
- Send money to other personal users only
- Add money via mock debit card
- Cash out through agents
- Pay bills to registered billers
- View transaction history
- Download statements (PDF/CSV)
- Apply promotional offers
- Update profile information

**Restrictions**:

- Cannot receive money from multiple sources (only P2P)
- Cannot access admin features
- Cannot process cash-out for others
- Limited transaction amounts

#### 7.1.2 Agent

**Description**: Authorized individuals/shops that facilitate cash-out services.

**Capabilities**:

- Register as agent with business details
- Maintain float balance
- Cash in money to personal user accounts
- Transfer balance to bank accounts (keeping minimum float)
- View commission earnings
- View transaction history
- Manage agent profile
- View agent dashboard

**Restrictions**:

- Cannot send money to users
- Cannot use platform for personal transactions
- Requires admin approval
- Must maintain minimum float balance
- Commission-based earnings only

#### 7.1.3 Admin

**Description**: Platform administrators with full system control (separate from users).

**Capabilities**:

- **User Management**:
  - View all users
  - Approve/reject agent applications
  - Suspend/activate user accounts
  - Reset user passwords
  - View user details
- **Transaction Management**:
  - View all platform transactions
  - Search and filter transactions
  - Generate transaction reports
  - View real-time transactions
- **System Configuration**:
  - Set onboarding bonus amount
  - Configure transaction fees
  - Set cash-out commission rates
  - Define transaction limits
  - Manage system parameters
- **Offer Management**:
  - Create promotional offers
  - Set offer validity and conditions
  - Activate/deactivate offers
  - View offer usage statistics
- **Biller Management**:
  - Create/update/delete billers (utility companies)
  - View biller balances
  - View biller payment history
  - Manage biller status (active/suspended)
- **Analytics & Reporting**:
  - Platform-wide analytics
  - Revenue reports
  - User growth metrics
  - Transaction volume analysis
  - Agent reports
  - Biller payment statistics

**Restrictions**:

- Cannot perform user transactions on behalf of users
- All actions are audit logged
- Admins have separate authentication system

### 7.2 Account Lifecycle

#### 7.2.1 User Registration Flow

```
1. User submits registration form
   ↓
2. System validates input data
   ↓
3. System creates user account (status: PENDING)
   ↓
4. System sends verification email/SMS
   ↓
5. User verifies email/phone
   ↓
6. System creates wallet (for PERSONAL and AGENT)
   ↓
7. System credits onboarding bonus (PERSONAL only)
   ↓
8. User status updated to ACTIVE
   ↓
9. User can start transactions
```

#### 7.2.2 Agent Account Approval Flow

```
1. User registers as Personal or Agent
#### 7.2.2 Agent Account Approval Flow

```

1. User registers as Agent
   ↓
2. User submits:
   - Business details
   - Business address
   - NID number
     ↓
3. Admin verifies information
     ↓
4. Admin approves/rejects
     ↓
5. If approved:
   - Status → ACTIVE
   - Agent code generated
   - Float balance initialized
     ↓
7. Agent can start operations

````

---

## 8. CORE FEATURES & FUNCTIONALITIES

### 8.1 User Authentication

#### 8.1.1 Registration

**API Endpoint**: `POST /api/auth/register`

**Request Body**:

```json
{
  "email": "user@example.com",
  "phone": "+8801712345678",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1995-01-15",
  "role": "PERSONAL",
  "nidNumber": "1234567890",
  "agreeToTerms": true
}
````

**Response**:

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email/phone.",
  "data": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "verificationRequired": true
  }
}
```

**Business Logic**:

1. Validate all input fields
2. Check if email/phone already exists
3. Hash password with bcrypt
4. Create user record with status PENDING
5. Generate verification token
6. Send verification email/SMS
7. Return success response

#### 8.1.2 Login

**API Endpoint**: `POST /api/auth/login`

**Request Body**:

```json
{
  "identifier": "user@example.com", // email or phone
  "password": "SecurePass123!"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "PERSONAL",
      "walletBalance": 1500.0
    }
  }
}
```

**Business Logic**:

1. Find user by email or phone
2. Verify password
3. Check account status (must be ACTIVE)
4. Check if account is locked
5. Generate JWT token (3 hours validity)
6. Update last login timestamp
7. Return token and user data

#### 8.1.3 Logout

**API Endpoint**: `POST /api/auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response**:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Business Logic**:

1. Validate JWT token
2. Delete session from database
3. Add token to blacklist (until expiry)
4. Return success response

### 8.3 Wallet Management

#### 8.3.1 View Wallet Balance

**API Endpoint**: `GET /api/wallet/balance`

**Headers**: `Authorization: Bearer <token>`

**Response**:

```json
{
  "success": true,
  "data": {
    "balance": 5250.5,
    "availableBalance": 5250.5,
    "pendingBalance": 0.0,
    "currency": "BDT",
    "dailySpent": 1500.0,
    "dailyLimit": 50000.0,
    "monthlySpent": 15000.0,
    "monthlyLimit": 200000.0
  }
}
```

#### 8.3.2 Transaction History

**API Endpoint**: `GET /api/wallet/transactions`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Transaction type filter
- `status`: Transaction status filter
- `fromDate`: Start date
- `toDate`: End date

**Response**:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "transactionId": "TRX20251228001",
        "type": "SEND_MONEY",
        "amount": 500.0,
        "fee": 5.0,
        "totalAmount": 505.0,
        "status": "COMPLETED",
        "description": "Payment for services",
        "recipient": {
          "name": "Jane Smith",
          "phone": "+8801712345679"
        },
        "createdAt": "2025-12-28T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20
    }
  }
}
```

### 8.4 Send Money (P2P Transfer)

#### 8.4.1 Send Money Flow

```
User A wants to send ৳500 to User B

1. User A initiates send money request
   ↓
2. System validates:
   - Sufficient balance
   - Daily/monthly limits not exceeded
   - Recipient exists and is active
   ↓
3. System calculates fee (৳5)
   Total deduction: ৳505
   ↓
4. User A enters transaction PIN
   ↓
5. System verifies PIN
   ↓
6. System begins database transaction:
   a. Debit ৳505 from User A wallet
   b. Credit ৳500 to User B wallet
   c. Create transaction record
   d. Create ledger entries (double-entry)
   e. Update settlement account (+৳5 fee)
   ↓
7. System commits transaction
   ↓
8. System sends notifications to both users
   ↓
9. Transaction complete
```

**API Endpoint**: `POST /api/transactions/send-money`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:

```json
{
  "recipientId": "recipient-uuid",
  "amount": 500.0,
  "description": "Payment for services",
  "transactionPin": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Money sent successfully",
  "data": {
    "transactionId": "TRX20251228001",
    "amount": 500.0,
    "fee": 5.0,
    "totalAmount": 505.0,
    "recipient": {
      "name": "Jane Smith",
      "phone": "+8801712345679"
    },
    "newBalance": 4745.5,
    "timestamp": "2025-12-28T10:30:00Z"
  }
}
```

**Implementation**:

```typescript
async function sendMoney(
  senderId: string,
  recipientId: string,
  amount: number,
  pin: string
): Promise<Transaction> {
  // Start database transaction
  return await sequelize.transaction(async (t) => {
    // 1. Validate PIN
    await verifyTransactionPIN(senderId, pin);

    // 2. Get sender and recipient wallets
    const senderWallet = await Wallet.findOne({
      where: { userId: senderId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    const recipientWallet = await Wallet.findOne({
      where: { userId: recipientId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    // 3. Validate balances and limits
    const fee = await getTransactionFee("SEND_MONEY");
    const totalAmount = amount + fee;

    if (senderWallet.availableBalance < totalAmount) {
      throw new Error("Insufficient balance");
    }

    await checkTransactionLimits(senderId, amount);

    // 4. Create transaction record
    const transaction = await Transaction.create(
      {
        transactionId: generateTransactionId(),
        type: "SEND_MONEY",
        senderId,
        receiverId: recipientId,
        senderWalletId: senderWallet.id,
        receiverWalletId: recipientWallet.id,
        amount,
        fee,
        totalAmount,
        status: "PROCESSING",
      },
      { transaction: t }
    );

    // 5. Update wallet balances
    senderWallet.balance -= totalAmount;
    senderWallet.availableBalance -= totalAmount;
    await senderWallet.save({ transaction: t });

    recipientWallet.balance += amount;
    recipientWallet.availableBalance += amount;
    await recipientWallet.save({ transaction: t });

    // 6. Create ledger entries (double-entry)
    await Ledger.bulkCreate(
      [
        {
          transactionId: transaction.id,
          walletId: senderWallet.id,
          entryType: "DEBIT",
          amount: totalAmount,
          balanceBefore: senderWallet.balance + totalAmount,
          balanceAfter: senderWallet.balance,
          description: `Send money to ${recipientId}`,
        },
        {
          transactionId: transaction.id,
          walletId: recipientWallet.id,
          entryType: "CREDIT",
          amount: amount,
          balanceBefore: recipientWallet.balance - amount,
          balanceAfter: recipientWallet.balance,
          description: `Received money from ${senderId}`,
        },
      ],
      { transaction: t }
    );

    // 7. Update settlement account (collect fee)
    await updateSettlementAccount("FEE_COLLECTION", fee, "CREDIT", t);

    // 8. Update transaction status
    transaction.status = "COMPLETED";
    transaction.completedAt = new Date();
    await transaction.save({ transaction: t });

    // 9. Update daily/monthly spending
    await updateSpendingLimits(senderId, amount);

    return transaction;
  });
}
```

### 8.5 Add Money (Mock Debit Card)

#### 8.5.1 Add Money Flow

**API Endpoint**: `POST /api/transactions/add-money`

**Request Body**:

```json
{
  "amount": 1000.0,
  "cardNumber": "4111111111111111",
  "expiryMonth": "12",
  "expiryYear": "2026",
  "cvv": "123",
  "cardHolderName": "John Doe"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Money added successfully",
  "data": {
    "transactionId": "TRX20251228002",
    "amount": 1000.0,
    "fee": 0.0,
    "newBalance": 6250.5,
    "timestamp": "2025-12-28T11:00:00Z"
  }
}
```

**Mock Card Validation**:

```typescript
function validateMockCard(cardDetails: CardDetails): boolean {
    "340000000000009", // Amex
  ];

  // Basic validation
  if (!luhnCheck(cardDetails.cardNumber)) {
    return false;
  }

  // Check expiry
  const expiry = new Date(cardDetails.expiryYear, cardDetails.expiryMonth - 1);
  if (expiry < new Date()) {
    return false;
  }

  return true;
}
```

### 8.6 Cash Out via Agents

#### 8.6.1 Cash Out Flow

```
User wants to withdraw ৳2000 cash from Agent

1. User selects agent or enters agent code
   ↓
2. User enters amount (৳2000)
   ↓
3. System calculates:
   - Cash out fee: ৳37 (1.85%)
   - Agent commission: ৳15 (0.75%)
   - Total deduction from user: ৳2037
   ↓
4. System validates:
   - User has sufficient balance
   - Agent has sufficient float
   - Agent is active
   ↓
5. User enters transaction PIN
   ↓
   ↓
   ↓
   ↓
   ↓
    ↓
11. System processes transaction:
    - Debit ৳2037 from user wallet
    - Debit ৳2000 from agent float
    - Credit ৳15 commission to agent wallet
    - Update settlement account (-৳2000)
    ↓
12. Agent hands over ৳2000 cash to user
    ↓
13. Transaction complete
```

**API Endpoint (User)**: `POST /api/transactions/cash-out/initiate`

**Request Body**:

```json
{
  "agentId": "agent-uuid",
  "amount": 2000.0,
  "transactionPin": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "cashoutId": "uuid",
    "transactionId": "TRX20251228003",
    "amount": 2000.0,
    "fee": 37.0,
    "totalDeduction": 2037.0,
    "agent": {
      "name": "ABC Store",
      "phone": "+8801712345680"
    }
  }
}
```

**API Endpoint (Agent)**: `POST /api/agent/cash-out/complete`

**Request Body**:

```json
{
  "cashoutId": "uuid",
}
```

### 8.7 Bill Payments

#### 8.7.1 Bill Payment Flow

**API Endpoint**: `POST /api/bills/pay`

**Request Body**:

```json
{
  "billerId": "biller-uuid",
  "billType": "ELECTRICITY",
  "accountNumber": "1234567890",
  "amount": 850.0,
  "transactionPin": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Bill paid successfully",
  "data": {
    "transactionId": "TRX20251228004",
    "billerId": "biller-uuid",
    "billerName": "DESCO",
    "billType": "ELECTRICITY",
    "accountNumber": "1234567890",
    "amount": 850.0,
    "fee": 0.0,
    "newBalance": 4400.5,
    "billerBalanceUpdated": true,
    "timestamp": "2025-12-28T12:00:00Z"
  }
}
```

**Get Available Billers**

**API Endpoint**: `GET /api/bills/billers`

**Query Parameters**:

- `billType`: Filter by type (optional)

**Response**:

```json
{
  "success": true,
  "data": {
    "billers": [
      {
        "id": "biller-uuid-1",
        "billerCode": "DESCO",
        "billerName": "Dhaka Electric Supply Company",
        "billType": "ELECTRICITY",
        "logoUrl": "https://example.com/desco-logo.png"
      },
      {
        "id": "biller-uuid-2",
        "billerCode": "WASA",
        "billerName": "Dhaka Water Supply Authority",
        "billType": "WATER",
        "logoUrl": "https://example.com/wasa-logo.png"
      }
    ]
  }
}
```

### 8.8 Agent Dashboard

#### 8.8.1 Commission Earnings

**API Endpoint**: `GET /api/agent/earnings`

**Response**:

```json
{
  "success": true,
  "data": {
    "totalEarnings": 1500.0,
    "todayEarnings": 150.0,
    "monthlyEarnings": 1500.0,
    "totalCashouts": 100,
    "averageCommission": 15.0,
    "recentCashouts": [
      {
        "transactionId": "TRX20251228003",
        "user": "John Doe",
        "amount": 2000.0,
        "commission": 15.0,
        "timestamp": "2025-12-28T10:30:00Z"
      }
    ]
  }
}
```

### 8.9 Admin Features

#### 8.9.1 Biller Management

**Create Biller**

**API Endpoint**: `POST /api/admin/billers`

**Request Body**:

```json
{
  "billerCode": "DESCO",
  "billerName": "Dhaka Electric Supply Company",
  "billType": "ELECTRICITY",
  "contactEmail": "info@desco.gov.bd",
  "contactPhone": "+8801234567890",
  "description": "Electricity provider for Dhaka city",
  "logoUrl": "https://example.com/desco-logo.png"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Biller created successfully",
  "data": {
    "id": "biller-uuid",
    "billerCode": "DESCO",
    "billerName": "Dhaka Electric Supply Company",
    "billType": "ELECTRICITY",
    "balance": 0.0,
    "totalPayments": 0,
    "status": "ACTIVE",
    "createdAt": "2026-01-06T10:00:00Z"
  }
}
```

**List All Billers**

**API Endpoint**: `GET /api/admin/billers`

**Query Parameters**:

- `billType`: Filter by bill type (optional)
- `status`: Filter by status (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:

```json
{
  "success": true,
  "data": {
    "billers": [
      {
        "id": "biller-uuid",
        "billerCode": "DESCO",
        "billerName": "Dhaka Electric Supply Company",
        "billType": "ELECTRICITY",
        "balance": 125000.5,
        "totalPayments": 1250,
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100
    }
  }
}
```

**Get Biller Details**

**API Endpoint**: `GET /api/admin/billers/:id`

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "biller-uuid",
    "billerCode": "DESCO",
    "billerName": "Dhaka Electric Supply Company",
    "billType": "ELECTRICITY",
    "balance": 125000.5,
    "totalPayments": 1250,
    "status": "ACTIVE",
    "contactEmail": "info@desco.gov.bd",
    "contactPhone": "+8801234567890",
    "description": "Electricity provider for Dhaka city",
    "logoUrl": "https://example.com/desco-logo.png",
    "recentPayments": [
      {
        "transactionId": "TRX20260106001",
        "userName": "John Doe",
        "amount": 850.0,
        "accountNumber": "1234567890",
        "paidAt": "2026-01-06T09:30:00Z"
      }
    ],
    "createdAt": "2026-01-01T00:00:00Z",
    "createdBy": "admin-uuid"
  }
}
```

**Update Biller**

**API Endpoint**: `PUT /api/admin/billers/:id`

**Request Body**:

```json
{
  "billerName": "DESCO - Updated",
  "status": "ACTIVE",
  "contactEmail": "support@desco.gov.bd",
  "description": "Updated description"
}
```

**Delete Biller**

**API Endpoint**: `DELETE /api/admin/billers/:id`

**Response**:

```json
{
  "success": true,
  "message": "Biller deleted successfully"
}
```

#### 8.9.2 Configure System Settings

**API Endpoint**: `PUT /api/admin/config`

**Request Body**:

```json
{
  "ONBOARDING_BONUS": "50.00",
  "SEND_MONEY_FEE": "5.00",
  "CASH_OUT_FEE_PERCENTAGE": "1.85",
  "AGENT_COMMISSION_PERCENTAGE": "0.75"
}
```

#### 8.9.3 Create Promotional Offer

**API Endpoint**: `POST /api/admin/offers`

**Request Body**:

```json
{
  "code": "NEWYEAR2026",
  "title": "New Year Cashback",
  "description": "Get 5% cashback on all send money transactions",
  "offerType": "CASHBACK",
  "transactionType": "SEND_MONEY",
  "discountType": "PERCENTAGE",
  "discountValue": 5.0,
  "minAmount": 100.0,
  "maxCashback": 50.0,
  "usageLimitPerUser": 5,
  "totalUsageLimit": 1000,
  "validFrom": "2026-01-01T00:00:00Z",
  "validUntil": "2026-01-31T23:59:59Z"
}
```

#### 8.9.4 Platform Analytics

**API Endpoint**: `GET /api/admin/analytics/platform`

**Response**:

```json
{
  "success": true,
  "data": {
    "totalUsers": 10000,
    "activeUsers": 7500,
    "totalTransactions": 50000,
    "totalVolume": 25000000.0,
    "revenue": 250000.0,
    "userGrowth": {
      "daily": 50,
      "weekly": 350,
      "monthly": 1500
    },
    "transactionBreakdown": {
      "SEND_MONEY": 30000,
      "ADD_MONEY": 12000,
      "CASH_OUT": 6000,
      "BILL_PAYMENT": 2000
    }
  }
}
```

---

## 9. FINANCIAL OPERATIONS & ACCOUNTING

### 9.1 Double-Entry Bookkeeping System

The UIU Cash platform implements a strict double-entry bookkeeping system where every financial transaction creates two equal and opposite entries.

#### 9.1.1 Accounting Equation

```
Assets = Liabilities + Equity

Where:
Assets = User Wallets + Settlement Bank Account
Liabilities = User Digital Balances
Equity = Capital + Revenue (Fees & Commissions)
```

#### 9.1.2 Chart of Accounts

```
ASSETS
├── Settlement Bank Account
│   ├── Main Settlement (1000)
│   └── Reserve Fund (1001)
└── Agent Float (1100)

LIABILITIES
├── User Wallets Payable (2000)
│   ├── Personal User Wallets (2001)
│   ├── Agent User Wallets (2002)
│   └── Agent Wallets (2003)
└── Commission Payable (2100)

EQUITY
├── Share Capital (3000)
└── Retained Earnings (3100)

REVENUE
├── Transaction Fees (4000)
├── Cash-out Fees (4001)
└── Other Income (4002)

EXPENSES
├── Agent Commissions (5000)
├── Promotional Expenses (5001)
└── Operating Expenses (5002)
```

### 9.2 Transaction Accounting Examples

#### 9.2.1 Send Money Transaction

**Scenario**: User A sends ৳500 to User B (৳5 fee)

**Journal Entries**:

```
Debit:  User B Wallet (Asset)         ৳500
Debit:  Transaction Fee Revenue        ৳5
Credit: User A Wallet (Asset)                 ৳505

Ledger View:
┌──────────────────────────┬────────┬────────┐
│ Account                  │ Debit  │ Credit │
├──────────────────────────┼────────┼────────┤
│ User A Wallet            │        │ 505.00 │
│ User B Wallet            │ 500.00 │        │
│ Fee Revenue              │   5.00 │        │
└──────────────────────────┴────────┴────────┘
Total:                       505.00   505.00 ✓
```

#### 9.2.2 Add Money Transaction

**Scenario**: User A adds ৳1000 via debit card

**Journal Entries**:

```
Debit:  User A Wallet (Asset)         ৳1000
Credit: Settlement Bank Account               ৳1000

┌──────────────────────────┬────────┬────────┐
│ Account                  │ Debit  │ Credit │
├──────────────────────────┼────────┼────────┤
│ User A Wallet            │1000.00 │        │
│ Settlement Bank Account  │        │1000.00 │
└──────────────────────────┴────────┴────────┘
Total:                      1000.00  1000.00 ✓
```

#### 9.2.3 Cash Out Transaction

**Scenario**: User A cashes out ৳2000 via Agent X (Fee: ৳37, Commission: ৳15)

**Journal Entries**:

```
Debit:  Cash-out Fee Revenue          ৳37
Debit:  Settlement Bank Account       ৳2000
Debit:  Agent Commission Expense      ৳15
Credit: User A Wallet                        ৳2037
Credit: Agent X Wallet                       ৳15

┌──────────────────────────┬────────┬────────┐
│ Account                  │ Debit  │ Credit │
├──────────────────────────┼────────┼────────┤
│ User A Wallet            │        │2037.00 │
│ Settlement Bank Account  │2000.00 │        │
│ Cash-out Fee Revenue     │  37.00 │        │
│ Agent Commission Expense │  15.00 │        │
│ Agent X Wallet           │        │  15.00 │
└──────────────────────────┴────────┴────────┘
Total:                      2052.00  2052.00 ✓
```

#### 9.2.4 Onboarding Bonus

**Scenario**: New user receives ৳50 bonus

**Journal Entries**:

```
Debit:  Promotional Expense           ৳50
Credit: User Wallet                          ৳50

┌──────────────────────────┬────────┬────────┐
│ Account                  │ Debit  │ Credit │
├──────────────────────────┼────────┼────────┤
│ Promotional Expense      │  50.00 │        │
│ User Wallet              │        │  50.00 │
└──────────────────────────┴────────┴────────┘
Total:                        50.00    50.00 ✓
```

### 9.3 Settlement Account Management

#### 9.3.1 Settlement Account Types

**Main Settlement Account**:

- Holds actual funds backing user digital balances
- Increases: Add Money, Cash-in
- Decreases: Cash Out, Bank Transfers

**Fee Collection Account**:

- Accumulates all transaction fees
- Platform revenue account

**Commission Payable Account**:

- Tracks agent commissions owed
- Cleared when agents withdraw earnings

**Promotional Account**:

- Tracks promotional expenses
- Includes onboarding bonuses, cashbacks

#### 9.3.2 Reconciliation Process

**Daily Reconciliation**:

```typescript
async function performDailyReconciliation() {
  // 1. Calculate total user balances
  const totalUserBalances = await Wallet.sum("balance");

  // 2. Calculate settlement account balance
  const settlementBalance = await getSettlementBalance("MAIN_SETTLEMENT");

  // 3. Calculate total fees collected
  const totalFees = await Transaction.sum("fee", {
    where: {
      status: "COMPLETED",
      createdAt: {
        [Op.gte]: startOfDay(new Date()),
        [Op.lte]: endOfDay(new Date()),
      },
    },
  });

  // 4. Verify equation
  const expectedSettlement = totalUserBalances + totalFees;

  if (Math.abs(settlementBalance - expectedSettlement) > 0.01) {
    // Alert: Reconciliation mismatch!
    await sendAlertToAdmin({
      type: "RECONCILIATION_MISMATCH",
      expected: expectedSettlement,
      actual: settlementBalance,
      difference: settlementBalance - expectedSettlement,
    });
  }

  // 5. Generate reconciliation report
  return {
    date: new Date(),
    totalUserBalances,
    settlementBalance,
    totalFees,
    status: "BALANCED",
  };
}
```

### 9.4 Fee Structure

#### 9.4.1 Transaction Fees

| **Transaction Type** | **Fee Structure** | **Example**              |
| -------------------- | ----------------- | ------------------------ |
| Send Money (P2P)     | Flat ৳5           | ৳500 send = ৳5 fee       |
| Add Money            | Free              | ৳1000 add = ৳0 fee       |
| Cash Out             | 1.85% of amount   | ৳2000 cash out = ৳37 fee |
| Bill Payment         | Free              | ৳850 bill = ৳0 fee       |
| Bank Transfer        | 1.5% (min ৳10)    | ৳5000 transfer = ৳75 fee |

#### 9.4.2 Agent Commission

| **Transaction** | **Commission**  | **Calculation**     |
| --------------- | --------------- | ------------------- |
| Cash Out        | 0.75% of amount | ৳2000 × 0.75% = ৳15 |

#### 9.4.3 Dynamic Fee Calculation

```typescript
async function calculateTransactionFee(
  type: TransactionType,
  amount: number
): Promise<number> {
  const config = await SystemConfig.findAll();
  const configMap = new Map(config.map((c) => [c.configKey, c.configValue]));

  switch (type) {
    case "SEND_MONEY":
      return parseFloat(configMap.get("SEND_MONEY_FEE") || "5.00");

    case "CASH_OUT":
      const percentage = parseFloat(
        configMap.get("CASH_OUT_FEE_PERCENTAGE") || "1.85"
      );
      return (amount * percentage) / 100;

    case "BANK_TRANSFER":
      const transferFee = (amount * 1.5) / 100;
      return Math.max(transferFee, 10); // Minimum ৳10

    case "ADD_MONEY":
    case "BILL_PAYMENT":
      return 0;

    default:
      return 0;
  }
}
```

### 9.5 Transaction Limits

#### 9.5.1 Personal User Limits

| **Limit Type**  | **Amount** |
| --------------- | ---------- |
| Per Transaction | ৳25,000    |
| Daily Limit     | ৳50,000    |
| Monthly Limit   | ৳200,000   |

#### 9.5.2 Agent User Limits

| **Limit Type**  | **Amount** |
| --------------- | ---------- |
| Per Transaction | ৳25,000    |
| Daily Limit     | ৳100,000   |
| Monthly Limit   | ৳500,000   |

#### 9.5.3 Limit Validation

```typescript
async function checkTransactionLimits(
  userId: string,
  amount: number
): Promise<void> {
  const user = await User.findByPk(userId);
  const wallet = await Wallet.findOne({ where: { userId } });

  // Get limits based on user role
  const limits = TRANSACTION_LIMITS[user.role];

  // Check per-transaction limit
  if (amount > limits.MAX_PER_TRANSACTION) {
    throw new Error(
      `Transaction exceeds maximum limit of ৳${limits.MAX_PER_TRANSACTION}`
    );
  }

  // Check daily limit
  if (wallet.dailySpent + amount > limits.MAX_DAILY) {
    throw new Error(`Daily limit of ৳${limits.MAX_DAILY} exceeded`);
  }

  // Check monthly limit
  if (wallet.monthlySpent + amount > limits.MAX_MONTHLY) {
    throw new Error(`Monthly limit of ৳${limits.MAX_MONTHLY} exceeded`);
  }
}
```

---

## 10. API DESIGN & SPECIFICATIONS

### 10.1 API Architecture

#### 10.1.1 RESTful API Principles

- Resource-based URLs
- HTTP methods for CRUD operations
- Stateless communication
- JSON request/response format
- Consistent error handling
- API versioning

#### 10.1.2 API Base URL Structure

```
Development:  http://localhost:5000/api/v1
Staging:      https://api-staging.uiu-cash.com/api/v1
Production:   https://api.uiu-cash.com/api/v1
```

### 10.2 API Standards

#### 10.2.1 Request Headers

```
Content-Type: application/json
Authorization: Bearer <jwt-token>
X-Request-ID: <uuid>           // Request tracking
X-Client-Version: 1.0.0        // Client app version
Accept-Language: en            // Localization
```

#### 10.2.2 Response Format

**Success Response**:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-12-28T10:30:00Z"
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance to complete transaction",
    "details": {
      "required": 505.0,
      "available": 450.0
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-12-28T10:30:00Z"
  }
}
```

### 10.3 HTTP Status Codes

| **Code** | **Meaning**           | **Usage**                          |
| -------- | --------------------- | ---------------------------------- |
| 200      | OK                    | Successful GET, PUT, PATCH         |
| 201      | Created               | Successful POST (resource created) |
| 204      | No Content            | Successful DELETE                  |
| 400      | Bad Request           | Invalid request data               |
| 401      | Unauthorized          | Missing or invalid authentication  |
| 403      | Forbidden             | Insufficient permissions           |
| 404      | Not Found             | Resource not found                 |
| 409      | Conflict              | Resource conflict (duplicate)      |
| 422      | Unprocessable Entity  | Validation errors                  |
| 500      | Internal Server Error | Server error                       |

### 10.4 Error Codes

| **Error Code**          | **HTTP Status** | **Description**               |
| ----------------------- | --------------- | ----------------------------- |
| `INVALID_CREDENTIALS`   | 401             | Invalid email/password        |
| `TOKEN_EXPIRED`         | 401             | JWT token expired             |
| `INSUFFICIENT_BALANCE`  | 400             | Wallet balance too low        |
| `LIMIT_EXCEEDED`        | 400             | Transaction limit exceeded    |
| `USER_NOT_FOUND`        | 404             | User does not exist           |
| `TRANSACTION_FAILED`    | 500             | Transaction processing failed |
| `DUPLICATE_TRANSACTION` | 409             | Duplicate idempotency key     |
| `INVALID_PIN`           | 400             | Invalid transaction PIN       |
| `ACCOUNT_SUSPENDED`     | 403             | User account suspended        |

### 10.5 API Documentation

**Documentation Strategy**:

For this project, API documentation will be maintained using:

- **Postman Collections**: Shareable API collections with example requests/responses
- **README.md files**: Detailed endpoint documentation in markdown format
- **Code Comments**: Inline documentation for API routes

**API Documentation Structure**:

````markdown
# API Endpoint: Send Money

## POST /api/v1/transactions/send-money

**Description**: Transfer money from one user to another

**Authentication**: Required (JWT Bearer Token)

**Request Body**:

```json
{
  "recipientId": "uuid-string",
  "amount": 500.0,
  "description": "Payment for services",
  "transactionPin": "123456"
}
```
````

**Success Response (200)**:

```json
{
  "success": true,
  "message": "Money sent successfully",
  "data": {
    "transactionId": "TRX20260106001",
    "amount": 500.0,
    "fee": 5.0,
    "totalAmount": 505.0
  }
}
```

**Error Responses**:

- 400: Invalid request or insufficient balance
- 401: Unauthorized
- 403: Transaction blocked

```

---

## 11. DEVELOPMENT WORKFLOW

### 11.1 Git Workflow

#### 11.1.1 Branch Strategy (Git Flow)

```

main (production-ready code)
└── develop (integration branch)
├── feature/user-authentication
├── feature/send-money
├── feature/admin-dashboard
├── bugfix/transaction-fee-calculation
└── hotfix/security-patch

```

**Branch Naming Convention**:

- `feature/<feature-name>`: New features
- `bugfix/<bug-description>`: Bug fixes
- `hotfix/<critical-fix>`: Production hotfixes
- `release/<version>`: Release preparation

#### 11.1.2 Commit Message Convention

Follow Conventional Commits specification:

```

<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring

**Examples**:

```
feat(auth): simplify authentication with single token

- Implement single token with 3 hours validity
- Update authentication middleware

Closes #45
```

```
fix(transaction): correct fee calculation for cash-out

Fee was being calculated incorrectly for amounts over 10000.
Updated formula to use proper percentage calculation.

Fixes #123
```

### 11.2 Code Quality Standards

#### 11.2.1 ESLint Configuration

```javascript
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:security/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "security"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "security/detect-object-injection": "warn",
    "complexity": ["error", 10],
    "max-lines-per-function": ["warn", 50]
  }
}
```

#### 11.2.2 Prettier Configuration

```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

#### 11.2.3 Pre-commit Hooks (Husky)

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
    ]
  }
}
```

### 11.3 Development Environment

#### 11.3.1 Environment Variables

```bash
# .env.development
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL=mysql://root:password@localhost:3306/uiu_cash_dev
DB_LOGGING=true

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_ADMIN_SECRET=dev-admin-secret-change-in-production
JWT_EXPIRES_IN=3h


# Email (Development - use Mailtrap or similar)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass

# SMS (Mock in development)
SMS_PROVIDER=mock
SMS_API_KEY=mock-key

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB

# Frontend URL
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

```

### 11.4 Local Development Setup

#### 11.4.1 Initial Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/your-org/uiu-cash.git
cd uiu-cash

# 2. Install backend dependencies
cd backend
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your local configuration

# 4. Start MySQL
# Using Docker
docker-compose up -d mysql

# 5. Run database migrations
npm run migrate

npm run seed

# 7. Start development server
npm run dev

# 8. In a new terminal, setup frontend
cd ../frontend
npm install
npm run dev

# 9. In another terminal, setup admin panel
cd ../admin
npm install
npm run dev
```

#### 11.4.2 Docker Compose Setup

```yaml
# docker-compose.yml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: uiu_cash_dev
      MYSQL_ROOT_PASSWORD: password
      MYSQL_USER: uiu_user
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
    depends_on:
      - mysql
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  mysql_data:
```

---

### 12.1 Data Protection & Privacy

#### 12.1.1 GDPR Compliance (If Applicable)

**Data Subject Rights**:

- Right to access personal data
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to data portability
- Right to object to processing

**Implementation**:

```typescript
// Data export functionality
async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await User.findByPk(userId);
  const transactions = await Transaction.findAll({ where: { userId } });

  return {
    personalInfo: {
      email: user.email,
      phone: user.phone,
      name: `${user.firstName} ${user.lastName}`,
      dateOfBirth: user.dateOfBirth,
    },
    transactions: transactions.map((t) => ({
      id: t.transactionId,
      type: t.type,
      amount: t.amount,
      date: t.createdAt,
    })),
    exportedAt: new Date(),
  };
}

// Data deletion (right to be forgotten)
async function deleteUserData(userId: string): Promise<void> {
  await sequelize.transaction(async (t) => {
    await User.update(
      {
        email: `deleted_${userId}@anonymous.local`,
        phone: null,
        firstName: "Deleted",
        lastName: "User",
        dateOfBirth: null,
        nidNumber: null,
        deletedAt: new Date(),
      },
      { where: { id: userId }, transaction: t }
    );

    // Keep transaction records for legal/audit purposes
    // but anonymize personal identifiers
  });
}
```

#### 14.1.2 Data Retention Policy

| **Data Type**       | **Retention Period**          | **Rationale**             |
| ------------------- | ----------------------------- | ------------------------- |
| Transaction Records | 7 years                       | Legal/tax requirements    |
| Audit Logs          | 3 years                       | Security and compliance   |
| User Personal Data  | Duration of account + 1 year  | Service delivery          |
| Error Logs          | 1 year                        | Debugging and improvement |

### 14.2 Financial Regulations

#### 14.2.1 Anti-Money Laundering (AML)


```typescript
interface AMLRule {
  name: string;
  condition: (transaction: Transaction) => boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  action: "FLAG" | "REVIEW" | "BLOCK";
}

const AML_RULES: AMLRule[] = [
  {
    name: "Large Transaction",
    condition: (txn) => txn.amount > 100000,
    riskLevel: "MEDIUM",
    action: "REVIEW",
  },
  {
    name: "Multiple Transactions Same Day",
    condition: (txn) => getDailyTransactionCount(txn.senderId) > 10,
    riskLevel: "MEDIUM",
    action: "FLAG",
  },
  {
    name: "Rapid Succession Transactions",
    condition: (txn) => getTransactionsInLastHour(txn.senderId) > 5,
    riskLevel: "HIGH",
    action: "REVIEW",
  },
  {
    name: "Round Amount Structuring",
    condition: (txn) => txn.amount % 1000 === 0 && txn.amount > 50000,
    riskLevel: "MEDIUM",
    action: "FLAG",
  },
];

async function checkAMLCompliance(
  transaction: Transaction
): Promise<AMLCheckResult> {
  const triggeredRules: AMLRule[] = [];

  for (const rule of AML_RULES) {
    if (rule.condition(transaction)) {
      triggeredRules.push(rule);
    }
  }

  if (triggeredRules.length === 0) {
    return { compliant: true, riskLevel: "LOW" };
  }

  const highestRisk = triggeredRules.reduce(
    (max, rule) => (rule.riskLevel > max ? rule.riskLevel : max),
    "LOW"
  );

  const shouldBlock = triggeredRules.some((rule) => rule.action === "BLOCK");

  if (shouldBlock) {
    await blockTransaction(transaction.id, triggeredRules);
    await notifyComplianceTeam(transaction, triggeredRules);
  }

  return {
    compliant: !shouldBlock,
    riskLevel: highestRisk,
    triggeredRules: triggeredRules.map((r) => r.name),
  };
}
```

### 14.3 Security Standards

#### 14.3.1 PCI DSS Compliance Checklist

- [ ] Build and maintain a secure network
  - [x] Install and maintain firewall configuration
  - [x] Do not use vendor-supplied defaults for passwords
- [ ] Protect cardholder data
  - [x] Use tokenization (never store full card numbers)
- [ ] Maintain vulnerability management program
  - [x] Use and regularly update anti-virus software
  - [x] Develop and maintain secure systems
- [ ] Implement strong access control measures
  - [x] Restrict access to cardholder data by business need-to-know
  - [x] Assign unique ID to each person with computer access
  - [x] Restrict physical access to cardholder data
  - [x] Track and monitor all access to network resources
- [ ] Maintain an information security policy
  - [x] Maintain policy that addresses information security

#### 14.3.2 ISO 27001 Alignment

**Information Security Controls**:

- Access control policy
- Cryptography policy
- Physical and environmental security
- Operations security
- Communications security
- Supplier relationships
- Information security incident management
- Business continuity management

### 14.4 Audit & Compliance Reporting

#### 14.4.1 Automated Compliance Reports

```typescript
async function generateComplianceReport(
  startDate: Date,
  endDate: Date
): Promise<ComplianceReport> {
  return {
    period: { startDate, endDate },
    transactionMetrics: {
      total: await Transaction.count({
        where: { createdAt: { [Op.between]: [startDate, endDate] } },
      }),
      flagged: await Transaction.count({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          metadata: { amlFlagged: true },
        },
      }),
      blocked: await Transaction.count({
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          status: "FAILED",
          failedReason: { [Op.like]: "%AML%" },
        },
      }),
    },
        where: {
          createdAt: { [Op.between]: [startDate, endDate] },
          verificationStatus: "REJECTED",
        },
      }),
    },
    securityIncidents: await AuditLog.count({
      where: {
        createdAt: { [Op.between]: [startDate, endDate] },
        action: { [Op.like]: "%SECURITY%" },
      },
    }),
    generatedAt: new Date(),
  };
}
```

---

## 13. RISK MANAGEMENT

### 15.1 Risk Assessment Matrix

| **Risk ID** | **Risk Description**                   | **Category**   | **Probability** | **Impact** | **Risk Level** | **Mitigation Strategy**                           |
| ----------- | -------------------------------------- | -------------- | --------------- | ---------- | -------------- | ------------------------------------------------- |
| R-004       | Third-party service failure            | Operational    | Medium          | Medium     | Medium         | Fallback mechanisms, SLA agreements   |
| R-005       | Regulatory non-compliance              | Compliance     | Low             | Critical   | High           | Regular compliance audits, legal consultation     |
| R-006       | Fraud/money laundering                 | Financial      | Medium          | High       | High           | Fraud detection rules      |
| R-007       | Server hardware failure                | Technical      | Low             | High       | Medium         | Redundancy, auto-failover, cloud infrastructure   |
| R-009       | Budget overrun                         | Financial      | Medium          | Medium     | Medium         | Regular budget reviews, scope management          |

**Risk Level Calculation**:

- **Critical**: Immediate action required
- **High**: Address within 1 week
- **Medium**: Address within 1 month
- **Low**: Monitor and address as needed

### 15.2 Security Risks

#### 15.2.1 Authentication & Authorization Risks

**Risk**: Unauthorized access to user accounts

**Mitigation**:

- Use strong password policies
- Session timeout after inactivity
- Monitor for unusual login patterns

**Implementation**:

```typescript
// Detect unusual login patterns
async function detectUnusualLogin(userId: string, ipAddress: string) {
  const lastLogin = await getLastLogin(userId);

  // Check for location change

  const distance = calculateDistance(currentLocation, lastLocation);

  if (distance > 1000) {
    // User logged in from a location > 1000km away
    await sendVerificationEmail(userId);
    return { suspicious: true, reason: "unusual_location" };
  }

  return { suspicious: false };
}
```

#### 15.2.2 Transaction Fraud Risks

**Risk**: Fraudulent transactions, account takeover

**Mitigation**:

- Transaction PIN required
- Velocity checks (multiple transactions in short time)
- Machine learning-based fraud detection
- Transaction amount limits

**Implementation**:

```typescript
// Fraud detection scoring
async function calculateFraudScore(transaction: Transaction): Promise<number> {
  let score = 0;

  // Check 1: Velocity (number of transactions in last hour)
  const recentTxns = await getTransactionsInLastHour(transaction.senderId);
  if (recentTxns.length > 5) score += 30;

  // Check 2: Unusual amount
  const avgAmount = await getAverageTransactionAmount(transaction.senderId);
  if (transaction.amount > avgAmount * 5) score += 25;

  // Check 3: New recipient
  const isNewRecipient = await isFirstTimeRecipient(
    transaction.senderId,
    transaction.receiverId
  );
  if (isNewRecipient && transaction.amount > 10000) score += 20;

  // Check 4: Unusual time (late night transactions)
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) score += 15;

  // Check 5: Round amounts (structuring indicator)
  if (transaction.amount % 1000 === 0 && transaction.amount > 50000)
    score += 10;

  return score;
}

async function applyFraudPrevention(transaction: Transaction) {
  const fraudScore = await calculateFraudScore(transaction);

  if (fraudScore >= 80) {
    // Block transaction
    await transaction.update({
      status: "FAILED",
      failedReason: "Fraud prevention",
    });
    await notifySecurityTeam(transaction, fraudScore);
    throw new Error("Transaction blocked for security reasons");
  } else if (fraudScore >= 50) {
    // Require additional verification
    await transaction.update({ status: "PENDING_VERIFICATION" });
  }
}
```

### 15.3 Operational Risks

#### 15.3.1 System Downtime

**Risk**: Service unavailability affecting users

**Mitigation**:

- High availability architecture (99.9% uptime target)
- Auto-scaling infrastructure
- Load balancing across multiple servers
- Database replication with auto-failover
- Disaster recovery plan

**Downtime Response Plan**:

```
1. Incident Detection (Automated alerts)
   ↓
2. Incident Assessment (< 5 minutes)
   ↓
3. Team Notification (Immediate)
   ↓
4. Diagnosis & Investigation (< 15 minutes)
   ↓
5. Fix Implementation
   ↓
6. Service Restoration
   ↓
7. Post-Mortem Analysis (Within 48 hours)
   ↓
8. Preventive Measures Implementation
```

#### 15.3.2 Data Loss

**Risk**: Loss of critical transaction or user data

**Mitigation**:

- Point-in-time recovery enabled
- Database replication (master-slave)
- Transaction logging before processing


```bash
#!/bin/bash


```

### 15.4 Compliance Risks

#### 15.4.1 Regulatory Compliance

**Risk**: Non-compliance with financial regulations, data protection laws

**Mitigation**:

- Regular compliance audits (quarterly)
- Legal consultation for regulatory updates
- Comprehensive audit trail
- Data retention policies
- Privacy policy and terms of service
- User consent management
- AML procedures

#### 15.4.2 Data Privacy

**Risk**: Violation of user privacy, unauthorized data access

**Mitigation**:

- Access control and authentication
- Privacy by design principles
- Regular security training for staff
- Data anonymization for analytics
- Clear privacy policy
- User data export/deletion capabilities

### 15.5 Business Continuity Plan

#### 15.5.1 Disaster Recovery

**Recovery Time Objective (RTO)**: 4 hours
**Recovery Point Objective (RPO)**: 1 hour

**Disaster Scenarios**:

1. **Complete Data Center Failure**

   - Update DNS records
   - Estimated recovery: 2-4 hours

2. **Database Corruption**

   - Switch to read replica
   - Verify data integrity
   - Resume normal operations
   - Estimated recovery: 1-2 hours

3. **Security Breach**
   - Isolate affected systems
   - Assess breach extent
   - Notify affected users
   - Implement security patches
   - Full security audit
   - Estimated recovery: 4-8 hours

#### 15.5.2 Incident Response Plan

```typescript
// Incident response workflow
enum IncidentSeverity {
  SEV1 = "Critical - Service down",
  SEV2 = "High - Major functionality impaired",
  SEV3 = "Medium - Minor functionality impaired",
  SEV4 = "Low - Cosmetic issue",
}

interface Incident {
  id: string;
  severity: IncidentSeverity;
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  rootCause?: string;
  preventiveMeasures?: string;
}

class IncidentManager {
  async createIncident(incident: Partial<Incident>): Promise<Incident> {
    const newIncident = await Incident.create({
      ...incident,
      detectedAt: new Date(),
    });

    // Notify incident response team
    await this.notifyTeam(newIncident);

    // Create incident war room (Slack channel)
    await this.createWarRoom(newIncident.id);

    // Start incident tracking
    await this.startTracking(newIncident);

    return newIncident;
  }

  async resolveIncident(
    incidentId: string,
    resolution: {
      rootCause: string;
      preventiveMeasures: string;
    }
  ) {
    await Incident.update(
      {
        resolvedAt: new Date(),
        rootCause: resolution.rootCause,
        preventiveMeasures: resolution.preventiveMeasures,
      },
      { where: { id: incidentId } }
    );

    // Send post-mortem report
    await this.generatePostMortem(incidentId);

    // Close war room
    await this.closeWarRoom(incidentId);
  }
}
```

## 14. PROJECT TIMELINE & MILESTONES

### 14.1 Development Phases

```
Phase 1: Foundation (Weeks 1-4)
├── Week 1: Project Setup & Architecture
├── Week 2: Database Design & Setup
├── Week 3: Authentication & User Management
└── Week 4: Basic API Structure

Phase 2: Core Features (Weeks 5-10)
├── Week 5-6: Wallet & Balance Management
├── Week 7-8: Send Money & Add Money
├── Week 9: Cash Out via Agents
└── Week 10: Transaction History & Statements

Phase 3: Core Features (Weeks 11-13)
├── Week 11: Agent Operations
├── Week 12: Bill Payments & Biller Management
└── Week 13: Bank Transfers (Mock)

Phase 4: Admin & Offers (Weeks 14-16)
├── Week 14: Admin Dashboard
├── Week 15: System Configuration
└── Week 16: Promotional Offers System


└── Week 21: Final Documentation & Handoff
```

### 16.2 Detailed Milestone Breakdown

#### 16.2.1 Phase 1: Foundation (Weeks 1-4)

| **Task**                                | **Duration** | **Assignee** | **Deliverable**          | **Status** |
| --------------------------------------- | ------------ | ------------ | ------------------------ | ---------- |
| Project kickoff & requirements analysis | 2 days       | Team         | Requirements document    | ⚪ Pending |
| System architecture design              | 3 days       | Tahsin       | Architecture diagram     | ⚪ Pending |
| Development environment setup           | 2 days       | All          | Local dev setup          | ⚪ Pending |
| Database schema design                  | 3 days       | Saif         | ERD & SQL scripts        | ⚪ Pending |
| Git repository setup                    | 2 days       | Forhad       | GitHub repository        | ⚪ Pending |
| API project structure                   | 2 days       | Tahsin       | Boilerplate code         | ⚪ Pending |
| User authentication (JWT)               | 4 days       | Forhad       | Login/Register APIs      | ⚪ Pending |
| RBAC implementation                     | 3 days       | Saif         | Authorization middleware | ⚪ Pending |

**Phase 1 Exit Criteria**:

- ✅ Database schema implemented
- ✅ Authentication working
- ✅ Authorization implemented

#### 16.2.2 Phase 2: Core Features (Weeks 5-10)

| **Task**                          | **Duration** | **Assignee** | **Deliverable**               |
| --------------------------------- | ------------ | ------------ | ----------------------------- |
| Wallet model & APIs               | 3 days       | Saif         | Wallet CRUD APIs              |
| Balance management logic          | 2 days       | Saif         | Balance update functions      |
| Send Money feature                | 5 days       | Tahsin       | Send money API                |
| Transaction ledger (double-entry) | 4 days       | Forhad       | Ledger system                 |
| Add Money (mock card)             | 3 days       | Saif         | Add money API                 |
| Cash Out initiate API             | 3 days       | Tahsin       | Cash out request API          |
| Transaction history API           | 2 days       | Saif         | History with pagination       |
| Statement generation (PDF)        | 3 days       | Forhad       | PDF export feature            |
| Fee calculation engine            | 3 days       | Tahsin       | Dynamic fee calculator        |

**Phase 2 Exit Criteria**:

- ✅ All core transaction types working
- ✅ Double-entry ledger verified
- ✅ Fee calculation accurate

#### 16.2.3 Phase 3: Core Features (Weeks 11-13)

| **Task**                      | **Duration** | **Assignee** | **Deliverable**    |
| ----------------------------- | ------------ | ------------ | ------------------ |
| Agent registration & approval | 3 days       | Forhad       | Agent onboarding   |
| Agent commission calculation  | 2 days       | Saif         | Commission engine  |
| Biller management system      | 4 days       | Tahsin       | Biller CRUD APIs   |
| Bill payment system           | 4 days       | Tahsin       | Bill payment APIs  |
| Bank transfer simulation      | 3 days       | Forhad       | Bank transfer APIs |

**Phase 3 Exit Criteria**:

- ✅ Agents can process cash-outs
- ✅ Biller management working
- ✅ Bill payments working with balance tracking

#### 16.2.4 Phase 4: Admin & Offers (Weeks 14-16)

| **Task**                         | **Duration** | **Assignee** | **Deliverable**             |
| -------------------------------- | ------------ | ------------ | --------------------------- |
| Admin authentication & dashboard | 3 days       | Tahsin       | Admin login & home          |
| User management (admin)          | 3 days       | Forhad       | User CRUD for admin         |
| Biller management (admin)        | 3 days       | Saif         | Biller CRUD system          |
| System configuration UI          | 3 days       | Tahsin       | Config management           |
| Offers creation & management     | 4 days       | Forhad       | Offers CRUD APIs            |
| Offer application logic          | 3 days       | Saif         | Automatic offer application |
| Platform analytics               | 3 days       | Tahsin       | Admin analytics dashboard   |

**Phase 4 Exit Criteria**:

- ✅ Admin can manage all users and billers
- ✅ Offer system functional
- ✅ System configuration works
- ✅ Analytics dashboard complete

