/**
 * Consult.tsx — 核心咨询页面
 * Design: 「法律文书」深色专业风
 * Layout: 左侧 60% 聊天区 + 右侧 40% 实时信息摘要区
 *
 * 功能模块:
 * 1. 左侧：AI 智能问答对话（收集理赔信息）
 * 2. 右侧：实时信息摘要表格（根据 AI [FIELD:...] 标记动态更新）
 *    - 空白引导状态（未开始对话时）
 *    - 概览 Tab：当前情况整理 + 待确认保障方向清单
 *    - 材料 Tab：所需材料清单
 *    - 流程 Tab：理赔流程步骤
 *    - 导出报告（PDF）按钮
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Send,
  Bot,
  User,
  ChevronLeft,
  FileText,
  CheckSquare,
  Square,
  AlertCircle,
  Info,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
  Shield,
  ClipboardList,
  TrendingUp,
  RefreshCw,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type InsuranceType,
  type ChatMessage,
  type ClaimAssessmentReport,
  type PolicyInfo,
  type FieldUpdate,
  sendChatMessage,
  generateClaimAssessment,
  createSession,
} from "@/lib/api";
import PolicyInfoModal from "@/components/PolicyInfoModal";
import { saveSession, type SessionData } from "@/lib/sessionManager";
import jsPDF from "jspdf"
import { notoSansSCRegular } from "@/lib/pdfFont";
// ── 险种标签映射 ──
const TYPE_LABELS: Record<InsuranceType, string> = {
  health: "健康险 / 医疗险",
  life: "寿险",
  accident: "意外险",
  property: "财产险",
  liability: "责任险",
  travel: "旅行险",
  other: "其他险种",
};

// ── 各险种对应的信息字段 ──
const INSURANCE_FIELDS: Record<InsuranceType, { name: string; hint: string }[]> = {
  health: [
    { name: "就医与诊疗记录", hint: "建议补充就诊医院名称，并保留病历、诊断证明和检查报告。" },
    { name: "治疗与住院安排", hint: "建议补充是否住院、是否手术、后续治疗安排等信息。" },
    { name: "医保/社保结算", hint: "建议确认本次就医是否会使用医保或社保结算。" },
    { name: "费用与票据", hint: "建议补充已发生费用或预计费用，并保留发票、费用明细清单。" },
  ],
  life: [
    { name: "身故证明", hint: "需提供医院出具的死亡证明或公安机关出具的死亡证明书。" },
    { name: "受益人信息", hint: "需确认受益人姓名、身份证号及与被保险人关系。" },
    { name: "保单有效性", hint: "需确认保单在身故时处于有效状态，保费已缴清。" },
    { name: "等待期核查", hint: "需确认身故时间是否在保单等待期之外。" },
  ],
  accident: [
    { name: "事故经过", hint: "需详细描述意外事故发生的时间、地点及经过。" },
    { name: "就医记录", hint: "需提供就诊医院的病历、诊断证明及检查报告。" },
    { name: "伤残鉴定", hint: "如涉及伤残，需提供专业机构出具的伤残鉴定报告。" },
    { name: "费用与票据", hint: "需保留所有医疗费用发票及费用明细清单。" },
  ],
  property: [
    { name: "事故经过", hint: "需详细描述财产损失事故的时间、地点及经过。" },
    { name: "定损报告", hint: "需由保险公司或第三方机构出具财产损失定损报告。" },
    { name: "修理费用", hint: "需提供修理费用清单及相关发票。" },
    { name: "第三方信息", hint: "如涉及第三方，需提供对方身份信息及联系方式。" },
  ],
  liability: [
    { name: "事故经过", hint: "需详细描述事故发生的时间、地点及经过。" },
    { name: "第三方损失", hint: "需提供第三方损失证明及相关证据材料。" },
    { name: "法律文件", hint: "如有诉讼或仲裁，需提供相关法律文件。" },
    { name: "赔偿金额", hint: "需确认第三方要求的赔偿金额及依据。" },
  ],
  travel: [
    { name: "行程证明", hint: "需提供机票、车票或其他行程证明文件。" },
    { name: "事故经过", hint: "需详细描述旅行途中事故发生的时间、地点及经过。" },
    { name: "就医记录", hint: "需提供就诊医院的病历、诊断证明及检查报告。" },
    { name: "费用与票据", hint: "需保留所有相关费用发票及费用明细清单。" },
  ],
  other: [
    { name: "事故经过", hint: "需详细描述事故发生的时间、地点及经过。" },
    { name: "相关证明", hint: "需提供与理赔相关的证明文件。" },
    { name: "损失情况", hint: "需详细说明损失情况及损失金额。" },
    { name: "费用与票据", hint: "需保留所有相关费用发票及费用明细清单。" },
  ],
};

function getProbabilityColor(prob: number): string {
  if (prob >= 70) return "#22C55E";
  if (prob >= 40) return "#F59E0B";
  return "#EF4444";
}

function getProbabilityLabel(prob: number): string {
  if (prob >= 80) return "可能性较高";
  if (prob >= 60) return "可能性中等偏高";
  if (prob >= 40) return "可能性中等";
  if (prob >= 20) return "可能性较低";
  return "可能性低";
}

export default function Consult() {
  const [location, setLocation] = useLocation();

  // 从浏览器地址栏直接获取查询参数（最可靠的方式）
  const getInitialInsuranceType = (): InsuranceType => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      if (type && ['health', 'life', 'accident', 'property', 'liability', 'travel', 'other'].includes(type)) {
        return type as InsuranceType;
      }
    }
    // 备用方案：从 wouter location 中提取
    const match = location.match(/type=([^&]*)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]) as InsuranceType;
    }
    return 'other';
  };

  // Issue #4 修复：将 insuranceType 改为 state，支持用户在对话中切换险种
  const [insuranceType, setInsuranceType] = useState<InsuranceType>(getInitialInsuranceType);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<ClaimAssessmentReport | null>(null);
  const [policyInfo, setPolicyInfo] = useState<PolicyInfo | undefined>();
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [canGenerateReport, setCanGenerateReport] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<"overview" | "documents" | "process">("overview");
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set());
  const [probAnimated, setProbAnimated] = useState(false);
  const [clauseRelevance, setClauseRelevance] = useState<Map<number, any[]>>(new Map());
  const [completenessScore, setCompletenessScore] = useState<number>(0);

  // 实时字段状态：Map<字段名, { status, note }>
  const [fieldStatuses, setFieldStatuses] = useState<Map<string, { status: "confirmed" | "pending"; note: string }>>(new Map());
  // 是否已有对话（用于控制右侧空白引导状态）
  const hasStartedChat = messages.some(m => m.role === "user");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const reportPanelRef = useRef<HTMLDivElement>(null);
  const reportRequestVersionRef = useRef(0);

  // Issue #4：点击页面其他地方时关闭险种下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 初始化会话或恢复历史会话
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);

        // 检查是否需要恢复历史会话
        const resumeSessionId = localStorage.getItem("resumeSessionId");
        if (resumeSessionId) {
          const { getSession } = await import("@/lib/sessionManager");
          const session = getSession(resumeSessionId);
          if (session) {
            setSessionId(session.sessionId);
            setMessages(session.messages);
            if (session.policyInfo) {
              setPolicyInfo(session.policyInfo);
            }
            localStorage.removeItem("resumeSessionId");
            setIsInitializing(false);
            return;
          }
        }

        // 创建新会话
        const { sessionId: sid, initialMessage } = await createSession(insuranceType);
        setSessionId(sid);
        setMessages([{ role: "assistant", content: initialMessage, timestamp: new Date().toISOString() }]);
      } catch {
        toast.error("会话初始化失败，请刷新页面重试");
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [insuranceType]);

  // 自动滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 报告生成后的动画
  useEffect(() => {
    if (report) {
      setTimeout(() => setProbAnimated(true), 100);
    }
  }, [report]);

  // 自动保存会话
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const sessionData: SessionData = {
        sessionId,
        insuranceType,
        // Bug 5 修复：将 api.ts 的 PolicyInfo 字段映射到 sessionManager 期望的字段名
        policyInfo: policyInfo
          ? {
            policyNumber: policyInfo.policyNumber,
            company: policyInfo.insurerName,
            type: policyInfo.productName,
            amount: policyInfo.coverageAmount !== undefined ? String(policyInfo.coverageAmount) : undefined,
            validFrom: policyInfo.effectiveDate,
            validTo: policyInfo.expiryDate,
          }
          : undefined,
        messages: messages.map((m) => ({
          role: (m.role === "user" || m.role === "assistant" ? m.role : "user") as "user" | "assistant",
          content: m.content,
          timestamp: m.timestamp || new Date().toISOString(),
        })),
        report: report
          ? {
            probability: report.claimProbability,
            coverageAnalysis: report.coverageAnalysis.map((item) => `${item.item}: ${item.detail}`),
            requiredDocuments: report.requiredDocuments.map((doc) => `${doc.name}${doc.required ? " (必需)" : ""}`),
            claimProcess: report.claimProcess.map((step) => `${step.step}. ${step.title}: ${step.description}`),
          }
          : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveSession(sessionData);
    }
  }, [sessionId, messages, report, policyInfo, insuranceType]);

  // 险种切换时重置字段状态
  useEffect(() => {
    setFieldStatuses(new Map());
  }, [insuranceType]);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        sessionId,
        messages: newMessages,
        insuranceType,
        policyInfo,
      });
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Bug 6 修复：先 append AI 消息，再用 AI 消息的实际索引作为 key
      if (policyInfo && policyInfo.policyText) {
        const { searchPolicyClauses } = await import("@/lib/policyCache");
        const relevantClauses = searchPolicyClauses(policyInfo.policyText, content, 3);
        const aiMsgIndex = newMessages.length;
        setClauseRelevance((prev) => {
          const next = new Map(prev);
          next.set(aiMsgIndex, relevantClauses);
          return next;
        });
      }

      if (response.isComplete) setCanGenerateReport(true);
      if (response.completenessScore !== undefined) {
        setCompletenessScore(response.completenessScore);
      }

      // 处理字段更新
      if (response.fieldUpdates && response.fieldUpdates.length > 0) {
        setFieldStatuses((prev) => {
          const next = new Map(prev);
          response.fieldUpdates!.forEach((update: FieldUpdate) => {
            next.set(update.name, { status: update.status, note: update.note });
          });
          return next;
        });

        // 如果有字段确认，自动触发报告生成/刷新
        const hasConfirmed = response.fieldUpdates.some((u: FieldUpdate) => u.status === "confirmed");
        if (hasConfirmed) {
          // 异步生成报告，不阻塞对话
          const requestVersion = ++reportRequestVersionRef.current;
          setTimeout(async () => {
            try {
              const updatedMessages = [...newMessages, aiMsg];
              const result = await generateClaimAssessment(sessionId, updatedMessages, insuranceType, policyInfo);
              if (requestVersion !== reportRequestVersionRef.current) return;
              setReport(result);
              setProbAnimated(false);
            } catch {
              // 静默失败，不影响对话体验
            }
          }, 500);
        }
      }
    } catch {
      toast.error("发送失败，请检查网络连接后重试");
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, sessionId, insuranceType, policyInfo, clauseRelevance]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Issue #4 修复：刷新报告——重新调用 AI 生成最新报告
  const handleRefreshReport = async () => {
    setIsGeneratingReport(true);
    const requestVersion = ++reportRequestVersionRef.current;
    try {
      const result = await generateClaimAssessment(sessionId, messages, insuranceType, policyInfo);
      if (requestVersion !== reportRequestVersionRef.current) return;
      setReport(result);
      setProbAnimated(false);
      setActiveReportTab("overview");
      toast.success("报告已按最新信息重新生成");
    } catch {
      toast.error("报告刷新失败，请稍后重试");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // 切换险种类型时开启新的咨询上下文，避免旧报告继续显示
  const handleChangeInsuranceType = async (newType: InsuranceType) => {
    if (newType === insuranceType) {
      setShowTypeDropdown(false);
      return;
    }

    const previousSessionId = sessionId;
    reportRequestVersionRef.current += 1;
    setInsuranceType(newType);
    setShowTypeDropdown(false);
    setIsGeneratingReport(false);
    setReport(null);
    setCanGenerateReport(false);
    setCompletenessScore(0);
    setProbAnimated(false);
    setFieldStatuses(new Map());
    setClauseRelevance(new Map());
    setActiveReportTab("overview");
    toast.info(`已切换为「${TYPE_LABELS[newType]}」`);

    if (previousSessionId) {
      const { clearReportCache } = await import("@/lib/reportCache");
      clearReportCache(previousSessionId);
    }
  };

  const toggleDocExpand = (i: number) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  /*PDF 导出：使用 html2canvas + jsPDF 导出右侧面板内容
  const handleExportReport = async () => {
    if (!reportPanelRef.current) return;
    toast.info("正在生成 PDF...");
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const jsPDF = (await import("jspdf")).jsPDF;

      const canvas = await html2canvas(reportPanelRef.current, {
        backgroundColor: "#1C1C1E",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`理赔评估报告_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.pdf`);
      toast.success("PDF 导出成功");
    } catch (err) {
      console.error(err);
      toast.error("PDF 导出失败，请重试");
    }
  };*/
  const handleExportReport = () => {
    if (!report) {
      toast.info("当前还没有可导出的报告");
      return;
    }

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    doc.addFileToVFS("NotoSansSC-Regular.ttf", notoSansSCRegular);
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal");
    doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "bold");
    doc.setFont("NotoSansSC");

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addPageIfNeeded = (height = 10) => {
      if (y + height > 280) {
        doc.addPage();
        y = 20;
      }
    };

    const addText = (
      text: string,
      options?: {
        size?: number;
        bold?: boolean;
        gap?: number;
      }
    ) => {
      const size = options?.size ?? 11;
      doc.setFontSize(size);
      doc.setFont("NotoSansSC", options?.bold ? "bold" : "normal");

      const lines = doc.splitTextToSize(text || "", maxWidth);
      const lineHeight = size * 0.45;

      addPageIfNeeded(lines.length * lineHeight + 4);

      doc.text(lines, margin, y);
      y += lines.length * lineHeight + (options?.gap ?? 5);
    };

    const addSectionTitle = (title: string) => {
      y += 4;
      addPageIfNeeded(14);
      doc.setFontSize(15);
      doc.setFont("NotoSansSC", "bold");
      doc.text(title, margin, y);
      y += 4;
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    };

    const addCard = (title: string, body: string) => {
      const titleLines = doc.splitTextToSize(title || "", maxWidth - 8);
      const bodyLines = doc.splitTextToSize(body || "", maxWidth - 8);
      const cardHeight = 8 + titleLines.length * 5 + bodyLines.length * 5 + 6;

      addPageIfNeeded(cardHeight);

      doc.setDrawColor(220);
      doc.roundedRect(margin, y, maxWidth, cardHeight, 2, 2);

      y += 7;
      doc.setFontSize(11);
      doc.setFont("NotoSansSC", "bold");
      doc.text(titleLines, margin + 4, y);

      y += titleLines.length * 5 + 2;
      doc.setFontSize(10);
      doc.setFont("NotoSansSC", "normal");
      doc.text(bodyLines, margin + 4, y);

      y += bodyLines.length * 5 + 8;
    };
    try {
      addText("理赔准备报告", { size: 20, bold: true, gap: 3 });
      addText("本报告用于整理理赔准备信息，不构成理赔结论。", {
        size: 10,
        gap: 8,
      });
      addSectionTitle("二、待确认保障方向");
      report.coverageAnalysis.forEach((item) => {
        addCard(item.item, item.detail);
      });

      addSectionTitle("三、建议准备材料");
      report.requiredDocuments.forEach((docItem) => {
        addCard(
          `${docItem.name}${docItem.required ? "（建议准备）" : ""}`,
          `${docItem.description}${docItem.tips ? `\n提示：${docItem.tips}` : ""}`
        );
      });

      addSectionTitle("四、后续流程建议");
      report.claimProcess.forEach((step) => {
        addCard(
          `${step.step}. ${step.title}`,
          `${step.description}${step.estimatedTime ? `\n预计时间：${step.estimatedTime}` : ""
          }`
        );
      });

      if (report.notes) {
        addSectionTitle("五、备注");
        addText(report.notes);
      }

      addSectionTitle("免责声明");
      addText(report.disclaimer || "最终结果以保险公司审核为准。", {
        size: 10,
      });

      doc.save(`理赔准备报告_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF 已导出");
    } catch (err) {
      console.error(err);
      toast.error("PDF 导出失败");
    }
  };

  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: "#F59E0B" }} />
          <p>正在初始化会话...</p>
        </div>
      </div>
    );
  }

  // 当前险种字段列表
  const currentFields = INSURANCE_FIELDS[insuranceType] || INSURANCE_FIELDS.other;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ── Top Bar ── */}
      <header
        className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border flex-shrink-0"
        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            返回
          </button>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "#F59E0B" }} />
            <span
              className="text-sm font-semibold"
              style={{ color: "#F59E0B", fontFamily: "'Playfair Display', serif" }}
            >
              理赔通
            </span>
          </div>
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            {TYPE_LABELS[insuranceType]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Issue #4 修复：险种切换下拉菜单 */}
          <div className="relative" ref={typeDropdownRef}>
            <button
              onClick={() => setShowTypeDropdown((v) => !v)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:border-amber-500/50 transition-colors"
              style={{ backgroundColor: "rgba(245,158,11,0.08)", color: "#F59E0B" }}
            >
              {TYPE_LABELS[insuranceType]}
              <ChevronDownIcon className="w-3 h-3" />
            </button>
            {showTypeDropdown && (
              <div
                className="absolute right-0 top-full mt-1 z-50 rounded-lg border border-border shadow-lg overflow-hidden"
                style={{ backgroundColor: "var(--card)", minWidth: "120px" }}
              >
                {(Object.entries(TYPE_LABELS) as [InsuranceType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => handleChangeInsuranceType(type)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors"
                    style={{
                      color: type === insuranceType ? "#F59E0B" : "var(--foreground)",
                      backgroundColor: type === insuranceType ? "rgba(245,158,11,0.08)" : "transparent",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-border"
            onClick={() => setShowPolicyModal(true)}
          >
            <FileText className="w-3.5 h-3.5" />
            {policyInfo ? "已上传保单" : "上传保单"}
          </Button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(245,158,11,0.1)" }}
                  >
                    <Bot className="w-5 h-5" style={{ color: "#F59E0B" }} />
                  </div>
                )}
                <div className="flex-1 max-w-lg">
                  <div
                    className={`px-4 py-2 rounded-lg ${msg.role === "user" ? "text-white" : "text-foreground"
                      }`}
                    style={{
                      backgroundColor:
                        msg.role === "user" ? "#F59E0B" : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === "assistant" && clauseRelevance.has(i) && (clauseRelevance.get(i)?.length ?? 0) > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="text-xs font-semibold text-amber-400 px-1">引用条款</div>
                      <div className="space-y-1">
                        {clauseRelevance.get(i)?.map((clause: any, idx: number) => (
                          <div key={idx} className="text-xs bg-black/30 hover:bg-black/40 transition-colors p-2 rounded border border-amber-500/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-amber-300">{clause.section}</span>
                              <span className="text-amber-400 font-bold">{Math.round(clause.relevanceScore * 100)}%</span>
                            </div>
                            <p className="text-gray-300 line-clamp-2">{clause.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(245,158,11,0.1)" }}
                >
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#F59E0B" }} />
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: "#F59E0B" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: "#F59E0B", animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: "#F59E0B", animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述您的理赔情况或提出问题..."
                className="resize-none text-sm"
                rows={3}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="self-end"
                style={{ backgroundColor: "#F59E0B", color: "#1C1C1E" }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Info Summary Panel */}
        <div
          ref={reportPanelRef}
          data-print-panel
          className="w-96 border-l border-border flex flex-col overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          {!hasStartedChat ? (
            /* ── 空白引导状态 ── */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Shield className="w-12 h-12 mb-4 opacity-20" style={{ color: "#9CA3AF" }} />
              <p className="text-sm font-medium text-muted-foreground mb-2">
                请先描述您的情况，再生成报告
              </p>
              <p className="text-xs text-muted-foreground mb-1">
                请先描述您的情况
              </p>
              <p className="text-xs text-muted-foreground">
                您输入信息后，右侧会自动整理成理赔准备报告。
              </p>
            </div>
          ) : (
            <>
              {/* ── 顶部操作栏 ── */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 border-border"
                  onClick={() => setShowPolicyModal(true)}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {policyInfo ? "已上传保单" : "上传保单"}
                </Button>
                <div className="flex items-center gap-2">
                  {(report || canGenerateReport) && (
                    <button
                      onClick={handleRefreshReport}
                      disabled={isGeneratingReport}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:border-amber-500/50 transition-colors"
                      style={{ backgroundColor: "rgba(245,158,11,0.08)", color: "#F59E0B" }}
                      title="按最新对话内容重新生成报告"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGeneratingReport ? "animate-spin" : ""}`} />
                    </button>
                  )}
                  <Button
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={handleExportReport}
                    style={{ backgroundColor: "#F59E0B", color: "#1C1C1E" }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出报告
                  </Button>
                </div>
              </div>

              {/* ── Tab 切换 ── */}
              <div className="border-b border-border px-4 py-2 flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setActiveReportTab("overview")}
                  className={`text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1`}
                  style={{
                    backgroundColor: activeReportTab === "overview" ? "#F59E0B" : "transparent",
                    color: activeReportTab === "overview" ? "#1C1C1E" : "var(--muted-foreground)",
                  }}
                >
                  <TrendingUp className="w-3 h-3" />
                  概览
                </button>
                <button
                  onClick={() => setActiveReportTab("documents")}
                  className={`text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1`}
                  style={{
                    backgroundColor: activeReportTab === "documents" ? "#F59E0B" : "transparent",
                    color: activeReportTab === "documents" ? "#1C1C1E" : "var(--muted-foreground)",
                  }}
                >
                  <ClipboardList className="w-3 h-3" />
                  材料
                </button>
                <button
                  onClick={() => setActiveReportTab("process")}
                  className={`text-xs font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-1`}
                  style={{
                    backgroundColor: activeReportTab === "process" ? "#F59E0B" : "transparent",
                    color: activeReportTab === "process" ? "#1C1C1E" : "var(--muted-foreground)",
                  }}
                >
                  <Shield className="w-3 h-3" />
                  流程
                </button>
              </div>

              {/* ── Tab 内容 ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* ── 概览 Tab ── */}
                {activeReportTab === "overview" && (
                  <>
                    {/* 当前情况整理 */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">当前情况整理</p>
                      {report ? (
                        <>
                          <p className="text-sm font-semibold text-foreground mb-1">
                            {report.incidentSummary}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            本报告基于当前对话已整理的信息（完整度 {completenessScore}%），
                            {completenessScore >= 60 ? "可评估理赔概率。" : "不评估理赔概率。"}
                          </p>
                          {/* 理赔可能性 */}
                          {completenessScore >= 60 && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">理赔可能性</span>
                                <Badge
                                  style={{
                                    backgroundColor: `${getProbabilityColor(report.claimProbability)}20`,
                                    color: getProbabilityColor(report.claimProbability),
                                    border: `1px solid ${getProbabilityColor(report.claimProbability)}40`,
                                  }}
                                >
                                  {probAnimated ? report.claimProbability : 0}% · {getProbabilityLabel(report.claimProbability)}
                                </Badge>
                              </div>
                              <div
                                className="w-full h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    backgroundColor: getProbabilityColor(report.claimProbability),
                                    width: probAnimated ? `${report.claimProbability}%` : "0%",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-foreground mb-1">
                            用户正在补充理赔相关信息。
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            本报告基于当前对话已整理的信息（完整度 {completenessScore}%），不评估理赔概率。
                          </p>
                        </>
                      )}
                    </div>

                    {/* 待确认保障方向 */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">待确认保障方向</p>
                      <div className="space-y-2">
                        {currentFields.map((field) => {
                          const status = fieldStatuses.get(field.name);
                          const isConfirmed = status?.status === "confirmed";
                          return (
                            <div
                              key={field.name}
                              className="flex items-start gap-3 p-3 rounded-lg border transition-colors"
                              style={{
                                borderColor: isConfirmed ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.08)",
                                backgroundColor: isConfirmed ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.02)",
                              }}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {isConfirmed ? (
                                  <CheckSquare className="w-4 h-4" style={{ color: "#22C55E" }} />
                                ) : (
                                  <Square className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground">{field.name}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                  {status?.note || field.hint}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 保险范围分析（有报告时显示） */}
                    {report && report.coverageAnalysis.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">保险范围分析</p>
                        <div className="space-y-2">
                          {report.coverageAnalysis.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 p-2 rounded"
                              style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                            >
                              {item.covered ? (
                                <CheckSquare className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                              ) : (
                                <Square className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground">{item.item}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 免责声明 */}
                    <div
                      className="p-3 rounded-lg border text-xs text-muted-foreground"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.02)",
                        borderColor: "rgba(255,255,255,0.08)",
                      }}
                    >
                      <p className="font-semibold mb-1">免责声明</p>
                      <p className="leading-relaxed">
                        {report?.disclaimer || "本报告仅用于理赔信息整理和材料准备，不构成理赔结论。最终结果以保险公司审核为准。"}
                      </p>
                    </div>
                  </>
                )}

                {/* ── 材料 Tab ── */}
                {activeReportTab === "documents" && (
                  <>
                    {report && report.requiredDocuments.length > 0 ? (
                      <div className="space-y-2">
                        {report.requiredDocuments.map((doc, i) => (
                          <div
                            key={i}
                            className="rounded-lg border overflow-hidden"
                            style={{ borderColor: "rgba(255,255,255,0.1)" }}
                          >
                            <button
                              onClick={() => toggleDocExpand(i)}
                              className="w-full flex items-center justify-between p-3 text-left hover:bg-accent/50 transition-colors"
                              style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "#F59E0B" }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                                  {doc.required && (
                                    <Badge
                                      className="text-xs mt-1"
                                      style={{
                                        backgroundColor: "rgba(239,68,68,0.1)",
                                        color: "#EF4444",
                                        border: "none",
                                      }}
                                    >
                                      必需
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {expandedDocs.has(i) ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>
                            {expandedDocs.has(i) && (
                              <div
                                className="px-3 pb-3 pt-0 text-xs text-muted-foreground space-y-1"
                                style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                              >
                                <p>{doc.description}</p>
                                {doc.tips && (
                                  <div className="flex gap-2 mt-2 p-2 rounded" style={{ backgroundColor: "rgba(245,158,11,0.05)" }}>
                                    <Info className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                                    <span>{doc.tips}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ClipboardList className="w-10 h-10 mb-3 opacity-20" style={{ color: "#9CA3AF" }} />
                        <p className="text-xs text-muted-foreground">
                          继续描述您的理赔情况，<br />材料清单将自动生成
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* ── 流程 Tab ── */}
                {activeReportTab === "process" && (
                  <>
                    {report && report.claimProcess.length > 0 ? (
                      <div className="space-y-3">
                        {report.claimProcess.map((step, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                style={{ backgroundColor: "#F59E0B", color: "#1C1C1E" }}
                              >
                                {step.step}
                              </div>
                              {i < report.claimProcess.length - 1 && (
                                <div
                                  className="w-0.5 h-8 mt-1"
                                  style={{ backgroundColor: "rgba(245,158,11,0.3)" }}
                                />
                              )}
                            </div>
                            <div className="flex-1 pt-0.5">
                              <p className="text-sm font-medium text-foreground">{step.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed mt-1">{step.description}</p>
                              {step.estimatedTime && (
                                <p className="text-xs mt-1" style={{ color: "#F59E0B" }}>
                                  预计 {step.estimatedTime}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Shield className="w-10 h-10 mb-3 opacity-20" style={{ color: "#9CA3AF" }} />
                        <p className="text-xs text-muted-foreground">
                          继续描述您的理赔情况，<br />理赔流程将自动生成
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Policy Modal */}
      <PolicyInfoModal
        open={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        value={policyInfo}
        onChange={setPolicyInfo}
        sessionId={sessionId}
        insuranceType={insuranceType}
      />

      {/* ── 打印样式（PDF 导出用） ── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-print-panel], [data-print-panel] * { visibility: visible; }
          [data-print-panel] {
            position: fixed;
            left: 0; top: 0;
            width: 100%;
            height: auto;
            overflow: visible;
            background: white;
            color: black;
          }
        }
      `}</style>
    </div>
  );
}
