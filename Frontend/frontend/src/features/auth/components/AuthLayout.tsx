import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 text-zinc-100 antialiased">
      {/* Decorative Gradient Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
      
      {/* Animated Subtle Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-10 w-full max-w-[440px] animate-fade-in-up">
        {/* Brand Logo Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            InsightFlow <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">BI</span>
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Enterprise Intelligence & Data Analytics Platform
          </p>
        </div>

        {/* Content Card Wrapper */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
