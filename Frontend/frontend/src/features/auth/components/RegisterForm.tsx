import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { apiClient } from '../../../services/apiClient';
import { MOCK_USER } from '../../../utils/mockData';
import { useState } from 'react';
import { User, Mail, Building2, Lock } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Please enter a valid email address'),
    orgName: z.string().min(2, 'Company/Org name must be at least 2 characters long'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setApiError(null);

    try {
      const parts = data.name.trim().split(/\s+/);
      const first_name = parts[0] || "";
      const last_name = parts.slice(1).join(" ") || "";

      await apiClient.post('/auth/register/', {
        email: data.email,
        password: data.password,
        first_name,
        last_name,
        org_name: data.orgName,
      });

      alert("Registration successful! A verification link has been sent to your email. (Check Celery task logs for the token)");
      navigate('/login');
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Registration failed. Please check your data.';
      setApiError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-left">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Create your account</h2>
        <p className="text-xs text-muted-foreground">
          Get started with Analytix BI and unleash your analytics
        </p>
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5 text-left text-xs">
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-muted-foreground" htmlFor="name">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 h-4 w-4 text-muted-foreground/80" />
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              className="w-full rounded-lg border border-border bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('name')}
              aria-invalid={errors.name ? 'true' : 'false'}
            />
          </div>
          {errors.name && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.name.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
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

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-muted-foreground" htmlFor="orgName">
            Company Name
          </label>
          <div className="relative flex items-center">
            <Building2 className="absolute left-3.5 h-4 w-4 text-muted-foreground/80" />
            <input
              id="orgName"
              type="text"
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-border bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              {...register('orgName')}
              aria-invalid={errors.orgName ? 'true' : 'false'}
            />
          </div>
          {errors.orgName && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.orgName.message}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-muted-foreground" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground/80" />
              <input
                id="password"
                type="password"
                placeholder="•••••"
                className="w-full rounded-lg border border-border bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
            </div>
            {errors.password && (
              <span className="text-[11px] text-red-500 font-semibold">{errors.password.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-muted-foreground" htmlFor="confirmPassword">
              Confirm
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground/80" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="•••••"
                className="w-full rounded-lg border border-border bg-slate-50/50 pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                {...register('confirmPassword')}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
            </div>
            {errors.confirmPassword && (
              <span className="text-[11px] text-red-500 font-semibold">{errors.confirmPassword.message}</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-3 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
          Sign In
        </Link>
      </div>
    </div>
  );
}
