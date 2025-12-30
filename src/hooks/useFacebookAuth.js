import { useState, useEffect, useCallback } from 'react';

const useFacebookAuth = () => {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if FB SDK is ready
  useEffect(() => {
    const checkSDK = () => {
      if (window.FB) {
        setIsSDKReady(true);
      } else {
        // SDK not loaded yet, check again
        setTimeout(checkSDK, 100);
      }
    };

    // If fbAsyncInit hasn't run yet, set up listener
    if (window.FB) {
      setIsSDKReady(true);
    } else {
      const originalInit = window.fbAsyncInit;
      window.fbAsyncInit = function () {
        if (originalInit) originalInit();
        setIsSDKReady(true);
      };
      // Also check periodically in case fbAsyncInit already ran
      checkSDK();
    }
  }, []);

  // Login with Facebook
  const login = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error('Facebook SDK not loaded'));
        return;
      }

      setIsLoading(true);
      setError(null);

      window.FB.login(
        (response) => {
          if (response.authResponse) {
            // Successfully logged in, fetch user data
            window.FB.api(
              '/me',
              { fields: 'id,name,picture.type(large)' },
              (userInfo) => {
                setIsLoading(false);
                if (userInfo.error) {
                  setError(userInfo.error.message);
                  reject(userInfo.error);
                } else {
                  const userData = {
                    metaId: userInfo.id,
                    name: userInfo.name,
                    avatar: userInfo.picture?.data?.url || `https://graph.facebook.com/${userInfo.id}/picture?type=large`,
                    platform: 'facebook',
                  };
                  resolve(userData);
                }
              }
            );
          } else {
            setIsLoading(false);
            const err = new Error('User cancelled login or did not fully authorize');
            setError(err.message);
            reject(err);
          }
        },
        { scope: 'public_profile' }
      );
    });
  }, []);

  // Logout from Facebook
  const logout = useCallback(() => {
    return new Promise((resolve) => {
      if (window.FB) {
        window.FB.logout((response) => {
          resolve(response);
        });
      } else {
        resolve(null);
      }
    });
  }, []);

  // Check current login status
  const checkLoginStatus = useCallback(() => {
    return new Promise((resolve) => {
      if (!window.FB) {
        resolve(null);
        return;
      }

      window.FB.getLoginStatus((response) => {
        if (response.status === 'connected') {
          // User is logged in, fetch their data
          window.FB.api(
            '/me',
            { fields: 'id,name,picture.type(large)' },
            (userInfo) => {
              if (userInfo.error) {
                resolve(null);
              } else {
                resolve({
                  metaId: userInfo.id,
                  name: userInfo.name,
                  avatar: userInfo.picture?.data?.url || `https://graph.facebook.com/${userInfo.id}/picture?type=large`,
                  platform: 'facebook',
                });
              }
            }
          );
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  return {
    isSDKReady,
    isLoading,
    error,
    login,
    logout,
    checkLoginStatus,
  };
};

export default useFacebookAuth;
