import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Left side: Banner Image (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[58%] shrink-0 relative bg-muted overflow-hidden items-center justify-center border-r border-border">
        <img 
          src="/login_banner.png" 
          alt="Analytix Banner" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
      </div>

      {/* Right side: Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-[-10%] right-[-10%] h-[350px] w-[350px] rounded-full bg-primary/10 blur-[80px]" />
        
        {/* Bottom right decorative curve */}
        <div className="absolute bottom-0 right-0 h-32 w-32 bg-primary rounded-tl-full opacity-90 pointer-events-none" />
        
        <div className="w-full max-w-[400px] animate-fade-in-up z-10">
          {/* Logo Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <img src="/Analytix_logo.png" alt="Analytix Logo" className="h-16 w-16 object-contain rounded-2xl shadow-md border border-border" />
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
              Analytix <span className="text-primary">BI</span>
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground font-medium">
              Enterprise Intelligence & Data Analytics Platform
            </p>
          </div>

          {/* Form wrapper */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-xl">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
