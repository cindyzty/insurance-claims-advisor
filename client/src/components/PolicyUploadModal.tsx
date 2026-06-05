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

/**
 * Issue #3-A：调用 AI 视觉模型，验证上传的 PDF 是否为保险条款文件
 * @param pageImages 前 3 页的 base64 图片数组（data URL 格式）
 * @returns true 表示是保险条款，false 表示不是
 */
async function verifyIsInsurancePolicy(pageImages: string[]): Promise<boolean> {
  try {
    // 复用项目统一的 API 配置（nex-agi/Nex-N2-Pro 支持 image_url）
    const API_BASE_URL = "https://api.siliconflow.cn/v1";
    const API_KEY = "Bearer sk-ajrtbobovxlbpdinskwipfjhjkwqtztdddpgajgcbhpmdydt";
    const VISION_MODEL = "nex-agi/Nex-N2-Pro";

    // 打印图片大小，方便调试（base64 字符数 / 1.33 ≈ 字节数）
    const totalBase64Chars = pageImages.reduce((sum, img) => sum + img.length, 0);
    console.log(`验证图片总大小: ~${(totalBase64Chars / 1024 / 1.33).toFixed(0)} KB, 页数: ${pageImages.length}`);

    const imageContents = pageImages.map((img) => ({
      type: "image_url" as const,
      image_url: { url: img },
    }));

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: API_KEY,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              ...imageContents,
              {
                type: "text",
                text: "这些是一份 PDF 文件的前几页。请仔细判断：这份文件是否是保险公司正式发行的保险条款文件？\n\n保险条款文件的特征：包含保险责任、除外责任、理赔条件、保险金额、等待期等保险专业术语；文件标题或封面通常包含“保险条款”、“保险单”、“投保须知”、“保险合同”等字样。\n\n以下文件不是保险条款，应回答 NO：工资单、薪资条、体检报告、医院病历、发票、收据、合同文本（非保险合同）、身份证明、成绩单、学历、个人简历、广告单页、外卖收据、财务报表等。\n\n只需回答 YES 或 NO，不要解释。",
              },
            ],
          },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      // 验证接口失败时，抛出错误让上层处理（不默认放行）
      let errBody = "";
      try { errBody = await response.text(); } catch { /* ignore */ }
      console.warn("保险条款验证接口失败，status:", response.status, "返回内容:", errBody.substring(0, 200));
      throw new Error(`验证服务失败 (HTTP ${response.status})，请稍后重试`);
    }

    const data = await response.json();
    const answer = (data.choices?.[0]?.message?.content || "").trim().toUpperCase();
    console.log("保险条款验证结果:", answer);
    // 严格模式：只有明确回答 YES 才通过，其他一律拒绝
    return answer.startsWith("YES");
  } catch (err: any) {
    // 如果是我们自己抛出的验证服务错误，向上传递
    if (err?.message?.includes("验证服务")) throw err;
    console.warn("保险条款验证异常:", err);
    throw new Error("文件验证失败，请检查网络连接后重试");
  }
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
  // Issue #3-A：上传阶段状态，用于在 UI 中显示当前进行到哪一步
  const [uploadStatus, setUploadStatus] = useState<"validating" | "extracting" | "analyzing" | "done">("validating");
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

    // 验证文件大小（文件类型由 AI 视觉验证处理，不在此强制检查 MIME type）
    if (file.size > 10 * 1024 * 1024) {
      setError("文件大小不能超过 10MB");
      return;
    }

    // 模拟上传和处理
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("validating");

    try {
      // Issue #3-A：先渲染前 3 页为图片，发给 AI 验证是否为保险条款文件
      const { renderPDFPagesToBase64, extractTextFromPDF } = await import("@/lib/pdfExtractor");
      const { uploadPolicyPDF } = await import("@/lib/api");

      setUploadProgress(10);

      // 尝试渲染前 3 页为图片，如果渲染失败（如文件不是 PDF）直接拒绝
      let pageImages: string[] = [];
      try {
        pageImages = await renderPDFPagesToBase64(file, 1, 0.5);
      } catch (renderErr: any) {
        setError("无法读取文件，请确保上传的是有效的 PDF 文件");
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
      setUploadProgress(25);

      // 调用 AI 视觉模型验证文件类型（严格模式：验证失败或网络异常均拒绝）
      let isInsurancePolicy = false;
      try {
        isInsurancePolicy = await verifyIsInsurancePolicy(pageImages);
      } catch (verifyErr: any) {
        // 区分验证服务错误和其他错误
        setError(verifyErr?.message || "文件验证失败，请重试");
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
      if (!isInsurancePolicy) {
        setError("您上传的文件似乎不是保险条款，请核对后重新上传。");
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      // 验证通过，开始提取全文
      setUploadStatus("extracting");
      setUploadProgress(30);

      // Issue #1 修复：进度条平滑递增，每次最多增加 10%，且严格限制在 0-90 之间
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 88) {
            clearInterval(progressInterval);
            return 88;
          }
          const increment = Math.random() * 8 + 2; // 每次增加 2-10%
          return Math.min(prev + increment, 88);
        });
      }, 400);

      // Issue #3-B：并行提取全文（已在 pdfExtractor.ts 中改为 Promise.all）
      const policyText = await extractTextFromPDF(file);
      console.log("PDF 文本提取成功，长度:", policyText.length);

      setUploadStatus("analyzing");

      // Bug 4 修复：优先使用父组件通过 props 传入的 sessionId 和 insuranceType
      const sessionId = propSessionId || `session_${Date.now()}`;
      const insuranceType = (propInsuranceType || "other") as any;

      const response = await uploadPolicyPDF(sessionId, insuranceType, file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("done");

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
              <div className="text-sm font-medium text-foreground mb-2">
                {uploadStatus === "validating" && "正在验证文件类型..."}
                {uploadStatus === "extracting" && "正在解析条款内容..."}
                {uploadStatus === "analyzing" && "正在分析关键信息..."}
                {uploadStatus === "done" && "处理完成"}
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                {uploadStatus === "validating" && "AI 正在确认这是保险条款文件"}
                {uploadStatus === "extracting" && "并行解析 PDF 内容，请稍候"}
                {uploadStatus === "analyzing" && "提取保障范围、等待期等关键信息"}
                {uploadStatus === "done" && "条款已成功解析"}
              </div>
              {/* 进度条 */}
              <div className="w-full max-w-xs h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: "#F59E0B",
                    width: `${Math.min(100, uploadProgress)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">{Math.min(100, Math.max(0, Math.round(uploadProgress)))}%</div>
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
                accept=".pdf,.PDF"
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
                    {isDragging ? "释放鼠标上传文件" : "拖拽文件到此，或点击选择"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    支持 PDF 格式，文件大小不超过 10MB；AI 将自动验证是否为保险条款
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
