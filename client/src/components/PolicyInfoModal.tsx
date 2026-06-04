/**
 * PolicyInfoModal.tsx — 保险条款上传弹窗
 * 简化版本：上传 PDF 后自动关闭，直接发送给 AI 分析
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Upload, CheckCircle2, Loader2 } from "lucide-react";
import type { PolicyInfo } from "@/lib/api";
import PolicyUploadModal, { type UploadedPolicy } from "./PolicyUploadModal";

interface PolicyInfoModalProps {
  open: boolean;
  onClose: () => void;
  value?: PolicyInfo;
  onChange: (info: PolicyInfo) => void;
  // Bug 4 修复：从父组件接收 sessionId 和 insuranceType
  sessionId?: string;
  insuranceType?: string;
}

export default function PolicyInfoModal({ open, onClose, value, onChange, sessionId, insuranceType }: PolicyInfoModalProps) {
  const [showPolicyUpload, setShowPolicyUpload] = useState(false);
  const [uploadedPolicy, setUploadedPolicy] = useState<UploadedPolicy | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (open) {
      setUploadedPolicy(undefined);
      setShowPolicyUpload(true);
    }
  }, [open]);

  const handlePolicyUploadSuccess = async (policy: UploadedPolicy) => {
    setUploadedPolicy(policy);
    setIsAnalyzing(true);

    // 直接发送给 AI 分析，不需要前端处理
    setTimeout(() => {
      const policyInfo: PolicyInfo = {
        policyId: policy.policyId,
        productName: policy.summary.productName,
        coverageDetails: `等待期：${policy.summary.waitingPeriod}\n保障范围：${policy.summary.coverageTypes.join("、")}\n${
          policy.summary.keyExclusions.length > 0 ? `关键排除：${policy.summary.keyExclusions.join("、")}` : ""
        }`,
        policySummary: policy.summary,
        uploadedAt: policy.uploadedAt,
        policyText: policy.policyText,
      };

      onChange(policyInfo);
      setIsAnalyzing(false);

      // 立即关闭弹窗（不需要等待用户点击确认）
      setShowPolicyUpload(false);
      onClose();
    }, 800);

    // 保存 policyId 到 localStorage 下次使用
    localStorage.setItem("uploadedPolicyId", policy.policyId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className="max-w-md"
          style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-lg"
              style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}
            >
              上传保险条款
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              上传您的保险条款 PDF，AI 将直接分析并为您提供理赔建议。
            </DialogDescription>
          </DialogHeader>

          {/* 提示信息 */}
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-xs"
            style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
            <span className="text-muted-foreground">
              支持 PDF 格式条款文件。文件大小不超过 10MB。上传后将自动发送给 AI 进行分析。
            </span>
          </div>

          {/* 上传区域 */}
          {!uploadedPolicy ? (
            <Button
              variant="outline"
              size="lg"
              className="w-full text-base gap-2 border-border justify-center py-6 hover:bg-muted/50"
              onClick={() => setShowPolicyUpload(true)}
            >
              <Upload className="w-5 h-5" />
              点击上传条款 PDF
            </Button>
          ) : (
            <div className="space-y-3">
              {/* 已上传状态 */}
              <div
                className="p-4 rounded-lg border"
                style={{ backgroundColor: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5" style={{ color: "#22C55E" }} />
                  <span className="font-medium text-foreground">条款已上传</span>
                </div>
                <p className="text-sm text-muted-foreground">{uploadedPolicy.fileName}</p>
              </div>

              {/* 分析中状态 */}
              {isAnalyzing && (
                <div
                  className="p-4 rounded-lg border flex items-center gap-2"
                  style={{ backgroundColor: "rgba(59,130,246,0.06)", borderColor: "rgba(59,130,246,0.2)" }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#3B82F6" }} />
                  <span className="text-sm text-muted-foreground">正在发送给 AI 分析...</span>
                </div>
              )}

              {/* 分析完成 */}
              {!isAnalyzing && (
                <div
                  className="p-4 rounded-lg border"
                  style={{ backgroundColor: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)" }}
                >
                  <p className="text-sm text-muted-foreground">✓ 已发送给 AI，窗口将自动关闭</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 文件上传弹窗 */}
      <PolicyUploadModal
        open={showPolicyUpload}
        onClose={() => setShowPolicyUpload(false)}
        onUploadSuccess={handlePolicyUploadSuccess}
        sessionId={sessionId}
        insuranceType={insuranceType}
      />
    </>
  );
}
