/**
 * EnhancedConsultHeader.tsx
 *
 * Professional consultation header with:
 * - Insurance type badge
 * - Session info
 * - Quick actions
 * - Back navigation
 */

import { ChevronLeft, Clock, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InsuranceType } from '@/lib/api';

const TYPE_LABELS: Record<InsuranceType, string> = {
  health: '健康险 / 医疗险',
  life: '寿险',
  accident: '意外险',
  property: '财产险',
  liability: '责任险',
  travel: '旅行险',
  other: '其他险种',
};

const TYPE_COLORS: Record<InsuranceType, string> = {
  health: 'bg-red-500/10 text-red-400 border-red-500/30',
  life: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  accident: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  property: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  liability: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  travel: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  other: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

interface EnhancedConsultHeaderProps {
  insuranceType: InsuranceType;
  sessionId: string;
  messageCount: number;
  onBack: () => void;
  onReset?: () => void;
}

export default function EnhancedConsultHeader({
  insuranceType,
  sessionId,
  messageCount,
  onBack,
  onReset,
}: EnhancedConsultHeaderProps) {
  const sessionTime = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Left: Back and Type */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 hover:bg-primary/10"
          >
            <ChevronLeft className="w-4 h-4" />
            返回
          </Button>

          <div className="h-6 w-px bg-border" />

          <Badge className={`${TYPE_COLORS[insuranceType]} border`}>
            {TYPE_LABELS[insuranceType]}
          </Badge>
        </div>

        {/* Right: Session Info and Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{sessionTime}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>{messageCount} 条消息</span>
          </div>

          <div className="h-6 w-px bg-border" />

          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="gap-2 hover:bg-destructive/10 text-destructive"
            >
              <RotateCcw className="w-4 h-4" />
              重新开始
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
