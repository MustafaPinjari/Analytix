import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Mail } from 'lucide-react';

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
      <div className="flex flex-col gap-6 text-center text-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-500">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-zinc-900">Check your email</h2>
          <p className="text-xs text-zinc-400 font-semibold px-2">
            We have sent password reset instructions to your email address.
          </p>
        </div>
        <Link
          to="/login"
          className="mt-2 flex w-full items-center justify-center rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-200 active:scale-[0.98]"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-xs text-left">
      <div className="flex flex-col gap-1 text-left">
        <h2 className="text-2xl font-black tracking-tight text-zinc-900">Forgot password?</h2>
        <p className="text-xs text-zinc-400 font-semibold mt-0.5">
          Enter your email and we will send you instructions to reset it
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
        {/* Email Address */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700" htmlFor="email">
            Email address
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 h-4 w-4 text-zinc-400" />
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              className="w-full rounded-lg border border-zinc-200/80 bg-[#F0F4F9]/70 pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
          </div>
          {errors.email && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.email.message}</span>
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
            'Send Reset Link'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-zinc-500 font-medium">
        Remember your password?{' '}
        <Link to="/login" className="font-bold text-primary hover:brightness-110">
          Sign In
        </Link>
      </div>
    </div>
  );
}
