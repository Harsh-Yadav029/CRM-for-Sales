import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Conditionally renders children if the current user's role matches any of the allowed roles.
 * @param {Array<string>} allow - List of roles permitted to view the block (e.g. ['admin', 'manager'])
 * @param {React.ReactNode} children - Elements to render
 * @param {React.ReactNode} [fallback=null] - Optional visual fallback for unauthorized users
 */
const RoleGate = ({ allow, children, fallback = null }) => {
  const { user } = useAuth();

  if (!user || !allow.includes(user.role)) {
    return fallback;
  }

  return <>{children}</>;
};

export default RoleGate;
