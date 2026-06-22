import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { MOCK_USER } from '../../../utils/mockData';
import { useState } from 'react';

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
      // Simulate API network latency
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Standalone simulation login (allows any demo account)
      const mockUser = {
        ...MOCK_USER,
        email: data.email,
        name: data.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      };
      
      setAuth(mockUser, 'mock-jwt-token-xyz-123');
      navigate('/dashboards');
    } catch (err) {
      setApiError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-left">
        <h2 className="text-xl font-bold tracking-tight text-white">Welcome back</h2>
        <p className="text-xs text-zinc-400">
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
          <label className="text-xs font-semibold text-zinc-300" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            {...register('email')}
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && (
            <span className="text-[11px] text-red-400">{errors.email.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300" htmlFor="password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-violet-400 hover:text-violet-300"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-violet-600 focus:ring-1 focus:ring-violet-600"
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
          />
          {errors.password && (
            <span className="text-[11px] text-red-400">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-violet-400 hover:text-violet-300">
          Create one free
        </Link>
      </div>
    </div>
  );
}
