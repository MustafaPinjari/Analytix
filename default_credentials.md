# Default Login Credentials

This document lists the pre-registered accounts and login credentials configured for development and testing in the Analytix BI Platform.

---

## 1. Django Superuser (System Admin)
Use these credentials to access full administrative privileges.
* **Email / Username**: `mustafapinjari344@gmail.com`
* **Password**: `55555`

---

## 2. Pre-registered Test Accounts
These accounts have standard analyst/viewer workspace access.
* **Analyst User 1**:
  - **Email**: `user123@analytix.com`
  - **Password**: `password123`
* **Analyst User 2**:
  - **Email**: `test@analytix.com`
  - **Password**: `password123`

---

## 3. Mock Corporate SSO SAML Login
For fast-pass authentication matching CUST-11 single sign-on redirects:
* Simply click the **"SAML Identity Provider SSO"** button on the Login Screen.
* The system will bypass credential forms and authenticate as:
  - **Email**: `sso@enterprise.com`
  - **Role**: `admin`
