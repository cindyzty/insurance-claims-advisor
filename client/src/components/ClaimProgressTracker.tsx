/**
 * ClaimProgressTracker.tsx
 * 
 * Visual claim progress tracker with:
 * - Timeline of claim process steps
 * - Current status indicator
 * - Estimated completion time
 * - Action items for each step
 */

import { CheckCircle2, Circle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProcessStep } from '@/lib/api';

interface ClaimProgressTrackerProps {
  steps: ProcessStep[];
  currentStep?: number;
  onStepClick?: (step: number) => void;
}

export default function ClaimProgressTracker({
  steps,
  currentStep = 0,
  onStepClick,
}: ClaimProgressTrackerProps) {
  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            理赔进度
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            第 {currentStep + 1} / {steps.length} 步
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </div>
          <p className="text-xs text-muted-foreground">已完成</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps Timeline */}
      <div className="space-y-3 mt-6">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isUpcoming = idx > currentStep;

          return (
            <div
              key={idx}
              onClick={() => onStepClick?.(idx)}
              className={`relative p-4 rounded-lg border transition-all ${
                isCurrent
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : isCompleted
                    ? 'border-border bg-card/50'
                    : 'border-border/50 bg-card/30 opacity-60'
              } ${onStepClick ? 'cursor-pointer hover:border-primary/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="relative">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <div className="absolute inset-0 animate-pulse">
                        <CheckCircle2 className="w-5 h-5 text-green-400/30" />
                      </div>
                    </div>
                  ) : isCurrent ? (
                    <div className="relative">
                      <Circle className="w-5 h-5 text-primary fill-primary/20" />
                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                        <Circle className="w-5 h-5 text-primary/50" />
                      </div>
                    </div>
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/30" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                      {step.title}
                    </h4>
                    {isCompleted && (
                      <Badge variant="outline" className="text-xs">已完成</Badge>
                    )}
                    {isCurrent && (
                      <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                        进行中
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-foreground/70 mb-2">{step.description}</p>

                  {step.estimatedTime && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      预计耗时: {step.estimatedTime}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {onStepClick && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                )}
              </div>

              {/* Connector Line */}
              {idx !== steps.length - 1 && (
                <div
                  className={`absolute left-[26px] top-[60px] w-0.5 h-6 ${
                    isCompleted ? 'bg-green-400/30' : 'bg-border/50'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {currentStep === steps.length - 1 && (
        <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-400 mb-1">理赔流程已完成</h4>
              <p className="text-sm text-green-400/80">
                感谢您的耐心，理赔结果已发送至您的邮箱
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
