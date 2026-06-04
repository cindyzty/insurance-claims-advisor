/**
 * RecommendationPanel.tsx
 *
 * Personalized insurance recommendations based on:
 * - Insurance type
 * - Claim history
 * - Coverage gaps
 * - Professional advice
 */

import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InsuranceType } from '@/lib/api';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'coverage' | 'optimization' | 'risk' | 'savings';
  icon?: React.ReactNode;
}

interface RecommendationPanelProps {
  insuranceType: InsuranceType;
  recommendations?: Recommendation[];
}

const DEFAULT_RECOMMENDATIONS: Record<InsuranceType, Recommendation[]> = {
  health: [
    {
      id: 'health-1',
      title: '检查等待期条款',
      description: '确保您了解健康险的等待期规定，通常为30-180天',
      priority: 'high',
      category: 'coverage',
    },
    {
      id: 'health-2',
      title: '保留医疗凭证',
      description: '妥善保管医疗发票、诊断证明等材料，理赔时需要',
      priority: 'high',
      category: 'optimization',
    },
    {
      id: 'health-3',
      title: '了解免赔额',
      description: '大多数医疗险都有免赔额设置，需要超过该额度才能理赔',
      priority: 'medium',
      category: 'coverage',
    },
  ],
  life: [
    {
      id: 'life-1',
      title: '确认受益人信息',
      description: '定期检查保单上的受益人信息是否最新准确',
      priority: 'high',
      category: 'coverage',
    },
    {
      id: 'life-2',
      title: '了解宽限期',
      description: '寿险通常有60天宽限期，期间发生身故仍可理赔',
      priority: 'medium',
      category: 'coverage',
    },
  ],
  accident: [
    {
      id: 'accident-1',
      title: '及时报案',
      description: '发生意外事故后应在规定时间内向保险公司报案',
      priority: 'high',
      category: 'optimization',
    },
    {
      id: 'accident-2',
      title: '保留事故证据',
      description: '收集照片、证人证言、警方报告等相关证据',
      priority: 'high',
      category: 'optimization',
    },
  ],
  property: [
    {
      id: 'property-1',
      title: '定期更新保额',
      description: '随着资产增值，应定期调整保单保额',
      priority: 'medium',
      category: 'optimization',
    },
    {
      id: 'property-2',
      title: '了解免赔率',
      description: '财产险通常采用免赔率制度，需要了解具体规则',
      priority: 'medium',
      category: 'coverage',
    },
  ],
  liability: [
    {
      id: 'liability-1',
      title: '保存合同证据',
      description: '保留与第三方的合同、协议等相关文件',
      priority: 'high',
      category: 'optimization',
    },
    {
      id: 'liability-2',
      title: '及时沟通',
      description: '发生责任纠纷时，应主动与保险公司沟通',
      priority: 'medium',
      category: 'optimization',
    },
  ],
  travel: [
    {
      id: 'travel-1',
      title: '购买前确认覆盖范围',
      description: '出行前确认保单覆盖的地区和风险',
      priority: 'high',
      category: 'coverage',
    },
    {
      id: 'travel-2',
      title: '携带保单证明',
      description: '出行时随身携带保单或电子证明',
      priority: 'medium',
      category: 'optimization',
    },
  ],
  other: [
    {
      id: 'other-1',
      title: '咨询专业顾问',
      description: '对于不确定的险种，建议咨询专业保险顾问',
      priority: 'high',
      category: 'coverage',
    },
  ],
};

function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'medium':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'low':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }
}

function getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return '重要';
    case 'medium':
      return '建议';
    case 'low':
      return '参考';
  }
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'coverage':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'optimization':
      return <TrendingUp className="w-4 h-4" />;
    case 'risk':
      return <AlertTriangle className="w-4 h-4" />;
    case 'savings':
      return <Lightbulb className="w-4 h-4" />;
    default:
      return <Lightbulb className="w-4 h-4" />;
  }
}

export default function RecommendationPanel({
  insuranceType,
  recommendations,
}: RecommendationPanelProps) {
  const items = recommendations || DEFAULT_RECOMMENDATIONS[insuranceType] || [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          <Lightbulb className="w-4 h-4 inline mr-2" />
          专业建议
        </h3>
      </div>

      {items.length === 0 ? (
        <Card className="p-6 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            暂无建议
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((rec) => (
            <Card
              key={rec.id}
              className={`p-4 border-l-4 transition-all hover:shadow-sm ${
                rec.priority === 'high'
                  ? 'border-l-red-500 bg-red-500/5'
                  : rec.priority === 'medium'
                    ? 'border-l-amber-500 bg-amber-500/5'
                    : 'border-l-blue-500 bg-blue-500/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1 text-muted-foreground">
                  {getCategoryIcon(rec.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{rec.title}</h4>
                    <Badge
                      className={`${getPriorityColor(rec.priority)} border text-xs`}
                    >
                      {getPriorityLabel(rec.priority)}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/70">{rec.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
