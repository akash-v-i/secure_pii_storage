import React, { useMemo, useState, useEffect } from 'react';
import { Share2, Lock, Shield, User, Database, Fingerprint, Activity, Zap, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    TooltipProvider,
} from "@/components/ui/tooltip";

interface UserGraphViewerProps {
    records: any[];
    username: string;
}

export const UserGraphViewer: React.FC<UserGraphViewerProps> = ({ records, username }) => {
    const [hoveredNode, setHoveredNode] = useState<string | number | null>(null);
    const [activeTab, setActiveTab] = useState<'exposure' | 'logic'>('exposure');
    const [dashOffset, setDashOffset] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setDashOffset(prev => (prev - 1) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const graphData = useMemo(() => {
        if (records.length === 0) return { nodes: [] };

        const getCategoryInfo = (type: string) => {
            const t = type?.toLowerCase() || '';
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
            const piiType = r.pii_type || r.type;
            const typeLabel = r.type_label || r.typeLabel;
            const accessCount = r.access_count || r.accessCount || 0;

            const info = getCategoryInfo(piiType);
            const goldenAngle = Math.PI * (3 - Math.sqrt(5));
            const radiusConstant = 55;

            const r_dist = radiusConstant * Math.sqrt(i + 4);
            const theta = i * goldenAngle;

            const isHighRisk = accessCount > 3;
            const sizeMultiplier = activeTab === 'logic' && isHighRisk ? 1.4 : 1;

            return {
                ...r,
                id: r.id,
                typeLabel,
                x: 400 + Math.cos(theta) * r_dist,
                y: 300 + Math.sin(theta) * r_dist,
                color: activeTab === 'logic' && isHighRisk ? 'hsl(var(--destructive))' : info.color,
                sizeMultiplier,
                isHighRisk
            };
        });

        return { nodes };
    }, [records, activeTab]);

    return (
        <TooltipProvider>
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        Metadata Analysis: {username}
                    </h3>
                    <div className="flex bg-muted p-1 rounded-xl border border-border/50 shadow-sm">
                        <button
                            onClick={() => setActiveTab('exposure')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'exposure' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Exposure
                        </button>
                        <button
                            onClick={() => setActiveTab('logic')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'logic' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Risk
                        </button>
                    </div>
                </div>

                <div className="bg-card rounded-3xl border border-border/60 shadow-xl relative overflow-hidden flex items-center justify-center p-6 h-[500px]">
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

                    {records.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground text-center animate-pulse">
                            <Fingerprint className="w-12 h-12 opacity-30" />
                            <h3 className="text-sm font-bold">No Records Found</h3>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <svg viewBox="0 0 800 600" className="w-full h-full max-h-full drop-shadow-2xl">
                                {graphData.nodes.map((node: any) => (
                                    <g key={`link-${node.id}`}>
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

                                <g transform="translate(400, 300)">
                                    <circle r="65" className="fill-background stroke-primary/10 animate-spin-slow" strokeWidth="1" strokeDasharray="15 30" />
                                    <circle r="45" className="fill-primary shadow-2xl" />
                                    <foreignObject x="-18" y="-18" width="36" height="36">
                                        <div className="w-full h-full flex items-center justify-center text-primary-foreground">
                                            <Fingerprint size={24} />
                                        </div>
                                    </foreignObject>
                                </g>

                                {graphData.nodes.map((node: any) => (
                                    <g
                                        key={node.id}
                                        transform={`translate(${node.x}, ${node.y}) scale(${node.sizeMultiplier})`}
                                        className="cursor-pointer"
                                        onMouseEnter={() => setHoveredNode(node.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                    >
                                        <circle r="32" className={`transition-all duration-500 blur-lg ${hoveredNode === node.id ? 'opacity-40' : 'opacity-0'}`} fill={node.color} />
                                        <circle r="26" fill="hsl(var(--card))" stroke={node.color} strokeWidth={hoveredNode === node.id ? "3" : "2"} className="shadow-xl" />
                                        <foreignObject x="-9" y="-9" width="18" height="18">
                                            <div style={{ color: node.color }} className="w-full h-full flex items-center justify-center">
                                                {activeTab === 'logic' && node.isHighRisk ? <AlertTriangle size={14} /> : <Lock size={14} />}
                                            </div>
                                        </foreignObject>
                                        <text y="45" textAnchor="middle" className={`text-[10px] font-bold uppercase transition-all duration-300 ${hoveredNode === node.id ? 'fill-foreground opacity-100' : 'fill-muted-foreground opacity-50'}`}>
                                            {node.typeLabel}
                                        </text>
                                    </g>
                                ))}
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
};
