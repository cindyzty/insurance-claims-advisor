/**
 * Consult.tsx — 核心咨询页面
 * Design: 「法律文书」深色专业风
 * Layout: 左侧 60% 聊天区 + 右侧 40% 报告区（分栏布局）
 *
 * 功能模块:
 * 1. 左侧：AI 智能问答对话（收集理赔信息）
 * 2. 右侧：实时生成的理赔评估报告
 *    - 理赔可能性仪表盘
 *    - 保险范围分析
 *    - 所需材料清单
 *    - 理赔流程步骤
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
  sendChatMessage,
  generateClaimAssessment,
  createSession,
} from "@/lib/api";
import PolicyInfoModal from "@/components/PolicyInfoModal";
import { saveSession, type SessionData } from "@/lib/sessionManager";

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
  const getInsuranceType = (): InsuranceType => {
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
  
  const insuranceType = getInsuranceType();

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

  const chatEndRef = useRef<HTMLDivElement>(null);

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
      // AI 消息索引 = newMessages.length（用户消息后的数组长度，即 AI 消息将被 push 到的位置）
      if (policyInfo && policyInfo.policyText) {
        const { searchPolicyClauses } = await import("@/lib/policyCache");
        const relevantClauses = searchPolicyClauses(policyInfo.policyText, content, 3);
        const aiMsgIndex = newMessages.length; // 等于 AI 消息在 messages 中的索引
        setClauseRelevance((prev) => {
          const next = new Map(prev);
          next.set(aiMsgIndex, relevantClauses);
          return next;
        });
      }
      if (response.isComplete) setCanGenerateReport(true);
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

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const result = await generateClaimAssessment(sessionId, messages, insuranceType, policyInfo);
      setReport(result);
      setProbAnimated(false);
      setActiveReportTab("overview");
      toast.success("理赔评估报告已生成");
    } catch {
      toast.error("报告生成失败，请稍后重试");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const toggleDocExpand = (i: number) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleExportReport = () => {
    toast.info("导出功能需对接后端 PDF 生成接口");
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
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-border"
            onClick={() => setShowPolicyModal(true)}
          >
            <FileText className="w-3.5 h-3.5" />
            {policyInfo ? "已上传保单" : "上传保单"}
          </Button>
          {report && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-border"
              onClick={handleExportReport}
            >
              <Download className="w-3.5 h-3.5" />
              导出报告
            </Button>
          )}
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
                    className={`px-4 py-2 rounded-lg ${
                      msg.role === "user" ? "text-white" : "text-foreground"
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

        {/* Right: Report */}
        <div className="w-96 border-l border-border flex flex-col overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
          {report ? (
            <>
              {/* Report Tabs */}
              <div className="border-b border-border px-4 py-3 flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setActiveReportTab("overview")}
                  className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
                    activeReportTab === "overview"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{
                    backgroundColor:
                      activeReportTab === "overview" ? "#F59E0B" : "transparent",
                  }}
                >
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  概览
                </button>
                <button
                  onClick={() => setActiveReportTab("documents")}
                  className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
                    activeReportTab === "documents"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{
                    backgroundColor:
                      activeReportTab === "documents" ? "#F59E0B" : "transparent",
                  }}
                >
                  <ClipboardList className="w-3 h-3 inline mr-1" />
                  材料
                </button>
                <button
                  onClick={() => setActiveReportTab("process")}
                  className={`text-xs font-medium px-3 py-1 rounded transition-colors ${
                    activeReportTab === "process"
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{
                    backgroundColor:
                      activeReportTab === "process" ? "#F59E0B" : "transparent",
                  }}
                >
                  <Shield className="w-3 h-3 inline mr-1" />
                  流程
                </button>
              </div>

              {/* Report Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeReportTab === "overview" && (
                  <>
                    {/* Probability */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">理赔可能性</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {probAnimated ? report.claimProbability : 0}%
                          </span>
                          <Badge
                            style={{
                              backgroundColor: `${getProbabilityColor(report.claimProbability)}20`,
                              color: getProbabilityColor(report.claimProbability),
                              border: `1px solid ${getProbabilityColor(report.claimProbability)}40`,
                            }}
                          >
                            {getProbabilityLabel(report.claimProbability)}
                          </Badge>
                        </div>
                        <div
                          className="w-full h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              backgroundColor: getProbabilityColor(report.claimProbability),
                              width: probAnimated ? `${report.claimProbability}%` : "0%",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Coverage Analysis */}
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
                  </>
                )}

                {activeReportTab === "documents" && (
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
                )}

                {activeReportTab === "process" && (
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Disclaimer */}
                <div
                  className="p-3 rounded-lg border text-xs text-muted-foreground"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <p className="font-semibold mb-1">免责声明</p>
                  <p className="leading-relaxed">{report.disclaimer}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                收集足够信息后，<br />
                点击下方按钮生成理赔评估报告
              </p>
              <Button
                onClick={handleGenerateReport}
                disabled={!canGenerateReport || isGeneratingReport}
                className="text-sm font-semibold"
                style={{ backgroundColor: "#F59E0B", color: "#1C1C1E" }}
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    生成评估报告
                  </>
                )}
              </Button>
            </div>
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
    </div>
  );
}
