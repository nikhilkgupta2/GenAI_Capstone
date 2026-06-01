# IMS Inventory Cloud - Project Summary

## Overview

IMS Inventory Cloud is a multi-tenant SaaS inventory management platform for retailers, warehouse teams, procurement users, auditors, and platform administrators. It is built with a React + TypeScript frontend, a FastAPI backend, PostgreSQL, SQLAlchemy, Alembic migrations, JWT authentication, and role-based access control.

The system separates platform administration from tenant operations. Super Admin users manage the SaaS platform, while tenant-scoped users operate inventory, procurement, warehouses, audit workflows, and team management inside their own company workspace.

## Technology Stack

- Frontend: React, TypeScript, Vite, React Router, React Query, Tailwind CSS, lucide-react
- Backend: FastAPI, Python, SQLAlchemy, Pydantic, Alembic
- Database: PostgreSQL
- Auth: JWT access tokens, password hashing, email verification, password reset OTPs, optional Google login
- Dev tooling: npm, uvicorn, Alembic, seed scripts

## Core Features

### Authentication and Account Management

- Email/password registration and login
- JWT-based protected routes
- Email verification OTP flow
- Password reset OTP flow
- Optional Google sign-in
- Session expiry handling on the frontend
- Role-aware route protection

### Dashboard

- Role-specific dashboard views
- Platform overview for Super Admin
- Inventory operations dashboard for tenant users
- Warehouse staff dashboard
- Auditor dashboard
- Procurement dashboard
- Activity feed for recent operational events
- Dashboard summaries, charts, and status widgets

### Product Management

- Product listing and search
- Product detail pages
- Product creation and editing for authorized users
- SKU, category, brand, supplier, price, quantity, warehouse location, and description tracking
- Product import support through CSV import center

### Inventory Management

- Stock in, stock out, and adjustment workflows
- Inventory transaction history
- Quantity validation to prevent invalid stock movement
- Warehouse-staff scoped inventory operations
- Barcode/SKU scan support
- Stock adjustment approval workflow

### Warehouse Management

- Warehouse listing and inventory views
- Multi-warehouse inventory support
- Stock transfer workflows
- Transfer item workflow support
- Warehouse staff assigned-warehouse restrictions
- Retailer Admin approval for warehouse transfers

### Procurement

- Supplier management
- Supplier profile pages
- Purchase order listing and detail pages
- Purchase order creation and lifecycle management
- Purchase order audit trail
- Procurement analytics
- Destination warehouse selection for purchase orders

### Audit and Approvals

- Audit log viewer
- Tenant-scoped audit access
- Stock adjustment request approvals
- Approval queue for Retailer Admin users
- Auditor read-only compliance workflow

### Notifications

- Notification center in the top bar
- Unread notification count
- Mark one or all notifications as read
- Soft delete notifications
- Activity feed for operational events
- Notifications generated from low stock, inventory movement, purchase order activity, transfers, and user activity

### Super Admin Platform Features

- Tenant management
- Tenant drilldown views
- Platform overview dashboard
- User management across the platform
- Tenant approval workflows
- Audit log access
- Notifications page
- System health page
- Billing page
- Permissions page
- Support center
- Settings page

### Import Center

- CSV import workflows
- Product import support
- Warehouse inventory import templates
- Row-level validation and import summaries

## Roles and Access

### Super Admin

Platform-level role for SaaS administration.

Can access:

- Overview dashboard
- Tenants
- Tenant drilldown
- Approvals
- Users
- Audit logs
- Notifications
- System health
- Billing
- Permissions
- Support center
- Settings

Primary responsibilities:

- Manage tenants and platform health
- Review platform-wide users and audit activity
- Configure platform-level controls
- Monitor billing, permissions, support, and notifications

### Retailer Admin

Tenant-level administrator with the broadest operational access inside a retailer workspace.

Can access:

- Tenant dashboard
- Products
- Product detail
- Product create/edit
- Stock management
- Inventory transactions
- Warehouses
- Import center
- Purchase orders
- Suppliers
- Users
- Approvals
- Audit logs

Primary responsibilities:

- Manage products and inventory
- Manage tenant users
- Approve stock adjustments and warehouse workflows
- Manage procurement and suppliers
- Review audit logs and operational activity

### Inventory Manager

Tenant-level inventory operations role.

Can access:

- Tenant dashboard
- Products
- Product detail
- Stock management
- Inventory transactions
- Warehouses

Primary responsibilities:

- Maintain stock levels
- Perform inventory movements
- Review transaction history
- Manage warehouse inventory workflows

### Warehouse Staff

Tenant-level warehouse operations role, optionally scoped to an assigned warehouse.

Can access:

- Warehouse staff dashboard
- Products
- Product detail
- Stock management
- Inventory transactions
- Warehouses

Primary responsibilities:

- Execute stock movement tasks
- Work with assigned warehouse inventory
- Scan products/SKUs
- Support stock transfer workflows

### Auditor

Tenant-level compliance and read-only review role.

Can access:

- Auditor dashboard
- Products
- Product detail
- Inventory transactions
- Warehouses
- Audit logs

Primary responsibilities:

- Review transaction history
- Inspect audit logs
- Monitor compliance-sensitive activity
- Validate inventory and operational records without modifying them

### Procurement Manager

Tenant-level purchasing and supplier operations role.

Can access:

- Procurement dashboard
- Products
- Product detail
- Inventory transactions
- Warehouses
- Purchase orders
- Purchase order detail
- Suppliers
- Supplier profile

Primary responsibilities:

- Manage suppliers
- Manage purchase orders
- Track incoming inventory
- Review procurement analytics and supplier activity

## Seed Users

The local seed scripts create these demo users with the same password: `Password123!`.

| Role | Email | Password |
| --- | --- | --- |
| Retailer Admin | `admin@acmeretail.io` | `Password123!` |
| Inventory Manager | `manager@acmeretail.io` | `Password123!` |
| Warehouse Staff | `warehouse@acmeretail.io` | `Password123!` |
| Auditor | `auditor@acmeretail.io` | `Password123!` |
| Procurement Manager | `procurement@acmeretail.io` | `Password123!` |
| Super Admin | `super@inventorypro.io` | `Password123!` |

Default tenant: `Acme Retail Co.`

## Backend API Areas

The backend exposes API modules for:

- Auth
- Dashboard
- Products
- Inventory
- Warehouses
- Procurement
- Imports
- Notifications
- Audit
- Users
- Super Admin
- Health checks

## Local Development Flow

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python scripts/seed_all.py
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Local URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://127.0.0.1:8000`
- API Docs: `http://127.0.0.1:8000/docs`

## Important Operational Notes

- Always run `alembic upgrade head` after pulling backend model or migration changes.
- If login behaves strangely, confirm the frontend points to `http://127.0.0.1:8000/api/v1` and not another backend process.
- Use `python scripts/seed_all.py` to reset demo data for local testing.
- Super Admin and tenant roles see different dashboards and navigation by design.
- Notification APIs depend on migrations matching the current `Notification` model.

## Current Product Positioning

IMS Inventory Cloud is best described as an operational control plane for inventory-heavy retail businesses. It combines product catalog management, warehouse operations, procurement, audit controls, notifications, and SaaS tenant administration in one role-aware platform.
