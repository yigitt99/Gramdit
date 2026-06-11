import { LiquidButton } from '@/components/ui/liquid-glass-button';

export default function HomePage() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden min-h-screen">
      <div className="relative border border-[#27272a] p-2 w-full mx-auto max-w-3xl">
        <main className="relative border border-[#27272a] py-10 overflow-hidden">
          <h1 className="mb-3 text-white text-center text-7xl font-extrabold tracking-tighter md:text-[clamp(2rem,8vw,7rem)]">
            Welcome to Gramdit
          </h1>
          <p className="text-white/60 px-6 text-center text-xs md:text-sm lg:text-lg">
            Premium Grammar & Language Assistant - Powered by AI
          </p>
          <div className="my-8 flex items-center justify-center gap-1">
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-400"></span>
            </span>
            <p className="text-xs text-zinc-400">Ready for Premium Grammar Checking</p>
          </div>
          <div className="flex justify-center gap-4">
            <LiquidButton className="text-white border rounded-full" size="xl">
              Get Started
            </LiquidButton>
            <LiquidButton className="text-white/80 border border-white/20 rounded-full" size="xl" variant="ghost">
              Learn More
            </LiquidButton>
          </div>
        </main>
      </div>
    </div>
  );
}
