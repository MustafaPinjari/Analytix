import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiClient } from '../../../services/apiClient';
import { useState } from 'react';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSSOLogin = (provider: 'google' | 'okta' | 'azure') => {
    const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    window.location.href = `${baseApiUrl}/auth/sso/authorize/?provider=${provider}`;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setApiError(null);
    
    try {
      const response = await apiClient.post('/auth/login/', {
        email: data.email,
        password: data.password,
      });

      const responseData = response.data;
      const accessToken = responseData.access;
      const userPayload = responseData.user;
      const orgs = responseData.organizations || [];

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

      setAuth(mappedUser, accessToken);
      navigate('/dashboards');
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Invalid credentials. Please try again.';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-xs text-left">
      <div className="flex flex-col gap-1 text-left">
        <h2 className="text-2xl font-black tracking-tight text-zinc-900">Welcome back</h2>
        <p className="text-xs text-zinc-400 font-semibold mt-0.5">
          Enter your credentials to access your analytics workspace
        </p>
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-500 font-semibold">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700" htmlFor="email">
            Email address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4 w-4 text-zinc-400" />
            <input
              id="email"
              type="email"
              placeholder="unlessuser99@gmail.com"
              className="w-full rounded-lg border border-zinc-200/80 bg-[#F0F4F9]/70 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
          </div>
          {errors.email && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.email.message}</span>
          )}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700" htmlFor="password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-primary hover:brightness-110"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-zinc-400" />
            <input
              id="password"
              type="password"
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-zinc-200/80 bg-[#F0F4F9]/70 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium"
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
          </div>
          {errors.password && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.password.message}</span>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-115 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Sign In'
          )}
        </button>

        {/* Divider */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-zinc-200"></div>
          <span className="flex-shrink mx-3 text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-white px-2">Or continue with</span>
          <div className="flex-grow border-t border-zinc-200"></div>
        </div>

        {/* SSO Panel (CUST-11 / SSO-1) */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => handleSSOLogin('google')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:border-zinc-300"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 15.01 1 12 1 7.24 1 3.23 3.73 1.34 7.68l3.87 3C6.13 7.82 8.8 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.45c-.28 1.48-1.11 2.73-2.37 3.58l3.68 2.85c2.15-1.98 3.39-4.89 3.39-8.53z"/>
              <path fill="#FBBC05" d="M5.21 14.68c-.23-.68-.36-1.42-.36-2.18s.13-1.5.36-2.18L1.34 7.32C.48 9.12 0 11.01 0 12.5s.48 3.38 1.34 5.18l3.87-3z"/>
              <path fill="#34A853" d="M12 18.96c-3.2 0-5.87-2.78-6.79-5.64l-3.87 3c1.89 3.95 5.9 6.68 10.66 6.68 3.01 0 5.67-.58 7.67-2.11l-3.68-2.85c-1.18.82-2.72 1.32-4.38 1.32z"/>
            </svg>
            Google Workspace SSO
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSSOLogin('azure')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[10px] font-bold text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:border-zinc-300"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              Azure AD SSO
            </button>
            <button
              type="button"
              onClick={() => handleSSOLogin('okta')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[10px] font-bold text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:border-zinc-300"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              Okta SSO Portal
            </button>
          </div>
        </div>
      </form>

      {/* Footer link */}
      <div className="text-center text-xs text-zinc-500 font-medium mt-1">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-bold text-primary hover:brightness-110">
          Create one free
        </Link>
      </div>
    </div>
  );
}
