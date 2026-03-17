import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait briefly for Supabase to parse
        // the hash fragment automatically
        await new Promise(r => setTimeout(r, 500));

        // Supabase JS automatically detects
        // hash fragment and sets the session
        const { data, error } =
          await supabase.auth.getSession();

        if (data?.session) {
          // Success path
          const token = data.session.access_token;
          const user = data.session.user;
          const name =
            user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.email?.split('@')[0] ||
            'User';

          // Store token
          loginWithToken(token, name);

          // Create profile if first Google login
          try {
            await fetch(
              `${import.meta.env.VITE_API_URL}` +
              `/api/auth/ensure-profile`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            );
          } catch (e) {
            // Non-critical, continue anyway
          }

          navigate('/dashboard');
          return;
        }

        // If no session from hash, try manual parse
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(
            hash.substring(1) // remove the # character
          );
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            // Set session manually using the tokens
            const { data: sessionData, error: sessionErr } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });

            if (sessionData?.session) {
              const user = sessionData.session.user;
              const name =
                user?.user_metadata?.full_name ||
                user?.user_metadata?.name ||
                user?.email?.split('@')[0] ||
                'User';

              loginWithToken(accessToken, name);

              try {
                await fetch(
                  `${import.meta.env.VITE_API_URL}` +
                  `/api/auth/ensure-profile`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${accessToken}`
                    }
                  }
                );
              } catch (e) {
                // Non-critical
              }

              navigate('/dashboard');
              return;
            }
          }
        }

        // Nothing worked — back to login
        console.error('Auth callback failed:', error);
        navigate('/login?error=google_failed');

      } catch (err) {
        console.error('Callback error:', err);
        navigate('/login?error=google_failed');
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '16px',
      background: '#F0F2F5'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #F3F4F6',
        borderTopColor: '#F97316',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <p style={{
        fontSize: '14px',
        color: '#6B7280',
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      }}>
        Signing you in with Google...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
