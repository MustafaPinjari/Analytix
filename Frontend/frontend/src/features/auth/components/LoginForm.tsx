import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiClient } from '../../../services/apiClient';
import { MOCK_USER } from '../../../utils/mockData';
import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';

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
    <div className="flex flex-col gap-6 text-xs">
      <div className="flex flex-col gap-1.5 text-left">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-xs text-muted-foreground">
          Enter your credentials to access your analytics workspace
        </p>
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold text-muted-foreground" htmlFor="email">
            Email address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground/80" />
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              className="w-full rounded-lg border border-border bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
          </div>
          {errors.email && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-muted-foreground" htmlFor="password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-semibold text-primary hover:text-primary/80"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground/80" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
          </div>
          {errors.password && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
          Create one free
        </Link>
      </div>
    </div>
  );
}
