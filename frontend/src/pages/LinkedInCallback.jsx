import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { Loader2 } from 'lucide-react';

const LinkedInCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = new URLSearchParams(location.search).get('code');
    if (code) {
      api.post('/api/auth/linkedin-login', { code })
        .then(({ data }) => {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data));
          // Redirect to home dashboard
          window.location.href = '/';
        })
        .catch((err) => {
          const errMsg = err.response?.data?.message || 'LinkedIn OAuth authentication failed';
          setErrorMsg(errMsg);
          setTimeout(() => {
            navigate('/login', { state: { error: errMsg } });
          }, 3000);
        });
    } else {
      setErrorMsg('No authorization code found in URL');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-outline-variant p-8 shadow-md text-center max-w-sm w-full space-y-4">
        {errorMsg ? (
          <>
            <div className="w-12 h-12 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h3 className="font-bold text-sm text-on-surface">Authentication Error</h3>
            <p className="text-xs text-error font-medium leading-relaxed">{errorMsg}</p>
            <p className="text-[10px] text-on-surface-variant">Redirecting back to Sign In portal...</p>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin text-primary mx-auto" size={32} />
            <h3 className="font-bold text-sm text-on-surface">Processing LinkedIn Login</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Exchanging authorization code for secure session token...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LinkedInCallback;
