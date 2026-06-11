import { cn } from "@/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, Children } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowRight, Mail, Lock, Eye, EyeOff, X, AlertCircle, PartyPopper, Loader, User, FileText, ImageIcon, CheckCircle2, Camera } from "lucide-react";
import { AnimatePresence, motion, useInView, Variants, Transition } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useStore from "@/store";
import AuthService from "@/services/auth.service";
import UserService from "@/services/user.service";

// --- CONFETTI LOGIC ---
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti"
import confetti from "canvas-confetti"

type Api = { fire: (options?: ConfettiOptions) => void }
export type ConfettiRef = Api | null

const Confetti = forwardRef<ConfettiRef, React.ComponentPropsWithRef<"canvas"> & { options?: ConfettiOptions; globalOptions?: ConfettiGlobalOptions; manualstart?: boolean }>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)
  const canvasRef = useCallback((node: HTMLCanvasElement) => {
    if (node !== null) {
      if (instanceRef.current) return
      instanceRef.current = confetti.create(node, { ...globalOptions, resize: true })
    } else {
      if (instanceRef.current) {
        instanceRef.current.reset()
        instanceRef.current = null
      }
    }
  }, [globalOptions])
  const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options])
  const api = useMemo(() => ({ fire }), [fire])
  useImperativeHandle(ref, () => api, [api])
  useEffect(() => { if (!manualstart) fire() }, [manualstart, fire])
  return <canvas ref={canvasRef} {...rest} />
})
Confetti.displayName = "Confetti";

// --- TEXT LOOP ANIMATION COMPONENT ---
type TextLoopProps = { children: React.ReactNode[]; className?: string; interval?: number; transition?: Transition; variants?: Variants; onIndexChange?: (index: number) => void; stopOnEnd?: boolean; };
export function TextLoop({ children, className, interval = 2, transition = { duration: 0.3 }, variants, onIndexChange, stopOnEnd = false }: TextLoopProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Children.toArray(children);
  useEffect(() => {
    const intervalMs = interval * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((current) => {
        if (stopOnEnd && current === items.length - 1) {
          clearInterval(timer);
          return current;
        }
        const next = (current + 1) % items.length;
        onIndexChange?.(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [items.length, interval, onIndexChange, stopOnEnd]);
  const motionVariants: Variants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };
  return (
    <div className={cn('relative inline-block whitespace-nowrap', className)}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.div key={currentIndex} initial='initial' animate='animate' exit='exit' transition={transition} variants={variants || motionVariants}>
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- BUILT-IN BLUR FADE ANIMATION COMPONENT ---
interface BlurFadeProps { children: React.ReactNode; className?: string; variant?: { hidden: { y: number }; visible: { y: number } }; duration?: number; delay?: number; yOffset?: number; inView?: boolean; inViewMargin?: string; blur?: string; }
function BlurFade({ children, className, variant, duration = 0.4, delay = 0, yOffset = 6, inView = true, inViewMargin = "-50px", blur = "6px" }: BlurFadeProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin as any });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: yOffset, opacity: 0, filter: `blur(${blur})` },
    visible: { y: -yOffset, opacity: 1, filter: `blur(0px)` },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <motion.div ref={ref} initial="hidden" animate={isInView ? "visible" : "hidden"} exit="hidden" variants={combinedVariants} transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }} className={className}>
      {children}
    </motion.div>
  );
}

// --- BUILT-IN GLASS BUTTON COMPONENT ---
const glassButtonVariants = cva("relative isolate all-unset cursor-pointer rounded-full transition-all", { variants: { size: { default: "text-base font-medium", sm: "text-sm font-medium", lg: "text-lg font-medium", icon: "h-10 w-10" } }, defaultVariants: { size: "default" } });
const glassButtonTextVariants = cva("glass-button-text relative block select-none tracking-tighter", { variants: { size: { default: "px-6 py-3.5", sm: "px-4 py-2", lg: "px-8 py-4", icon: "flex h-10 w-10 items-center justify-center" } }, defaultVariants: { size: "default" } });
export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof glassButtonVariants> { contentClassName?: string; }
const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, onClick, ...props }, ref) => {
    const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const button = e.currentTarget.querySelector('button');
      if (button && e.target !== button) button.click();
    };
    return (
      <div className={cn("glass-button-wrap cursor-pointer rounded-full relative", className)} onClick={handleWrapperClick}>
        <button className={cn("glass-button relative z-10 w-full", glassButtonVariants({ size }))} ref={ref} onClick={onClick} {...props}>
          <span className={cn("w-full", glassButtonTextVariants({ size }), contentClassName)}>{children}</span>
        </button>
        <div className="glass-button-shadow rounded-full pointer-events-none"></div>
      </div>
    );
  }
);
GlassButton.displayName = "GlassButton";

// --- GRADIENT BACKGROUND ---
const GradientBackground = () => (
    <>
        <style>
            {` 
            @keyframes floatYellow { 
              0% { transform: translate(0, 0) scale(1); } 
              50% { transform: translate(-20px, 10px) scale(1.05); } 
              100% { transform: translate(0, 0) scale(1); } 
            } 
            @keyframes floatPurple { 
              0% { transform: translate(0, 0) scale(1); } 
              50% { transform: translate(15px, -15px) scale(0.95); } 
              100% { transform: translate(0, 0) scale(1); } 
            } 
            @keyframes floatRed { 
              0% { transform: translate(0, 0); } 
              50% { transform: translate(10px, 20px); } 
              100% { transform: translate(0, 0); } 
            }
            `}
        </style>
        <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" className="absolute top-0 left-0 w-full h-full">
            <defs>
                {/* Yellow glow bottom-left */}
                <radialGradient id="glow_yellow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#d9a05b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#d9a05b" stopOpacity="0" />
                </radialGradient>
                {/* Purple/Pink glow top-right */}
                <radialGradient id="glow_purple" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>
                {/* Red glow bottom-right */}
                <radialGradient id="glow_red" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                </radialGradient>
                <filter id="blur_filter" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="60"/>
                </filter>
            </defs>
            {/* Base dark/black layer */}
            <rect width="800" height="600" fill="#09090b" />
            
            {/* Animated Glow Elements */}
            <g filter="url(#blur_filter)">
                {/* Yellow glow in the bottom-left */}
                <circle cx="100" cy="550" r="350" fill="url(#glow_yellow)" style={{ animation: 'floatYellow 22s ease-in-out infinite' }} />
                
                {/* Purple/Pink glow in the top-right */}
                <circle cx="700" cy="80" r="380" fill="url(#glow_purple)" style={{ animation: 'floatPurple 25s ease-in-out infinite' }} />
                
                {/* Red glow in the bottom-right */}
                <circle cx="720" cy="520" r="300" fill="url(#glow_red)" style={{ animation: 'floatRed 20s ease-in-out infinite' }} />
            </g>
        </svg>
    </>
);

// --- SOCIAL ICONS ---
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6"> <g fillRule="evenodd" fill="none"> <g fillRule="nonzero" transform="translate(3, 2)"> <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path> <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path> <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path> <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path> </g> </g></svg> );
const AppleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-1.01 2.95 1.07.08 2.18-.53 2.84-1.34Z" />
  </svg>
);

const TEXT_LOOP_INTERVAL = 1.5;

// --- OTP INPUT COMPONENT ---
interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: () => void;
}
const OtpInput = ({ value, onChange, onComplete }: OtpInputProps) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digit = val.slice(-1).replace(/\D/g, '');
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newVal = newDigits.join('').trimEnd();
    
    onChange(newVal);

    if (digit && index < 5) {
      setTimeout(() => inputsRef.current[index + 1]?.focus(), 0);
    }
    
    if (newVal.length === 6) {
      onComplete?.();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        const newVal = newDigits.join('').trimEnd();
        onChange(newVal);
        setTimeout(() => inputsRef.current[index - 1]?.focus(), 0);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedClean = pastedData.replace(/\D/g, '').slice(0, 6);
    if (pastedClean) {
      onChange(pastedClean);
      const nextFocusIndex = Math.min(pastedClean.length, 5);
      setTimeout(() => inputsRef.current[nextFocusIndex]?.focus(), 0);
      if (pastedClean.length === 6) {
        onComplete?.();
      }
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={`otp-input-${i}`} className="glass-input-wrap">
          <div className="glass-input" style={{ width: '44px', height: '52px', borderRadius: '12px', justifyContent: 'center' }}>
            <span className="glass-input-text-area" style={{ borderRadius: '12px' }}></span>
            <input
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digits[i]?.trim() || ''}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className="relative z-10 w-full h-full bg-transparent text-foreground text-center text-xl font-bold focus:outline-none caret-transparent"
              style={{ borderRadius: '12px' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// --- PROFILE SETUP MODAL ---
interface ProfileSetupModalProps {
  user: { id: string; username: string; email: string; fullName: string | null; avatarUrl: string | null };
  accessToken: string;
  onDone: (updatedUser?: any) => void;
}
const ProfileSetupModal = ({ user, onDone }: ProfileSetupModalProps) => {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarLetter = (fullName || user.username || user.email).charAt(0).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu en fazla 5MB olabilir.');
      return;
    }

    setUploadingFile(true);
    setError('');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await UserService.uploadAvatar(formData);
      setAvatarUrl(res.avatarUrl);
    } catch (err: any) {
      setError(err.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await UserService.updateProfile({
        fullName: fullName || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      onDone(updated);
    } catch (err: any) {
      setError(err.message || 'Profil kaydedilemedi.');
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="relative bg-card/85 border-4 border-border rounded-2xl p-6 w-[328px] flex flex-col items-center gap-6 shadow-2xl backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <p className="font-serif font-light text-3xl tracking-tight text-foreground whitespace-nowrap">
            Profilini Oluştur
          </p>
          <p className="text-xs font-medium text-muted-foreground">
            Hesabını kişiselleştir
          </p>
        </div>

        {/* Avatar Area */}
        <div className="flex flex-col items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          
          <div 
            onClick={() => uploadMode === 'file' && fileInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full cursor-pointer overflow-hidden border border-foreground/15 hover:border-primary/50 transition-all flex items-center justify-center group"
          >
            {uploadingFile && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-10">
                <Loader className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
            
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-3xl font-light text-foreground/80 bg-foreground/[0.04]"
              >
                {avatarLetter}
              </div>
            )}

            {uploadMode === 'file' && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                <Camera className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="w-full flex flex-col gap-4">
          {/* Full Name */}
          <div className="glass-input-wrap w-full">
            <div className="glass-input">
              <span className="glass-input-text-area"></span>
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                <User className="h-5 w-5 text-foreground/80 flex-shrink-0" />
              </div>
              <input
                type="text"
                placeholder="Ad Soyad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none pr-2 text-sm"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="glass-input-wrap w-full" style={{ borderRadius: '16px' }}>
            <div className="glass-input" style={{ borderRadius: '16px', height: 'auto', alignItems: 'flex-start', paddingTop: '10px', paddingBottom: '10px' }}>
              <span className="glass-input-text-area" style={{ borderRadius: '16px' }}></span>
              <div className="relative z-10 flex-shrink-0 flex items-start justify-center w-10 pl-2 pt-0.5">
                <FileText className="h-5 w-5 text-foreground/80 flex-shrink-0" />
              </div>
              <textarea
                placeholder="Biyografi (Kendinden bahset)"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 150))}
                rows={2}
                className="relative z-10 w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none text-sm resize-none pr-2"
              />
            </div>
          </div>

          {/* Conditional Avatar Input */}
          {uploadMode === 'file' ? (
            <div className="flex flex-col gap-1.5">
              <div 
                onClick={() => !uploadingFile && fileInputRef.current?.click()}
                className="glass-input-wrap w-full cursor-pointer"
              >
                <div className="glass-input justify-center gap-2">
                  <span className="glass-input-text-area"></span>
                  {uploadingFile ? (
                    <Loader className="relative z-10 w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <Camera className="relative z-10 w-4 h-4 text-foreground/75" />
                  )}
                  <span className="relative z-10 text-sm text-foreground/85 font-semibold">
                    {uploadingFile ? 'Yükleniyor...' : 'Bilgisayardan Fotoğraf Seç'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Görsel URL'si kullan
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="glass-input-wrap w-full">
                <div className="glass-input">
                  <span className="glass-input-text-area"></span>
                  <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                    <ImageIcon className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                  </div>
                  <input
                    type="url"
                    placeholder="Profil Resmi URL'si"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none pr-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Bilgisayardan fotoğraf yükle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-xs text-center justify-center max-w-full">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col items-center gap-4">
          <GlassButton
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingFile}
            className="w-[160px]"
            contentClassName="flex items-center justify-center gap-2 font-semibold text-foreground text-center"
          >
            <span>Kaydet</span>
            {saving ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </GlassButton>

          <button
            type="button"
            onClick={() => onDone()}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Şimdilik Atla
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
export const AuthComponent = () => {
  const navigate = useNavigate();
  const loginSuccess = useStore((state) => state.loginSuccess);
  const setState = useStore((state) => state.setState);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "password" | "otp">("email");
  const [modalStatus, setModalStatus] = useState<'closed' | 'loading' | 'error' | 'success' | 'otp'>('closed');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [isLoaderFadingOut, setIsLoaderFadingOut] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [registeredToken, setRegisteredToken] = useState<string>('');
  const confettiRef = useRef<ConfettiRef>(null);
  const isSubmittingRef = useRef(false);

  const openOAuthPopup = (url: string) => {
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      url,
      'oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );
    
    if (popup) {
      popup.focus();
    }
  };

  const handleGoogleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    openOAuthPopup(`${apiBaseUrl}/auth/google`);
  };

  const handleAppleLogin = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
    openOAuthPopup(`${apiBaseUrl}/auth/apple`);
  };

  // Listen for login details from the popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: only accept messages from the same origin
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'OAUTH_SUCCESS') {
        const { token, refreshToken, user, isNewUser } = event.data;
        try {
          loginSuccess(user, token, refreshToken);
          fireSideCanons();

          if (isNewUser) {
            setRegisteredUser(user);
            setRegisteredToken(token);
            setIsSignUp(true);
            setModalStatus('success');
          } else {
            setModalStatus('success');
            setTimeout(() => {
              setModalStatus('closed');
              navigate('/');
            }, 1500);
          }
        } catch (e) {
          console.error('Failed to complete login from OAuth popup:', e);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, loginSuccess]);

  // If this window itself is the popup, parse params, message the parent, and close.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const userRaw = params.get('user');
    const isNewUser = params.get('isNewUser') === 'true';

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        
        if (window.opener && window.opener !== window) {
          window.opener.postMessage(
            { type: 'OAUTH_SUCCESS', token, refreshToken, user, isNewUser },
            window.location.origin
          );
          window.close();
          return;
        }

        // Fallback for direct redirect (non-popup)
        loginSuccess(user, token, refreshToken || '');
        fireSideCanons();
        window.history.replaceState({}, document.title, window.location.pathname);
        
        if (isNewUser) {
          setRegisteredUser(user);
          setRegisteredToken(token);
          setIsSignUp(true);
          setModalStatus('success');
        } else {
          setModalStatus('success');
          setTimeout(() => {
            setModalStatus('closed');
            navigate('/');
          }, 1500);
        }
      } catch (e) {
        console.error('Failed to parse OAuth user payload:', e);
      }
    }
  }, [navigate, loginSuccess]);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password.length >= 6;
  const isConfirmPasswordValid = confirmPassword.length >= 6;
  const passwordsMatch = password === confirmPassword;

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const fireSideCanons = () => {
    const fire = confettiRef.current?.fire;
    if (fire) {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      const particleCount = 50;
      fire({ ...defaults, particleCount, origin: { x: 0, y: 1 }, angle: 60 });
      fire({ ...defaults, particleCount, origin: { x: 1, y: 1 }, angle: 120 });
    }
  };

  const handleSendOtp = async () => {
    if (!isEmailValid || !isPasswordValid || isSubmittingRef.current) return;
    if (!passwordsMatch) {
      setModalErrorMessage("Şifreler uyuşmuyor!");
      setModalStatus('error');
      return;
    }
    isSubmittingRef.current = true;
    setIsLoaderFadingOut(false);
    setModalStatus('loading');
    try {
      await AuthService.sendOtp(email, password);
      // Let the loader fade out first
      setIsLoaderFadingOut(true);
      // After it fades out (250ms), change state to OTP to expand the card
      setTimeout(() => {
        setModalStatus('otp');
        setAuthStep('otp');
        isSubmittingRef.current = false;
      }, 250);
    } catch (err: any) {
      setModalErrorMessage(err.message || 'E-posta gönderilemedi. Lütfen tekrar deneyin.');
      setModalStatus('error');
      isSubmittingRef.current = false;
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6 || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setModalStatus('loading');
    try {
      const response = await AuthService.verifyOtp(email, otpCode);
      setRegisteredUser(response.user);
      setRegisteredToken(response.accessToken);
      loginSuccess(response.user, response.accessToken, response.refreshToken);
      setModalStatus('success');
      fireSideCanons();
      isSubmittingRef.current = false;
    } catch (err: any) {
      setModalErrorMessage(err.message || 'Kod yanlış veya süresi dolmuş. Lütfen tekrar deneyin.');
      setModalStatus('error');
      isSubmittingRef.current = false;
    }
  };

  const handleLoginSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setModalStatus('loading');
    try {
      const response = await AuthService.login({ email, password });
      const loadingStepsCount = signInSteps.length - 1;
      const totalDuration = loadingStepsCount * TEXT_LOOP_INTERVAL * 1000;
      setTimeout(() => {
        loginSuccess(response.user, response.accessToken, response.refreshToken);
        fireSideCanons();
        setModalStatus('success');
        setTimeout(() => {
          navigate('/');
          isSubmittingRef.current = false;
        }, 1500);
      }, totalDuration);
    } catch (err: any) {

      setModalErrorMessage(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      setModalStatus('error');
      isSubmittingRef.current = false;
    }
  };

  const handleLoginKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isEmailValid && isPasswordValid) {
      e.preventDefault();
      handleLoginSubmit();
    }
  };

  const closeModal = () => {
    setModalStatus('closed');
    setModalErrorMessage('');
    setIsLoaderFadingOut(false);
    if (authStep === 'otp') {
      setAuthStep('email');
    }
    setOtpCode('');
    isSubmittingRef.current = false;
  };

  useEffect(() => {
    if (authStep === 'password') setTimeout(() => passwordInputRef.current?.focus(), 500);
    if (authStep === 'otp') setOtpCode('');
  }, [authStep]);

  useEffect(() => {
    if (modalStatus === 'success') fireSideCanons();
  }, [modalStatus]);

  const signUpLoadingSteps = [
    { message: "Gönderiliyor...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
    { message: "Onaylanıyor...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
  ];

  const signInSteps = [
    { message: "Giriş yapılıyor...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
    { message: "Bilgiler doğrulanıyor...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
    { message: "Hazırlanıyor...", icon: <Loader className="w-12 h-12 text-primary animate-spin" /> },
    { message: "Hoş Geldin!", icon: <PartyPopper className="w-12 h-12 text-green-500" /> },
  ];

  const activeSteps = isSignUp ? signUpLoadingSteps : signInSteps;

  const handleProfileSetupDone = (updatedUser?: any) => {
    if (updatedUser) {
      setState({ user: { ...registeredUser, ...updatedUser } });
      localStorage.setItem('gramdit_user', JSON.stringify({ ...registeredUser, ...updatedUser }));
    }
    setShowProfileSetup(false);
    navigate('/');
  };

  const getModalDimensions = () => {
    switch (modalStatus) {
      case 'otp':
        return { width: 400, height: 380 };
      case 'error':
        return { width: 320, height: 260 };
      case 'success':
        return isSignUp ? { width: 350, height: 280 } : { width: 320, height: 260 };
      case 'loading':
      default:
        return { width: 300, height: 200 };
    }
  };

  const modalSize = getModalDimensions();

  return (
    <div className="bg-background min-h-screen w-screen flex flex-col">
      <style>{`
        input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none !important; } input[type="password"]::-webkit-credentials-auto-fill-button, input[type="password"]::-webkit-strong-password-auto-fill-button { display: none !important; } input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active { -webkit-box-shadow: 0 0 0 30px transparent inset !important; -webkit-text-fill-color: var(--foreground) !important; background-color: transparent !important; background-clip: content-box !important; transition: background-color 5000s ease-in-out 0s !important; color: var(--foreground) !important; caret-color: var(--foreground) !important; } input:autofill { background-color: transparent !important; background-clip: content-box !important; -webkit-text-fill-color: var(--foreground) !important; color: var(--foreground) !important; } input:-internal-autofill-selected { background-color: transparent !important; background-image: none !important; color: var(--foreground) !important; -webkit-text-fill-color: var(--foreground) !important; } input:-webkit-autofill::first-line { color: var(--foreground) !important; -webkit-text-fill-color: var(--foreground) !important; }
        @property --angle-1 { syntax: "<angle>"; inherits: false; initial-value: -75deg; } @property --angle-2 { syntax: "<angle>"; inherits: false; initial-value: -45deg; }
        .glass-button-wrap { --anim-time: 400ms; --anim-ease: cubic-bezier(0.25, 1, 0.5, 1); --border-width: clamp(1px, 0.0625em, 4px); position: relative; z-index: 2; transform-style: preserve-3d; transition: transform var(--anim-time) var(--anim-ease); } .glass-button-wrap:has(.glass-button:active) { transform: rotateX(25deg); } .glass-button-shadow { --shadow-cutoff-fix: 2em; position: absolute; width: calc(100% + var(--shadow-cutoff-fix)); height: calc(100% + var(--shadow-cutoff-fix)); top: calc(0% - var(--shadow-cutoff-fix) / 2); left: calc(0% - var(--shadow-cutoff-fix) / 2); filter: blur(clamp(2px, 0.125em, 12px)); transition: filter var(--anim-time) var(--anim-ease); pointer-events: none; z-index: 0; } .glass-button-shadow::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; background: linear-gradient(180deg, oklch(from var(--foreground) l c h / 20%), oklch(from var(--foreground) l c h / 10%)); width: calc(100% - var(--shadow-cutoff-fix) - 0.25em); height: calc(100% - var(--shadow-cutoff-fix) - 0.25em); top: calc(var(--shadow-cutoff-fix) - 0.5em); left: calc(var(--shadow-cutoff-fix) - 0.875em); padding: 0.125em; box-sizing: border-box; mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease); opacity: 1; }
        .glass-button { -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all var(--anim-time) var(--anim-ease); background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%), 0 0 0 0 oklch(from var(--background) l c h); } .glass-button:hover { transform: scale(0.975); backdrop-filter: blur(0.01em); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.15em 0.05em -0.1em oklch(from var(--foreground) l c h / 25%), 0 0 0.05em 0.1em inset oklch(from var(--background) l c h / 50%), 0 0 0 0 oklch(from var(--background) l c h); } .glass-button-text { color: oklch(from var(--foreground) l c h / 90%); text-shadow: 0em 0.25em 0.05em oklch(from var(--foreground) l c h / 10%); transition: all var(--anim-time) var(--anim-ease); } .glass-button:hover .glass-button-text { text-shadow: 0.025em 0.025em 0.025em oklch(from var(--foreground) l c h / 12%); } .glass-button-text::after { content: ""; display: block; position: absolute; width: calc(100% - var(--border-width)); height: calc(100% - var(--border-width)); top: calc(0% + var(--border-width) / 2); left: calc(0% + var(--border-width) / 2); box-sizing: border-box; border-radius: 9999px; overflow: clip; background: linear-gradient(var(--angle-2), transparent 0%, oklch(from var(--background) l c h / 50%) 40% 50%, transparent 55%); z-index: 3; mix-blend-mode: screen; pointer-events: none; background-size: 200% 200%; background-position: 0% 50%; transition: background-position calc(var(--anim-time) * 1.25) var(--anim-ease), --angle-2 calc(var(--anim-time) * 1.25) var(--anim-ease); } .glass-button:hover .glass-button-text::after { background-position: 25% 50%; } .glass-button:active .glass-button-text::after { background-position: 50% 15%; --angle-2: -15deg; } .glass-button::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; width: calc(100% + var(--border-width)); height: calc(100% + var(--border-width)); top: calc(0% - var(--border-width) / 2); left: calc(0% - var(--border-width) / 2); padding: var(--border-width); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, oklch(from var(--foreground) l c h / 50%) 0%, transparent 5% 40%, oklch(from var(--foreground) l c h / 50%) 50%, transparent 60% 95%, oklch(from var(--foreground) l c h / 50%) 100%), linear-gradient(180deg, oklch(from var(--background) l c h / 50%), oklch(from var(--background) l c h / 50%)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all var(--anim-time) var(--anim-ease), --angle-1 500ms ease; box-shadow: inset 0 0 0 calc(var(--border-width) / 2) oklch(from var(--background) l c h / 50%); pointer-events: none; } .glass-button:hover::after { --angle-1: -125deg; } .glass-button:active::after { --angle-1: -75deg; } .glass-button-wrap:has(.glass-button:hover) .glass-button-shadow { filter: blur(clamp(2px, 0.0625em, 6px)); } .glass-button-wrap:has(.glass-button:hover) .glass-button-shadow::after { top: calc(var(--shadow-cutoff-fix) - 0.875em); opacity: 1; } .glass-button-wrap:has(.glass-button:active) .glass-button-shadow { filter: blur(clamp(2px, 0.125em, 12px)); } .glass-button-wrap:has(.glass-button:active) .glass-button-shadow::after { top: calc(var(--shadow-cutoff-fix) - 0.5em); opacity: 0.75; } .glass-button-wrap:has(.glass-button:active) .glass-button-text { text-shadow: 0.025em 0.25em 0.05em oklch(from var(--foreground) l c h / 12%); } .glass-button-wrap:has(.glass-button:active) .glass-button { box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.125em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%), 0 0.225em 0.05em 0 oklch(from var(--foreground) l c h / 5%), 0 0.25em 0 0 oklch(from var(--background) l c h / 75%), inset 0 0.25em 0.05em 0 oklch(from var(--foreground) l c h / 15%); } @media (hover: none) and (pointer: coarse) { .glass-button::after, .glass-button:hover::after, .glass-button:active::after { --angle-1: -75deg; } .glass-button .glass-button-text::after, .glass-button:active .glass-button-text::after { --angle-2: -45deg; } }
        .glass-input-wrap { position: relative; z-index: 2; transform-style: preserve-3d; border-radius: 9999px; } .glass-input { display: flex; position: relative; width: 100%; height: 3rem; align-items: center; gap: 0.5rem; border-radius: 9999px; padding: 0.25rem; -webkit-tap-highlight-color: transparent; backdrop-filter: blur(clamp(1px, 0.125em, 4px)); transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1); background: linear-gradient(-75deg, oklch(from var(--background) l c h / 5%), oklch(from var(--background) l c h / 20%), oklch(from var(--background) l c h / 5%)); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.25em 0.125em -0.125em oklch(from var(--foreground) l c h / 20%), 0 0 0.1em 0.25em inset oklch(from var(--background) l c h / 20%), 0 0 0 0 oklch(from var(--background) l c h); } .glass-input-wrap:focus-within .glass-input { backdrop-filter: blur(0.01em); box-shadow: inset 0 0.125em 0.125em oklch(from var(--foreground) l c h / 5%), inset 0 -0.125em 0.125em oklch(from var(--background) l c h / 50%), 0 0.15em 0.05em -0.1em oklch(from var(--foreground) l c h / 25%), 0 0 0.05em 0.1em inset oklch(from var(--background) l c h / 50%), 0 0 0 0 oklch(from var(--background) l c h); } .glass-input::after { content: ""; position: absolute; z-index: 1; inset: 0; border-radius: 9999px; width: calc(100% + clamp(1px, 0.0625em, 4px)); height: calc(100% + clamp(1px, 0.0625em, 4px)); top: calc(0% - clamp(1px, 0.0625em, 4px) / 2); left: calc(0% - clamp(1px, 0.0625em, 4px) / 2); padding: clamp(1px, 0.0625em, 4px); box-sizing: border-box; background: conic-gradient(from var(--angle-1) at 50% 50%, oklch(from var(--foreground) l c h / 50%) 0%, transparent 5% 40%, oklch(from var(--foreground) l c h / 50%) 50%, transparent 60% 95%, oklch(from var(--foreground) l c h / 50%) 100%), linear-gradient(180deg, oklch(from var(--background) l c h / 50%), oklch(from var(--background) l c h / 50%)); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1), --angle-1 500ms ease; box-shadow: inset 0 0 0 calc(clamp(1px, 0.0625em, 4px) / 2) oklch(from var(--background) l c h / 50%); pointer-events: none; } .glass-input-wrap:focus-within .glass-input::after { --angle-1: -125deg; } .glass-input-text-area { position: absolute; inset: 0; border-radius: 9999px; pointer-events: none; } .glass-input-text-area::after { content: ""; display: block; position: absolute; width: calc(100% - clamp(1px, 0.0625em, 4px)); height: calc(100% - clamp(1px, 0.0625em, 4px)); top: calc(0% + clamp(1px, 0.0625em, 4px) / 2); left: calc(0% + clamp(1px, 0.0625em, 4px) / 2); box-sizing: border-box; border-radius: 9999px; overflow: clip; background: linear-gradient(var(--angle-2), transparent 0%, oklch(from var(--background) l c h / 50%) 40% 50%, transparent 55%); z-index: 3; mix-blend-mode: screen; pointer-events: none; background-size: 200% 200%; background-position: 0% 50%; transition: background-position calc(400ms * 1.25) cubic-bezier(0.25, 1, 0.5, 1), --angle-2 calc(400ms * 1.25) cubic-bezier(0.25, 1, 0.5, 1); } .glass-input-wrap:focus-within .glass-input-text-area::after { background-position: 25% 50%; }
        .otp-digit-input { outline: none !important; border: none !important; }
        
        /* Profile Setup Modal custom premium styles */
        .glass-card {
          backdrop-filter: blur(16px);
          background: linear-gradient(135deg, oklch(from var(--background) l c h / 30%), oklch(from var(--background) l c h / 55%));
          border: 1px solid oklch(from var(--foreground) l c h / 15%);
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5), 
            inset 0 1px 1px oklch(from var(--foreground) l c h / 20%);
        }
        .profile-avatar-wrap {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.3s ease;
          border: 2px solid oklch(from var(--foreground) l c h / 20%);
        }
        .profile-avatar-wrap:hover {
          transform: scale(1.05);
          border-color: oklch(from var(--primary) l c h / 60%);
        }
        .profile-avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.25s cubic-bezier(0.25, 1, 0.5, 1);
          backdrop-filter: blur(2px);
        }
        .profile-avatar-wrap:hover .profile-avatar-overlay {
          opacity: 1;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 2;
        }
      `}</style>

      <Confetti ref={confettiRef} manualstart className="fixed top-0 left-0 w-full h-full pointer-events-none z-[999]" />
      
      {/* Unified Morphing Modal */}
      <AnimatePresence>
        {modalStatus !== 'closed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, width: 300, height: 200 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                width: modalSize.width,
                height: modalSize.height,
                padding: modalStatus === 'otp' ? 32 : 24
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ 
                width: { type: "spring", stiffness: 220, damping: 26 },
                height: { type: "spring", stiffness: 220, damping: 26 },
                padding: { type: "spring", stiffness: 220, damping: 26 },
                default: { duration: 0.25 }
              }}
              className="relative bg-card/85 border-4 border-border rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Close Button */}
              {(modalStatus === 'otp' || modalStatus === 'error' || modalStatus === 'success') && (
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-foreground/5 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* LOADER CONTENT */}
              <motion.div
                animate={{ 
                  opacity: (modalStatus === 'loading' && !isLoaderFadingOut) ? 1 : 0,
                  scale: (modalStatus === 'loading' && !isLoaderFadingOut) ? 1 : 0.9,
                  filter: (modalStatus === 'loading' && !isLoaderFadingOut) ? "blur(0px)" : "blur(4px)"
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center p-6 w-full h-full",
                  (modalStatus === 'loading' && !isLoaderFadingOut) ? "pointer-events-auto" : "pointer-events-none"
                )}
              >
                <TextLoop interval={TEXT_LOOP_INTERVAL} stopOnEnd={true}>
                  {activeSteps.slice(0, -1).map((step, i) =>
                    <div key={i} className="flex flex-col items-center gap-4">
                      {step.icon}
                      <p className="text-lg font-medium text-foreground">{step.message}</p>
                    </div>
                  )}
                </TextLoop>
              </motion.div>

              {/* OTP CONTENT */}
              <motion.div
                animate={{ 
                  opacity: modalStatus === 'otp' ? 1 : 0,
                  y: modalStatus === 'otp' ? 0 : 20,
                }}
                transition={{ 
                  delay: modalStatus === 'otp' ? 0.25 : 0, 
                  duration: 0.35, 
                  ease: [0.34, 1.56, 0.64, 1] 
                }}
                className={cn(
                  "w-full flex flex-col items-center gap-6",
                  modalStatus === 'otp' ? "relative pointer-events-auto" : "absolute pointer-events-none"
                )}
              >
                {/* Header */}
                <div className="flex flex-col items-center text-center gap-2">
                  <p className="font-serif font-light text-3xl tracking-tight text-foreground whitespace-nowrap">
                    Check Email
                  </p>
                  <p className="text-xs font-medium text-muted-foreground max-w-[280px]">
                    We sent a 6-digit code to<br />
                    <span className="text-foreground font-semibold break-all">{email}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="w-full flex justify-center py-2">
                  <OtpInput value={otpCode} onChange={setOtpCode} onComplete={handleVerifyOtp} />
                </div>

                {/* Actions */}
                <div className="w-full flex flex-col items-center gap-4">
                  <GlassButton
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpCode.length < 6}
                    className="w-[180px]"
                    contentClassName="flex items-center justify-center gap-2 font-semibold text-foreground text-center"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Doğrula</span>
                  </GlassButton>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                  >
                    Kodu tekrar gönder
                  </button>
                </div>
              </motion.div>

              {/* ERROR CONTENT */}
              <AnimatePresence>
                {modalStatus === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-4 w-full"
                  >
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <p className="text-lg font-medium text-foreground text-center">{modalErrorMessage}</p>
                    <GlassButton onClick={closeModal} size="sm" className="mt-4">Tekrar Dene</GlassButton>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SUCCESS CONTENT */}
              <AnimatePresence>
                {modalStatus === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center gap-4 w-full justify-center px-4"
                  >
                    {isSignUp ? (
                      <>
                        <div className="relative mb-1">
                          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl scale-150 animate-pulse" />
                          <PartyPopper className="w-16 h-16 text-green-500 relative z-10" />
                        </div>
                        <p className="font-serif font-light text-3xl tracking-tight text-foreground text-center">
                          Kayıt Başarılı!
                        </p>
                        <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                          Hesabınız başarıyla oluşturuldu. Şimdi aramıza katılabilirsiniz.
                        </p>
                        <GlassButton
                          type="button"
                          onClick={() => {
                            closeModal();
                            navigate('/');
                          }}
                          className="w-[180px] mt-2"
                          contentClassName="flex items-center justify-center gap-2 font-semibold text-foreground text-center"
                        >
                          <span>Devam Et</span>
                          <ArrowRight className="w-4 h-4" />
                        </GlassButton>
                      </>
                    ) : (
                      <>
                        {activeSteps[activeSteps.length - 1].icon}
                        <p className="text-lg font-medium text-foreground">{activeSteps[activeSteps.length - 1].message}</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Setup Modal */}
      <AnimatePresence>
        {showProfileSetup && registeredUser && (
          <ProfileSetupModal
            user={registeredUser}
            accessToken={registeredToken}
            onDone={handleProfileSetupDone}
          />
        )}
      </AnimatePresence>

      <div className={cn("flex w-full flex-1 h-full min-h-screen items-center justify-center bg-card", "relative overflow-hidden")}>
        <div className="absolute inset-0 z-0"><GradientBackground /></div>
        <fieldset disabled={modalStatus !== 'closed' || showProfileSetup} className="relative z-10 flex flex-col items-center gap-8 w-[280px] mx-auto p-4">

          <AnimatePresence mode="wait">
            {/* ── LOGIN MODE ──────────────────────────────────────── */}
            {!isSignUp && (
              <motion.div key="login-header" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full flex flex-col items-center gap-4">
                <BlurFade delay={0.1} className="w-full">
                  <div className="text-center">
                    <p className="font-serif font-light text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground whitespace-nowrap">Welcome Back</p>
                  </div>
                </BlurFade>
                <BlurFade delay={0.2}>
                  <p className="text-sm font-medium text-muted-foreground">Continue with your account</p>
                </BlurFade>
                <BlurFade delay={0.3}>
                  <div className="flex items-center justify-center gap-4 w-full">
                    <GlassButton contentClassName="flex items-center justify-center gap-2" size="sm" onClick={handleGoogleLogin}><GoogleIcon /><span className="font-semibold text-foreground">Google</span></GlassButton>
                    <GlassButton contentClassName="flex items-center justify-center gap-2" size="sm" onClick={handleAppleLogin}><AppleIcon /><span className="font-semibold text-foreground">Apple</span></GlassButton>
                  </div>
                </BlurFade>
                <BlurFade delay={0.35} className="w-[300px]">
                  <div className="flex items-center w-full gap-2 py-2">
                    <hr className="w-full border-border"/>
                    <span className="text-xs font-semibold text-muted-foreground">OR</span>
                    <hr className="w-full border-border"/>
                  </div>
                </BlurFade>
              </motion.div>
            )}

            {/* ── SIGN-UP: EMAIL STEP ─────────────────────────────── */}
            {isSignUp && (authStep === 'email' || authStep === 'otp') && (
              <motion.div key="signup-email-header" initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full flex flex-col items-center text-center gap-4">
                <BlurFade delay={0.1} className="w-full">
                  <p className="font-serif font-light text-4xl sm:text-5xl tracking-tight text-foreground">Create Account</p>
                </BlurFade>
                <BlurFade delay={0.2}>
                  <p className="text-sm font-medium text-muted-foreground">Fill in your details to get started</p>
                </BlurFade>
                <BlurFade delay={0.3}>
                  <div className="flex items-center justify-center gap-4 w-full">
                    <GlassButton contentClassName="flex items-center justify-center gap-2" size="sm" onClick={handleGoogleLogin}><GoogleIcon /><span className="font-semibold text-foreground">Google</span></GlassButton>
                    <GlassButton contentClassName="flex items-center justify-center gap-2" size="sm" onClick={handleAppleLogin}><AppleIcon /><span className="font-semibold text-foreground">Apple</span></GlassButton>
                  </div>
                </BlurFade>
                <BlurFade delay={0.35} className="w-[300px]">
                  <div className="flex items-center w-full gap-2 py-2">
                    <hr className="w-full border-border"/>
                    <span className="text-xs font-semibold text-muted-foreground">OR</span>
                    <hr className="w-full border-border"/>
                  </div>
                </BlurFade>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── LOGIN FORM ──────────────────────────────────────────── */}
          {!isSignUp && (
            <form onSubmit={(e) => { e.preventDefault(); handleLoginSubmit(); }} className="w-[300px] space-y-5">
              <BlurFade delay={0.4} className="w-full">
                <div className="relative w-full">
                  <div className="glass-input-wrap w-full">
                    <div className="glass-input">
                      <span className="glass-input-text-area"></span>
                      <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                        <Mail className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                      </div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleLoginKeyDown}
                        className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none pr-2"
                      />
                    </div>
                  </div>
                </div>
              </BlurFade>
              <BlurFade delay={0.5} className="w-full">
                <div className="relative w-full">
                  <div className="glass-input-wrap w-full">
                    <div className="glass-input">
                      <span className="glass-input-text-area"></span>
                      <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                        {isPasswordValid
                          ? <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full">
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          : <Lock className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                        }
                      </div>
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleLoginKeyDown}
                        className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </BlurFade>
              <BlurFade delay={0.6}>
                <div className="pt-2 flex justify-center w-full">
                  <GlassButton
                    type="submit"
                    className="w-[160px]"
                    contentClassName="flex items-center justify-center gap-2 font-semibold text-foreground text-center"
                  >
                    <span>Giriş Yap</span>
                    <ArrowRight className="w-5 h-5" />
                  </GlassButton>
                </div>
              </BlurFade>
            </form>
          )}

          {/* ── SIGN-UP: EMAIL + PASSWORD FORM ─────────────────────── */}
          {isSignUp && (authStep === 'email' || authStep === 'otp') && (
            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="w-[300px] space-y-4">
              {/* Email */}
              <BlurFade delay={0.1} className="w-full">
                <div className="glass-input-wrap w-full">
                  <div className="glass-input">
                    <span className="glass-input-text-area"></span>
                    <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                      <Mail className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none pr-2"
                    />
                  </div>
                </div>
              </BlurFade>

              {/* Password */}
              <BlurFade delay={0.2} className="w-full">
                <div className="glass-input-wrap w-full">
                  <div className="glass-input">
                    <span className="glass-input-text-area"></span>
                    <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                      {isPasswordValid
                        ? <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        : <Lock className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                      }
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifre (min. 6 karakter)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none"
                    />
                  </div>
                </div>
              </BlurFade>

              {/* Confirm Password */}
              <BlurFade delay={0.3} className="w-full">
                <div className="relative">
                  <div className={cn("glass-input-wrap w-full transition-all", isConfirmPasswordValid && !passwordsMatch && "ring-1 ring-destructive rounded-full")}>
                    <div className="glass-input">
                      <span className="glass-input-text-area"></span>
                      <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                        {isConfirmPasswordValid
                          ? <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full">
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          : <Lock className="h-5 w-5 text-foreground/80 flex-shrink-0" />
                        }
                      </div>
                      <input
                        ref={confirmPasswordInputRef}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Şifreyi onayla"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="relative z-10 h-full w-0 flex-grow bg-transparent text-foreground placeholder:text-foreground/60 focus:outline-none"
                      />
                    </div>
                  </div>
                  <AnimatePresence>
                    {isConfirmPasswordValid && !passwordsMatch && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-destructive mt-1 ml-3">
                        Şifreler uyuşmuyor
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </BlurFade>

              {/* Submit */}
              <BlurFade delay={0.4}>
                <div className="pt-1 flex justify-center w-full">
                  <GlassButton
                    type="submit"
                    className="w-[200px]"
                    disabled={!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !passwordsMatch}
                    contentClassName="flex items-center justify-center gap-2 font-semibold text-foreground text-center"
                  >
                    <span>Kodu Gönder</span>
                    <ArrowRight className="w-5 h-5" />
                  </GlassButton>
                </div>
              </BlurFade>
            </form>
          )}

          {/* ── SWITCH MODE BUTTON ───────────────────────────────────── */}
          {(!isSignUp || authStep === 'email' || authStep === 'otp') && (
            <BlurFade delay={0.7}>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setAuthStep('email');
                  setOtpCode('');
                }}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
              >
                {isSignUp ? "Zaten hesabın var mı? Giriş yap" : "Hesabın yok mu? Kayıt ol"}
              </button>
            </BlurFade>
          )}

        </fieldset>
      </div>
    </div>
  );
};
