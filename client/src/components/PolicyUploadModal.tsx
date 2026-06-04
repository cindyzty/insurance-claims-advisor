/**
 * PolicyUploadModal.tsx — 保险条款 PDF 上传弹窗
 * 功能：
 * - 拖拽或点击上传 PDF
 * - 显示上传进度和处理状态
 * - 展示条款摘要
 * - 支持重新上传
 */

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export interface PolicySummary {
  productName: string;
  coverageTypes: string[];
  waitingPeriod: string;
  keyExclusions: string[];
  maxClaimAge?: string;
  highlights: string[];
}

export interface UploadedPolicy {
  policyId: string;
  fileName: string;
  productName: string;
  summary: PolicySummary;
  uploadedAt: string;
  policyText: string;  // 完整的 PDF 提取文本
}

interface PolicyUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: (policy: UploadedPolicy) => void;
  uploadedPolicy?: UploadedPolicy;
  // Bug 4 修复：通过 props 接收 sessionId 和 insuranceType，不再依赖 localStorage
  sessionId?: string;
  insuranceType?: string;
}

export default function PolicyUploadModal({
  open,
  onClose,
  onUploadSuccess,
  uploadedPolicy,
  sessionId: propSessionId,
  insuranceType: propInsuranceType,
}: PolicyUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["highlights"]));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    // 验证文件类型和大小
    if (file.type !== "application/pdf") {
      setError("请选择 PDF 格式的文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("文件大小不能超过 10MB");
      return;
    }

    // 模拟上传和处理
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 30;
        });
      }, 300);

      const { extractTextFromPDF } = await import("@/lib/pdfExtractor");
      const { uploadPolicyPDF } = await import("@/lib/api");

      const policyText = await extractTextFromPDF(file);
      console.log("PDF 文本提取成功，长度:", policyText.length);

      // Bug 4 修复：优先使用父组件通过 props 传入的 sessionId 和 insuranceType
      const sessionId = propSessionId || `session_${Date.now()}`;
      const insuranceType = (propInsuranceType || "other") as any;

      const response = await uploadPolicyPDF(sessionId, insuranceType, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const uploadedPolicy: UploadedPolicy = {
        policyId: response.policyId,
        fileName: response.fileName,
        productName: response.summary.productName,
        summary: response.summary,
        uploadedAt: new Date().toISOString(),
        policyText: response.policyText,
      };

      onUploadSuccess(uploadedPolicy);
      toast.success("条款已成功上传并解析");
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败，请重试");
      toast.error("条款上传失败");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(section) ? next.delete(section) : next.add(section);
      return next;
    });
  };

  const handleReset = () => {
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "var(--card)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-base"
            style={{ fontFamily: "'Playfair Display', serif", color: "var(--foreground)" }}
          >
            {uploadedPolicy ? "已上传的保险条款" : "上传保险条款 PDF"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {uploadedPolicy
              ? "您可以查看条款摘要或重新上传新的条款"
              : "上传您的保险条款 PDF，AI 将自动解析关键信息以提升理赔评估的准确性"}
          </DialogDescription>
        </DialogHeader>

        {/* 已上传状态 */}
        {uploadedPolicy && !isUploading && (
          <div className="space-y-4">
            {/* 文件信息 */}
            <div
              className="p-4 rounded-lg flex items-start gap-3"
              style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground mb-1">条款已成功上传</div>
                <div className="text-xs text-muted-foreground truncate">{uploadedPolicy.fileName}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  上传时间：{new Date(uploadedPolicy.uploadedAt).toLocaleString("zh-CN")}
                </div>
              </div>
            </div>

            {/* 条款摘要 */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-foreground">条款摘要</div>

              {/* 产品名称 */}
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs text-muted-foreground mb-1">产品名称</div>
                <div className="text-sm text-foreground font-medium">{uploadedPolicy.summary.productName}</div>
              </div>

              {/* 保障范围 */}
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-xs text-muted-foreground mb-2">保障范围</div>
                <div className="flex flex-wrap gap-2">
                  {uploadedPolicy.summary.coverageTypes.map((type) => (
                    <Badge
                      key={type}
                      className="text-xs"
                      style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "none" }}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 等待期 */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-xs text-muted-foreground mb-1">等待期</div>
                  <div className="text-sm text-foreground font-medium">{uploadedPolicy.summary.waitingPeriod}</div>
                </div>
                {uploadedPolicy.summary.maxClaimAge && (
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="text-xs text-muted-foreground mb-1">最高理赔年龄</div>
                    <div className="text-sm text-foreground font-medium">{uploadedPolicy.summary.maxClaimAge}</div>
                  </div>
                )}
              </div>

              {/* 关键提示 - 可展开 */}
              <div
                className="rounded-lg overflow-hidden border"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <button
                  className="w-full flex items-center justify-between p-3 text-left"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  onClick={() => toggleSection("highlights")}
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4" style={{ color: "#F59E0B" }} />
                    <span className="text-sm font-medium text-foreground">关键提示</span>
                  </div>
                  {expandedSections.has("highlights") ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {expandedSections.has("highlights") && (
                  <div
                    className="px-3 pb-3 pt-0 space-y-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    {uploadedPolicy.summary.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: "#F59E0B" }}
                        />
                        <span className="leading-relaxed">{highlight}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 关键排除 - 可展开 */}
              {uploadedPolicy.summary.keyExclusions.length > 0 && (
                <div
                  className="rounded-lg overflow-hidden border"
                  style={{ borderColor: "rgba(255,255,255,0.07)" }}
                >
                  <button
                    className="w-full flex items-center justify-between p-3 text-left"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    onClick={() => toggleSection("exclusions")}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" style={{ color: "#EF4444" }} />
                      <span className="text-sm font-medium text-foreground">关键排除</span>
                    </div>
                    {expandedSections.has("exclusions") ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedSections.has("exclusions") && (
                    <div
                      className="px-3 pb-3 pt-0 space-y-2"
                      style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      {uploadedPolicy.summary.keyExclusions.map((exclusion, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                            style={{ backgroundColor: "#EF4444" }}
                          />
                          <span className="leading-relaxed">{exclusion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs border-border"
                onClick={() => {
                  handleReset();
                  // 触发重新上传
                  fileInputRef.current?.click();
                }}
              >
                重新上传
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs font-semibold"
                style={{ backgroundColor: "#F59E0B", color: "#1C1C1E" }}
                onClick={onClose}
              >
                确定
              </Button>
            </div>
          </div>
        )}

        {/* 上传中状态 */}
        {isUploading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(245,158,11,0.12)", border: "2px solid rgba(245,158,11,0.3)" }}
            >
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#F59E0B" }} />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-foreground mb-2">正在处理条款...</div>
              <div className="text-xs text-muted-foreground mb-4">
                系统正在解析 PDF 并提取关键信息，请稍候
              </div>
              {/* 进度条 */}
              <div className="w-full max-w-xs h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: "#F59E0B",
                    width: `${uploadProgress}%`,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">{Math.round(uploadProgress)}%</div>
            </div>
          </div>
        )}

        {/* 上传区域 */}
        {!uploadedPolicy && !isUploading && (
          <div className="space-y-4">
            {/* 拖拽区域 */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer ${
                isDragging ? "border-amber-500 bg-amber-500/5" : "border-border hover:border-amber-500/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  <Upload className="w-6 h-6" style={{ color: "#F59E0B" }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {isDragging ? "释放鼠标上传文件" : "拖拽 PDF 文件到此，或点击选择"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    支持 PDF 格式，文件大小不超过 10MB
                  </div>
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div
                className="p-3 rounded-lg flex items-start gap-2.5"
                style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
                <span className="text-xs text-muted-foreground">{error}</span>
              </div>
            )}

            {/* 提示信息 */}
            <div
              className="p-3 rounded-lg flex items-start gap-2.5"
              style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <div className="font-medium text-foreground mb-1">为什么上传条款？</div>
                <ul className="space-y-1 list-disc list-inside">
                  <li>AI 理赔顾问能更准确地理解您的保险范围</li>
                  <li>减少手动填写保单信息的时间</li>
                  <li>提高理赔评估的准确性和可信度</li>
                </ul>
              </div>
            </div>

            {/* 关闭按钮 */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="text-xs border-border" onClick={onClose}>
                跳过
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
