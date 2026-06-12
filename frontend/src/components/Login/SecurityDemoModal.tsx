import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Shield,
    Lock,
    Database,
    Key,
    Eye,
    Fingerprint,
    Zap,
    ArrowRight,
    ShieldCheck,
    Cpu,
    Globe
} from 'lucide-react';

const steps = [
    {
        icon: Fingerprint,
        title: "1. Data Admission",
        subtitle: "Input Phase",
        desc: "Your PII (e.g. Aadhaar, Credit Card) is entered into the system. Data is localized to your browser environment.",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        glow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]"
    },
    {
        icon: Zap,
        title: "2. Atomic Encryption",
        subtitle: "AES-256 Barrier",
        desc: "Instantly fragmented and sealed with military-grade AES-256-GCM. Plaintext never touches the disk.",
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
        glow: "shadow-[0_0_20px_rgba(250,204,21,0.3)]"
    },
    {
        icon: Database,
        title: "3. Vault Deposition",
        subtitle: "Hardened Storage",
        desc: "Encrypted blocks are dispatched to our redundant, zero-trust vault. Only your key can bridge the gap.",
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        glow: "shadow-[0_0_20px_rgba(192,132,252,0.3)]"
    },
    {
        icon: ShieldCheck,
        title: "4. MFA Verification",
        subtitle: "Access Gate",
        desc: "To retrieve, you must provide Multi-Factor proof. Our engine verifies your identity identity without seeing your data.",
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        glow: "shadow-[0_0_20px_rgba(52,211,153,0.3)]"
    },
    {
        icon: Eye,
        title: "5. Ephemeral Reveal",
        subtitle: "Just-In-Time Access",
        desc: "Data is decrypted temporarily in volatile memory. It disappears the moment your session ends.",
        color: "text-rose-400",
        bg: "bg-rose-400/10",
        glow: "shadow-[0_0_20px_rgba(251,113,133,0.3)]"
    }
];

export const SecurityDemoModal: React.FC = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (isPlaying) {
            interval = setInterval(() => {
                setActiveStep((prev) => (prev + 1) % steps.length);
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    return (
        <Dialog onOpenChange={(open) => setIsPlaying(open)}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                    <Shield className="w-4 h-4" />
                    How it Works? (Demo)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-background/95 backdrop-blur-2xl border-border/50 shadow-2xl p-0 overflow-hidden sm:rounded-[2.5rem]">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Left Panel: The Animation */}
                    <div className="p-12 bg-muted/30 flex flex-col justify-between border-r border-border/50 relative">
                        <div className="space-y-2">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                                Logic Visualization
                            </Badge>
                            <h2 className="text-3xl font-black tracking-tight">Zero-Trust Pipeline</h2>
                        </div>

                        {/* Animation Core */}
                        <div className="relative h-64 flex items-center justify-center">
                            {/* Connection Orbit */}
                            <div className="absolute inset-0 border-[1px] border-dashed border-border/30 rounded-full animate-spin-slow" />

                            {/* Steps Orbit */}
                            {steps.map((s, i) => {
                                const angle = (i * (360 / steps.length)) - 90;
                                const radius = 100;
                                const x = radius * Math.cos(angle * (Math.PI / 180));
                                const y = radius * Math.sin(angle * (Math.PI / 180));

                                const Icon = s.icon;
                                const isCurrent = activeStep === i;
                                const isPrevious = (activeStep === 0 && i === steps.length - 1) || (i < activeStep);

                                return (
                                    <div
                                        key={i}
                                        className="absolute transition-all duration-700 ease-in-out"
                                        style={{ transform: `translate(${x}px, ${y}px)` }}
                                    >
                                        <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                      ${isCurrent ? `${s.bg} ${s.color} ${s.glow} scale-125 border border-white/20` : 'bg-background border border-border/50 text-muted-foreground opacity-40'}
                      ${isPrevious && !isCurrent ? 'bg-primary/5 text-primary opacity-80' : ''}
                    `}>
                                            <Icon size={20} />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Central Core */}
                            <div className="relative w-24 h-24 rounded-full bg-background border-4 border-border/10 flex items-center justify-center shadow-inner z-10 overflow-hidden">
                                <div className={`absolute inset-0 ${steps[activeStep].bg} transition-colors duration-1000 opacity-20`} />
                                <Lock className={`w-10 h-10 transition-colors duration-500 ${steps[activeStep].color}`} />
                                {/* Scanning Light Effect */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-scan" style={{ color: steps[activeStep].color }} />
                            </div>
                        </div>

                        {/* Progress Indicators */}
                        <div className="flex gap-2 justify-center">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all duration-500 ${activeStep === i ? 'w-8 bg-primary' : 'w-2 bg-border'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: The Detail */}
                    <div className="p-12 space-y-8 flex flex-col justify-center">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-5 rounded-2xl ${steps[activeStep].bg}`}>
                                    {React.createElement(steps[activeStep].icon, { size: 36, className: steps[activeStep].color })}
                                </div>
                                <div>
                                    <p className={`text-xs font-black uppercase tracking-[0.3em] ${steps[activeStep].color} mb-1`}>
                                        {steps[activeStep].subtitle}
                                    </p>
                                    <h3 className="text-2xl font-black text-foreground">
                                        {steps[activeStep].title}
                                    </h3>
                                </div>
                            </div>

                            <div className="p-6 bg-muted/50 rounded-3xl border border-border/50 min-h-[140px] flex items-center relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${steps[activeStep].bg.replace('/10', '')}`} />
                                <p className="text-muted-foreground leading-relaxed font-medium">
                                    {steps[activeStep].desc}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="rounded-2xl py-6"
                                onClick={() => setActiveStep((prev) => (prev - 1 + steps.length) % steps.length)}
                            >
                                Previous
                            </Button>
                            <Button
                                className="rounded-2xl py-6"
                                onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
                            >
                                Next Step
                            </Button>
                        </div>

                        <p className="text-[10px] text-center text-muted-foreground/60 uppercase font-bold tracking-widest">
                            Automated Walkthrough • High Fidelity Logic
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

const Badge = ({ children, variant, className }: BadgeProps) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
        {children}
    </span>
);
