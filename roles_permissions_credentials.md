# Roles, Permissions, and Credentials Guide

This document defines the Role-Based Access Control (RBAC) mapping, permission matrices, and dev/test credentials configured for the Analytix BI Platform.

---

## 1. User Roles Overview

The platform uses a role-based mapping schema that translates backend database roles (`UserOrganizationRole`) to frontend permissions (`UserRole`).

| Backend Role Name | Frontend Role Name | Intended Persona & Workspace Privileges |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | **`owner`** (or `admin`) | Global Platform Admin / Workspace Owner. Full control over all organizations, system settings, billing, users, and dashboards. |
| **`ORG_ADMIN`** | **`admin`** | Organization Admin. Full configuration rights for their specific organization context, user invitation capabilities, and dashboard edit rights. |
| **`ANALYST`** | **`editor`** | Data Analyst / Developer. Can view/create/edit dashboards, datasets, and reports, but cannot access administrative panels (Users, Settings). |
| **`VIEWER`** | **`viewer`** | Read-Only consumer. Can view existing dashboards and reports but cannot edit or create assets, nor access admin areas. |

---

## 2. Permissions Matrix

### Backend API Permissions

Permissions are guarded by Django REST Framework permission classes defined in `core/permissions.py`:

* **`IsSuperAdmin`**: Granted if the user is a Django superuser (`is_superuser=True`) or has the `SUPER_ADMIN` role.
* **`IsOrgAdmin`**: Access allowed for `SUPER_ADMIN` and `ORG_ADMIN` roles.
* **`IsAnalyst`**: Access allowed for `SUPER_ADMIN`, `ORG_ADMIN`, and `ANALYST` roles.
* **`IsViewer`**: Access allowed for all authenticated roles (`SUPER_ADMIN`, `ORG_ADMIN`, `ANALYST`, `VIEWER`).

| Endpoint / Action | Backend Guard Class | Allowed Roles |
| :--- | :--- | :--- |
| **List Workspace Members** (`GET /users/`) | `IsOrgAdmin` | Super Admin, Org Admin |
| **Invite Workspace User** (`POST /organizations/<id>/invite/`) | `IsOrgAdmin` | Super Admin, Org Admin |
| **Create Dashboard** (`POST /dashboards/`) | `IsAnalyst` | Super Admin, Org Admin, Analyst |
| **Edit/Delete Dashboard** (`PUT`/`DELETE /dashboards/<id>/`) | `IsAnalyst` | Super Admin, Org Admin, Analyst |
| **View Dashboard** (`GET /dashboards/<id>/`) | `IsViewer` | Super Admin, Org Admin, Analyst, Viewer |

### Frontend UI Access

* **Admin Areas**: The **Users** and **Settings** navigation options in the sidebar are only rendered and routed for `owner` and `admin` roles.
* **Builder Canvas**: The "New Dashboard" button and edit actions are hidden for `viewer` roles.

---

## 3. Test Credentials

Use these credentials to authenticate as different roles on `http://localhost:5173/login`.

### A. System Administrator (Super Admin)
Bypasses organization checks and has access to all tenants in the system.
* **Email**: `mustafapinjari344@gmail.com`
* **Password**: `55555`
* **Assigned Role**: `SUPER_ADMIN` / `owner`

### B. Pre-registered Organization Analyst (Editor)
Has edit privileges for dashboards in `Test Company`.
* **Email**: `user123@analytix.com`
* **Password**: `password123`
* **Assigned Role**: `ANALYST` / `editor`

### C. Pre-registered Organization Viewer (Viewer)
Has read-only dashboard access in `Test Company`.
* **Email**: `test@analytix.com`
* **Password**: `password123`
* **Assigned Role**: `VIEWER` / `viewer`

### D. Single Sign-On (Mock SSO SAML/OIDC)
Clicking the **Google Workspace SSO**, **Azure AD SSO**, or **Okta SSO Portal** buttons on the Login Screen:
* **First Login / Registration**: Creates a new organization and grants the user the `SUPER_ADMIN` role.
* **Subsequent Logins**: Authenticates the user with the `VIEWER` role in that organization.
