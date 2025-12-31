import { useState, useCallback } from 'react';

// Admin Meta IDs from environment variable
const ADMIN_META_IDS = (import.meta.env.VITE_ADMIN_META_IDS || '').split(',').map(id => id.trim());
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

const useAdminAuth = (user) => {
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Check if the current user's metaId is in the admin allowlist
  // Convert both to strings for comparison to handle number/string mismatches
  const userMetaId = user?.metaId ? String(user.metaId) : null;
  const isInAllowlist = userMetaId && ADMIN_META_IDS.some(id => id === userMetaId);

  // Full admin access requires both allowlist AND password
  const isAdmin = isInAllowlist && isPasswordVerified;

  // Verify password
  const verifyPassword = useCallback((password) => {
    if (password === ADMIN_PASSWORD) {
      setIsPasswordVerified(true);
      setPasswordError(null);
      return true;
    } else {
      setPasswordError('Incorrect password');
      return false;
    }
  }, []);

  // Reset password verification (for logout)
  const resetPasswordVerification = useCallback(() => {
    setIsPasswordVerified(false);
    setPasswordError(null);
  }, []);

  return {
    isInAllowlist,
    isPasswordVerified,
    isAdmin,
    passwordError,
    verifyPassword,
    resetPasswordVerification,
  };
};

export default useAdminAuth;
