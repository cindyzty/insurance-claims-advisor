/**
 * ClaimAssessmentDashboard.tsx
 * 
 * Enhanced claim assessment visualization with:
 * - Animated probability gauge
 * - Coverage analysis breakdown
 * - Risk factor indicators
 * - Required documents checklist
 * - Professional typography and spacing
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, FileText, TrendingUp, Shield, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ClaimAssessmentReport } from '@/lib/api';

interface ClaimAssessmentDashboardProps {
  report: ClaimAssessmentReport;
  isAnimated?: boolean;
}

function getProbabilityColor(prob: number): string {
  if (prob >= 80) return 'text-green-400';
  if (prob >= 60) return 'text-amber-400';
  if (prob >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getProbabilityBgColor(prob: number): string {
  if (prob >= 80) return 'bg-green-500/10 border-green-500/30';
  if (prob >= 60) return 'bg-amber-500/10 border-amber-500/30';
  if (prob >= 40) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

function getProbabilityLabel(prob: number): string {
  if (prob >= 80) return '可能性较高';
  if (prob >= 60) return '可能性中等偏高';
  if (prob >= 40) return '可能性中等';
  if (prob >= 20) return '可能性较低';
  return '可能性低';
}

export default function ClaimAssessmentDashboard({ report, isAnimated = false }: ClaimAssessmentDashboardProps) {
  const [displayProb, setDisplayProb] = useState(0);

  useEffect(() => {
    if (!isAnimated) {
      setDisplayProb(report.claimProbability);
      return;
    }

    let current = 0;
    const target = report.claimProbability;
    const increment = target / 30;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayProb(target);
        clearInterval(interval);
      } else {
        setDisplayProb(Math.round(current));
      }
    }, 16);

    return () => clearInterval(interval);
  }, [report.claimProbability, isAnimated]);

  return (
    <div className="space-y-6">
      {/* Probability Gauge */}
      <div className={`border rounded-lg p-6 transition-all duration-500 ${getProbabilityBgColor(displayProb)}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              理赔可能性评估
            </h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-bold ${getProbabilityColor(displayProb)}`}>
                {displayProb}%
              </span>
              <span className="text-sm text-muted-foreground">
                {getProbabilityLabel(displayProb)}
              </span>
            </div>
          </div>
          <TrendingUp className={`w-8 h-8 ${getProbabilityColor(displayProb)}`} />
        </div>

        <Progress value={displayProb} className="h-2 mb-4" />

        <p className="text-sm text-foreground/80 leading-relaxed">
          {report.probabilityReason}
        </p>
      </div>

      {/* Coverage Analysis */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          <Shield className="w-4 h-4 inline mr-2" />
          保险范围分析
        </h3>
        <div className="space-y-3">
          {report.coverageAnalysis.map((item, idx) => (
            <div key={idx} className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card/80 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-foreground">{item.item}</h4>
                <Badge variant={item.covered ? 'default' : 'destructive'} className="text-xs">
                  {item.covered ? '已覆盖' : '未覆盖'}
                </Badge>
              </div>
              <p className="text-sm text-foreground/70">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Required Documents */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          <FileText className="w-4 h-4 inline mr-2" />
          所需理赔材料
        </h3>
        <div className="space-y-3">
          {report.requiredDocuments.map((doc, idx) => (
            <div key={idx} className="flex gap-3 p-3 border border-border rounded-lg bg-card/50">
              <div className="flex-shrink-0 mt-1">
                {!doc.required ? (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {doc.name}
                </p>
                <p className="text-xs text-foreground/60 mt-1">{doc.description}</p>
                {doc.tips && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {doc.tips}
                  </p>
                )}
              </div>
              {!doc.required && (
                <Badge variant="outline" className="text-xs flex-shrink-0">可选</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Claim Process Steps */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          理赔流程步骤
        </h3>
        <div className="space-y-0">
          {report.claimProcess.map((step, idx) => (
            <div key={idx} className="relative">
              {idx !== report.claimProcess.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-6 bg-gradient-to-b from-primary/50 to-primary/20" />
              )}
              <div className="flex gap-4 pb-6">
                <div className="flex-shrink-0 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{step.step}</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium text-foreground mb-1">{step.title}</h4>
                  <p className="text-sm text-foreground/70 mb-2">{step.description}</p>
                  {step.estimatedTime && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      预计耗时: {step.estimatedTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
