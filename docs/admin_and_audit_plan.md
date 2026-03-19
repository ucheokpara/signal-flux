# Admin Role & Audit Tracking Implementation Plan

This plan addresses the new requirements for strict email authentication, an Admin-only dashboard view, and comprehensive user action auditing across the application.

## 1. Firebase Email Authentication Enforcement
Currently, the application supports connecting to Firebase Auth, but we will ensure it strictly requires **Email/Password** authentication for everyone accessing the deployed app. We will remove any "skip logic" or mock entries from the deployed version (while retaining the offline fallback solely for local dev without `.env` keys). 

## 2. Role-Based Access Control (Admin Profile)
We will expand the Firestore `users` documents to include a `role` field.
*   **Data Model:** `role: 'user' | 'admin'` added to the `AuthenticatedUser` type.
*   **UI Access:** The `Sidebar` component will conditionally render an **"Admin"** navigation tab *only* if `authUser.role === 'admin'`.
*   **Admin View:** A new `AdminView.tsx` component will be created to house the audit tracking dashboard and other administrative tools.

## 3. Global Audit Tracking Architecture
We will implement an `auditTrackingService.ts` that writes directly to a new `audit_logs` collection in Firestore.

**Events to Track:**
*   **Session Events:** `LOGIN`, `LOGOUT`
*   **Feature Events:** Module execution (`Telemetry Executed`, `Simulation Executed`)
*   **Reporting:** `REPORT_GENERATED`, `REPORT_DOWNLOADED`
*   **Navigation:** `PAGE_VIEWED` (e.g., Use Cases viewed)
*   **Configuration:** `DATA_SCOPE_CHANGED`

**Log Schema Example:**
```json
{
  "userId": "uid_123",
  "email": "user@example.com",
  "action": "REPORT_DOWNLOADED",
  "details": "Downloaded toxicity report for 15 hours",
  "timestamp": "firestore_timestamp"
}
```

## 4. Specific Component Modifications
*   **`App.tsx`**: Hook into the `onAuthStateChanged` and `onLogout` events to trigger `LOGIN`/`LOGOUT` audit logs. Add the routing for the new `AdminView`.
*   **`Sidebar.tsx`**: Conditionally render the Admin tab. Hook navigation clicks to log `PAGE_VIEWED` events.
*   **`DataScopeView.tsx`**: Trigger an audit log when configurations are saved.
*   **`TelemetryLiveView.tsx` & `Reporting Engine`**: Inject audit log calls into the execute and download functions.

## User Review Required
> [!IMPORTANT]
> The audit tracking logs will be heavily utilized in the Firestore Database. Since Firebase charges based on database writes, tracking *everything* (like clicking on tabs) will rack up thousands of writes per day if the app scales. Do you approve this level of granular tracking, or would you prefer we stick to tracking only major actions (like logins, searches, and report generation)?
