import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../services/apiClient';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function SSOCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('access');

    if (!accessToken) {
      setError('No access token received from SSO portal.');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        // Fetch user profile using the newly received token
        const response = await apiClient.get('/users/me/', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        const userPayload = response.data.data;
        const orgs = userPayload.organizations || [];
        const backendRole = orgs[0]?.role || "VIEWER";
        const frontendRole: 'owner' | 'admin' | 'editor' | 'viewer' = 
          backendRole === "SUPER_ADMIN" || backendRole === "ORG_ADMIN" ? "admin" : 
          backendRole === "ANALYST" ? "editor" : "viewer";

        const mappedUser = {
          id: userPayload.id,
          name: `${userPayload.first_name || ""} ${userPayload.last_name || ""}`.trim() || userPayload.email,
          email: userPayload.email,
          role: frontendRole,
          organizationId: orgs[0]?.id || "",
        };

        // Save auth state
        setAuth(mappedUser, accessToken);

        // Redirect to dashboards
        navigate('/dashboards');
      } catch (err: any) {
        console.error('Error fetching SSO user profile:', err);
        setError('Failed to authenticate with corporate SSO user profile.');
      }
    };

    fetchUserProfile();
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl text-center text-xs text-zinc-900">
        {error ? (
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="h-10 w-10 text-red-500 animate-bounce" />
            <h3 className="text-sm font-bold text-red-600">Authentication Error</h3>
            <p className="text-zinc-500 leading-normal mt-1">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-white font-bold hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <ShieldCheck className="h-10 w-10 text-primary animate-pulse" />
            <h3 className="text-sm font-bold">Verifying Corporate Credentials</h3>
            <p className="text-zinc-500 mt-1">
              Establishing secure SSO session. Please hold...
            </p>
            <div className="mt-4 h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}
