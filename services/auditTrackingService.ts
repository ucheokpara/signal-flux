import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { AuthenticatedUser } from '../types';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'REPORT_GENERATED'
  | 'REPORT_DOWNLOADED'
  | 'USE_CASE_VIEWED'
  | 'DATA_SCOPE_CHANGED'
  | 'TELEMETRY_EXECUTED'
  | 'SIMULATION_EXECUTED'
  | 'ADMIN_AGENT_INVOKED';

export const logAuditEvent = async (
  user: AuthenticatedUser | null,
  action: AuditAction,
  details: string = ''
) => {
  if (!db || !user) return; 
  if (user.uid === 'offline_mode') return; // Do not bloat DB with offline local testing logs

  try {
    const auditRef = collection(db, 'audit_logs');
    await addDoc(auditRef, {
      userId: user.uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      action: action,
      details: details,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};
