/**
 * PolicyComparisonModal.tsx — 条款对比弹窗
 * 功能：
 * - 展示两份条款的详细对比
 * - 高亮显示差异
 * - 提供对比建议
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import type { ComparisonResult } from "@/lib/policyComparison";

interface PolicyComparisonModalProps {
  open: boolean;
  onClose: () => void;
  comparison: ComparisonResult | null;
}

export default function PolicyComparisonModal({
  open,
  onClose,
  comparison,
}: PolicyComparisonModalProps) {
  const [expandedDiff, setExpandedDiff] = useState<Set<number>>(new Set([0, 1]));

  if (!comparison) return null;

  const toggleDiff = (index: number) => {
    setExpandedDiff((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const getAdvantageIcon = (advantage: string) => {
    if (advantage === "equal") return null;
    return advantage === "policy1" ? (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    ) : (
      <CheckCircle2 className="w-4 h-4 text-blue-500" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>条款版本对比</DialogTitle>
          <DialogDescription>
            详细对比两份保险条款的保障范围、条件和限制
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 对比总结 */}
          <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  对比建议
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {comparison.summary.reason}
                </p>
              </div>
            </div>
          </Card>

          {/* 产品基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3">
                {comparison.policy1.productName}
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">保障范围：</span>
                  <span className="font-medium">
                    {comparison.policy1.coverageTypes.length} 种
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">等待期：</span>
                  <span className="font-medium">{comparison.policy1.waitingPeriod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">排除条款：</span>
                  <span className="font-medium">
                    {comparison.policy1.keyExclusions.length} 项
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-3">
                {comparison.policy2.productName}
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">保障范围：</span>
                  <span className="font-medium">
                    {comparison.policy2.coverageTypes.length} 种
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">等待期：</span>
                  <span className="font-medium">{comparison.policy2.waitingPeriod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">排除条款：</span>
                  <span className="font-medium">
                    {comparison.policy2.keyExclusions.length} 项
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* 详细差异对比 */}
          <div>
            <h3 className="font-semibold mb-3">详细对比</h3>
            <div className="space-y-2">
              {comparison.differences.map((diff, index) => (
                <Card
                  key={index}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => toggleDiff(index)}
                >
                  <div className="p-3 flex items-center justify-between bg-muted/50">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium text-sm">{diff.field}</span>
                      {diff.advantage !== "equal" && (
                        <Badge
                          variant="outline"
                          className={
                            diff.advantage === "policy1"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
                              : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                          }
                        >
                          {diff.advantage === "policy1" ? "产品1更优" : "产品2更优"}
                        </Badge>
                      )}
                    </div>
                    {expandedDiff.has(index) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>

                  {expandedDiff.has(index) && (
                    <div className="p-4 border-t border-border grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {comparison.policy1.productName}
                        </p>
                        <p className="text-sm font-medium">{diff.policy1}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {comparison.policy2.productName}
                        </p>
                        <p className="text-sm font-medium">{diff.policy2}</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
            <Button
              onClick={() => {
                // TODO: 导出对比报告
              }}
            >
              导出对比报告
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
