import type { AuthUser } from './auth-service';

export type Subject = { role: 'admin' | 'employee'; active: boolean };
export type Resource = 'home' | 'users' | 'employee-account';
export type Action = 'view' | 'update';

// Roles are derived from the known account, never trusted from stored sessions.
export function subjectFor(
  user: AuthUser | null,
  employeeActive: boolean,
): Subject | null {
  if (user?.username === 'admin') return { role: 'admin', active: true };
  if (user?.username === 'employee')
    return { role: 'employee', active: employeeActive };
  return null;
}

export function canAccess(
  subject: Subject | null,
  resource: Resource,
  action: Action = 'view',
) {
  if (!subject?.active) return false;
  if (action === 'update')
    return subject.role === 'admin' && resource === 'employee-account';
  return resource === 'home' || subject.role === 'admin';
}
