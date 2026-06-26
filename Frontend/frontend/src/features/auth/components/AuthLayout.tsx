import { Outlet } from 'react-router-dom';
import { TrendingUp, CheckCircle2, Database, Sparkles, Lock } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground select-none">
      {/* Left side: Banner Image (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[58%] shrink-0 relative overflow-hidden items-center justify-center border-r border-border bg-[#FDFBF7]">
        <img 
          src="/login_banner.png" 
          alt="Analytix Banner" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
      </div>

      {/* Right side: Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white relative overflow-hidden">
        {/* Decorative dot pattern in top right */}
        <div className="absolute top-6 right-6 h-36 w-36 opacity-35 pointer-events-none z-0 text-zinc-300">
          <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dot-pattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-pattern)" />
          </svg>
        </div>
        
        {/* Bottom right decorative yellow curve matching mockup */}
        <div className="absolute bottom-0 right-0 h-48 w-48 lg:h-64 lg:w-64 bg-primary rounded-tl-full opacity-100 pointer-events-none z-0 translate-x-8 translate-y-8" />
        
        <div className="w-full max-w-[400px] animate-fade-in-up z-10 flex flex-col gap-6">
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center">
            <img 
              src="/Analytix_logo.png" 
              alt="Analytix Logo" 
              className="h-20 w-20 object-contain rounded-2xl" 
            />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-900">
              Analytix <span className="text-primary font-black">BI</span>
            </h1>
            <p className="mt-1 text-xs text-muted-foreground font-semibold">
              Enterprise Intelligence & Data Analytics Platform
            </p>
          </div>

          {/* Form Card wrapper */}
          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white p-8 shadow-2xl shadow-zinc-200/50">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
