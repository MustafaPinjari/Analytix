import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordForm() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (_data: ForgotFormValues) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
    } catch (err) {
      // Handle err
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/50 border border-emerald-800 text-emerald-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-white">Check your email</h2>
          <p className="text-xs text-zinc-400 px-2">
            We have sent password reset instructions to your email address.
          </p>
        </div>
        <Link
          to="/login"
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-700 active:scale-[0.98]"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-left">
        <h2 className="text-xl font-bold tracking-tight text-white">Forgot password?</h2>
        <p className="text-xs text-zinc-400">
          Enter your email and we will send you instructions to reset it
        </p>
      </div>

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

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-zinc-400">
        Remember your password?{' '}
        <Link to="/login" className="font-semibold text-violet-400 hover:text-violet-300">
          Sign In
        </Link>
      </div>
    </div>
  );
}
