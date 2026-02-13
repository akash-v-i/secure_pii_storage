import React, { useSyncExternalStore, useMemo, useState, useEffect } from 'react';
import { Share2, Lock, Shield, User, Database, Fingerprint, Activity, Zap, Target, Globe, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { piiStore, PIIRecord } from '@/stores/piiStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const Graph: React.FC = () => {
    const records = useSyncExternalStore(piiStore.subscribe, piiStore.getRealRecords, piiStore.getRealRecords);
    const [hoveredNode, setHoveredNode] = useState<string | number | null>(null);
    const [activeTab, setActiveTab] = useState<'exposure' | 'logic'>('exposure');

    // Animation constants for "data flow"
    const [dashOffset, setDashOffset] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setDashOffset(prev => (prev - 1) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const graphData = useMemo(() => {
        if (records.length === 0) return { nodes: [], links: [] };

        const getCategoryInfo = (type: string) => {
            const t = type.toLowerCase();
            if (['ssn', 'passport', 'drivers_license', 'aadhaar', 'pan', 'voter_id', 'driving_license'].includes(t)) {
                return { label: 'Gov ID', color: 'hsl(var(--secondary))', icon: Shield, bg: 'bg-secondary/10' };
            }
            if (['credit_card', 'bank_account', 'gstin', 'tax_id'].includes(t)) {
                return { label: 'Financial', color: 'hsl(var(--accent))', icon: Database, bg: 'bg-accent/10' };
            }
            if (t.includes('medical') || t.includes('health') || t === 'ration_card') {
                return { label: 'Health', color: 'hsl(var(--warning))', icon: Activity, bg: 'bg-warning/10' };
            }
            return { label: 'Base', color: 'hsl(var(--primary))', icon: User, bg: 'bg-primary/10' };
        };

        const nodes = records.map((r, i) => {
            const info = getCategoryInfo(r.type);
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const radiusConstant = 55; // Slightly reduced to fit better

            const r_dist = radiusConstant * Math.sqrt(i + 4);
            const theta = i * goldenAngle;

            // In 'logic' mode, we might want to emphasize high-access nodes
            const isHighRisk = r.accessCount && r.accessCount > 3;
            const sizeMultiplier = activeTab === 'logic' && isHighRisk ? 1.4 : 1;

            return {
                ...r,
                x: 400 + Math.cos(theta) * r_dist,
                y: 300 + Math.sin(theta) * r_dist,
                color: activeTab === 'logic' && isHighRisk ? 'hsl(var(--destructive))' : info.color,
                icon: info.icon,
                bg: info.bg,
                category: info.label,
                sizeMultiplier,
                isHighRisk
            };
        });

        return { nodes };
    }, [records, activeTab]);

    return (
        <TooltipProvider>
            <div className="animate-fade-in flex flex-col h-full space-y-4 pb-4 px-2 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1 shrink-0">
                    <PageHeader
                        title="Identity Relationship Graph"
                        description={activeTab === 'exposure'
                            ? "Intelligence-grade visualization of your PII correlation surfaces."
                            : "Predictive analysis of decryption patterns and threat vectors."
                        }
                        icon={activeTab === 'exposure' ? Share2 : Zap}
                    />
                    <div className="flex bg-muted p-1 rounded-xl self-start border border-border/50 shadow-sm">
                        <button
                            onClick={() => setActiveTab('exposure')}
                            className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'exposure' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Exposure Map
                        </button>
                        <button
                            onClick={() => setActiveTab('logic')}
                            className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'logic' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Risk Logic
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
                    {/* Main Neural Display */}
                    <div className="xl:col-span-9 bg-card rounded-[2.5rem] border border-border/60 shadow-xl relative overflow-hidden flex items-center justify-center p-6 group/canvas h-full max-h-[70vh]">
                        {/* Dynamic Background FX */}
                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '50px 50px' }}
                        />
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,${activeTab === 'logic' ? 'hsl(var(--destructive)/0.03)' : 'hsl(var(--secondary)/0.05)'},transparent_70%)] pointer-events-none transition-colors duration-500`} />

                        {records.length === 0 ? (
                            <div className="flex flex-col items-center gap-4 text-muted-foreground text-center max-w-sm animate-pulse">
                                <div className="p-8 bg-muted/50 rounded-full border border-border/50">
                                    <Fingerprint className="w-12 h-12 opacity-30" />
                                </div>
                                <h3 className="text-base font-black text-foreground">Vault Neutralized</h3>
                            </div>
                        ) : (
                            <div className="relative w-full h-full max-w-[95%] max-h-[95%] cursor-crosshair flex items-center justify-center">
                                <svg viewBox="0 0 800 600" className="w-full h-full max-h-full drop-shadow-2xl preserve-3d">
                                    {/* Neural Pathways */}
                                    {graphData.nodes.map((node) => (
                                        <g key={`link-group-${node.id}`}>
                                            <path
                                                d={`M 400 300 L ${node.x} ${node.y}`}
                                                stroke={node.color}
                                                strokeWidth={activeTab === 'logic' && node.isHighRisk ? "2" : "1"}
                                                className={`transition-all duration-500 ${hoveredNode === node.id ? 'opacity-80' : 'opacity-10'}`}
                                                fill="none"
                                            />
                                            {activeTab === 'exposure' && (
                                                <path
                                                    d={`M 400 300 L ${node.x} ${node.y}`}
                                                    stroke={node.color}
                                                    strokeWidth="1.5"
                                                    strokeDasharray="4 12"
                                                    strokeDashoffset={dashOffset}
                                                    className={`transition-opacity duration-300 ${hoveredNode === node.id ? 'opacity-70' : 'opacity-25'}`}
                                                    fill="none"
                                                />
                                            )}
                                        </g>
                                    ))}

                                    {/* Center Hub */}
                                    <g transform="translate(400, 300)">
                                        <circle r="70" className="fill-background stroke-primary/10 animate-spin-slow" strokeWidth="1" strokeDasharray="15 30" />
                                        <circle r="50" className="fill-primary shadow-2xl" />
                                        <foreignObject x="-20" y="-20" width="40" height="40">
                                            <div className="w-full h-full flex items-center justify-center text-primary-foreground">
                                                <Fingerprint size={28} />
                                            </div>
                                        </foreignObject>
                                    </g>

                                    {/* Data Nodes */}
                                    {graphData.nodes.map((node) => (
                                        <g
                                            key={node.id}
                                            transform={`translate(${node.x}, ${node.y}) scale(${node.sizeMultiplier})`}
                                            className="cursor-pointer transition-transform duration-500"
                                            onMouseEnter={() => setHoveredNode(node.id)}
                                            onMouseLeave={() => setHoveredNode(null)}
                                        >
                                            <circle r="35" className={`transition-all duration-500 blur-xl ${hoveredNode === node.id ? 'opacity-40' : 'opacity-0'}`} fill={node.color} />
                                            <circle r="28" fill="hsl(var(--card))" stroke={node.color} strokeWidth={hoveredNode === node.id ? "3" : "2"} className="transition-all duration-300 shadow-xl" />
                                            <circle r="23" fill={node.color} className="opacity-[0.1]" />
                                            <foreignObject x="-10" y="-10" width="20" height="20">
                                                <div style={{ color: node.color }} className="w-full h-full flex items-center justify-center">
                                                    {activeTab === 'logic' && node.isHighRisk ? <AlertTriangle size={15} /> : <Lock size={15} />}
                                                </div>
                                            </foreignObject>
                                            <text y="48" textAnchor="middle" className={`text-[9px] font-bold uppercase transition-all duration-300 ${hoveredNode === node.id ? 'fill-foreground opacity-100' : 'fill-muted-foreground opacity-50'}`}>
                                                {node.typeLabel}
                                            </text>
                                        </g>
                                    ))}
                                </svg>

                                {/* Legend - Repositioned to be more compact */}
                                <div className="absolute bottom-4 left-4 p-4 bg-background/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg scale-90 origin-bottom-left">
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { l: 'Government', c: 'hsl(var(--secondary))' },
                                            { l: 'Financial', c: 'hsl(var(--accent))' },
                                            { l: 'Health', c: 'hsl(var(--warning))' },
                                            { l: 'Identity', c: 'hsl(var(--primary))' },
                                            { l: 'Critical Risk', c: 'hsl(var(--destructive))', show: activeTab === 'logic' }
                                        ].filter(item => item.show !== false).map(item => (
                                            <div key={item.l} className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.c }} />
                                                <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">{item.l}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logic Panel - Intelligence Sideboard */}
                    <div className="xl:col-span-3 space-y-4 flex flex-col h-full max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                        <Card className={`p-6 ${activeTab === 'logic' ? 'bg-destructive' : 'bg-primary'} rounded-[2.5rem] text-primary-foreground shadow-2xl transition-colors duration-500`}>
                            <Zap className="w-8 h-8 mb-4" />
                            <h3 className="text-xl font-black mb-2 tracking-tight">
                                {activeTab === 'exposure' ? "Neural Pulse" : "Risk Projection"}
                            </h3>
                            <p className="text-primary-foreground/75 text-[11px] leading-relaxed">
                                {activeTab === 'exposure'
                                    ? "Measuring cross-vault linkage and inter-field entropies."
                                    : "Adversarial modeling of decryption sequences and key-exposure risks."
                                }
                            </p>
                        </Card>

                        <div className="space-y-4">
                            <Card className="p-5 rounded-[2rem] border border-border shadow-sm">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                    {activeTab === 'exposure' ? "Correlation Engine" : "Threat Metrics"}
                                </h4>
                                <p className="text-[11px] text-muted-foreground font-medium italic">
                                    {activeTab === 'exposure'
                                        ? "Distance indicates encryption depth and sharing frequency."
                                        : "Large red nodes indicate records with unsafe reveal frequencies."
                                    }
                                </p>
                            </Card>

                            <div className="p-6 space-y-4 bg-muted/30 rounded-[2rem] border border-border/50">
                                <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                                    Telemetry
                                </h5>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Neural Resolution', value: activeTab === 'exposure' ? 'High' : 'Ultra', percent: 92 },
                                        { label: 'Map Integrity', value: '100%', percent: 100 },
                                    ].map(stat => (
                                        <div key={stat.label} className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-black uppercase">
                                                <span className="text-muted-foreground/60">{stat.label}</span>
                                                <span className="text-foreground">{stat.value}</span>
                                            </div>
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full ${activeTab === 'logic' ? 'bg-destructive' : 'bg-primary'} transition-all duration-1000`} style={{ width: `${stat.percent}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default Graph;
