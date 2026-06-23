import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Lock } from 'lucide-react';

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordForm() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (_data: ResetFormValues) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // Handle err
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-6 text-center text-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-500">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-zinc-900">Password reset complete</h2>
          <p className="text-xs text-zinc-400 font-semibold px-2">
            Your password has been successfully reset. Redirecting you to login page...
          </p>
        </div>
        <Link
          to="/login"
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-115 active:scale-[0.98] cursor-pointer"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-xs text-left">
      <div className="flex flex-col gap-1 text-left">
        <h2 className="text-2xl font-black tracking-tight text-zinc-900">Reset password</h2>
        <p className="text-xs text-zinc-400 font-semibold mt-0.5">
          Enter your new password below to finalize account changes
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700" htmlFor="password">
            New Password
          </label>
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

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 h-4 w-4 text-zinc-400" />
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-zinc-200/80 bg-[#F0F4F9]/70 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium"
              {...register('confirmPassword')}
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
            />
          </div>
          {errors.confirmPassword && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.confirmPassword.message}</span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-115 active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );
}
