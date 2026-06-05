/**
 * ============================================================
 * API 服务层 — 保险理赔咨询平台
 * ============================================================
 * 所有与后端交互的接口均在此文件定义。
 * 请根据实际后端地址和接口规范填写以下配置。
 * ============================================================
 */

// ============================================================
// TODO: 填写您的后端 API 基础地址
// 示例: "https://api.yourdomain.com/v1" 或 "/api/v1"（同域代理）
// ============================================================
const API_BASE_URL = "https://api.siliconflow.cn/v1";
const MODEL_NAME = "nex-agi/Nex-N2-Pro";

// ============================================================
// TODO: 如需 API Key 认证，在此填写请求头配置
// 示例: { "Authorization": "Bearer YOUR_TOKEN" }
//       { "X-API-Key": "YOUR_API_KEY" }
// ============================================================
const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Authorization": "Bearer sk-ajrtbobovxlbpdinskwipfjhjkwqtztdddpgajgcbhpmdydt",
};

// ============================================================
// 类型定义
// ============================================================

/** 保险类型枚举 */
export type InsuranceType =
  | "health"      // 健康险 / 医疗险
  | "life"        // 寿险
  | "accident"    // 意外险
  | "property"    // 财产险（家财险、车险等）
  | "liability"   // 责任险
  | "travel"      // 旅行险
  | "other";      // 其他

/** 聊天消息角色 */
export type MessageRole = "user" | "assistant" | "system";

/** 单条聊天消息 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

/** 发送聊天消息的请求体 */
export interface ChatRequest {
  sessionId: string;
  messages: ChatMessage[];
  insuranceType: InsuranceType;
  policyInfo?: PolicyInfo;
}

/** 聊天接口响应 */
export interface ChatResponse {
  message: string;           // AI 回复内容
  sessionId: string;         // 会话 ID
  isComplete: boolean;       // 是否已收集足够信息，可生成报告
  completenessScore?: number; // 信息完整度分数（0-100），由 AI 根据已收集字段数量计算
  suggestedQuestions?: string[]; // 可选的追问建议
}

/** 保险条款摘要 */
export interface PolicySummary {
  productName: string;       // 产品名称
  coverageTypes: string[];   // 保障范围类型
  waitingPeriod: string;     // 等待期
  keyExclusions: string[];   // 关键排除责任
  maxClaimAge?: string;      // 最高理赔年龄
  highlights: string[];      // 关键提示
}

/** 保单信息 */
export interface PolicyInfo {
  policyNumber?: string;     // 保单号
  insurerName?: string;      // 保险公司名称
  productName?: string;      // 险种/产品名称
  coverageAmount?: number;   // 保额（元）
  coverageDetails?: string;  // 保障范围描述
  effectiveDate?: string;    // 生效日期
  expiryDate?: string;       // 到期日期
  policyId?: string;         // 上传条款的 ID
  policySummary?: PolicySummary; // 条款摘要
  uploadedAt?: string;       // 上传时间
  policyText?: string;       // 完整的 PDF 提取文本（用于 AI 分析）
}

/** 理赔评估报告 */
export interface ClaimAssessmentReport {
  sessionId: string;
  insuranceType: InsuranceType;
  incidentSummary: string;           // 事故/事件摘要
  claimProbability: number;          // 理赔可能性（0-100 的整数）
  probabilityReason: string;         // 可能性说明
  coverageAnalysis: CoverageItem[];  // 保险范围分析
  requiredDocuments: DocumentItem[]; // 所需理赔材料
  claimProcess: ProcessStep[];       // 理赔流程步骤
  estimatedAmount?: string;          // 预估赔付金额（可选）
  notes?: string;                    // 注意事项
  disclaimer: string;                // 免责声明
}

/** 保险范围分析条目 */
export interface CoverageItem {
  item: string;        // 保障项目名称
  covered: boolean;    // 是否在保障范围内
  detail: string;      // 详细说明
}

/** 理赔材料条目 */
export interface DocumentItem {
  name: string;        // 材料名称
  required: boolean;   // 是否必须
  description: string; // 说明
  tips?: string;       // 获取/准备提示
}

/** 理赔流程步骤 */
export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  estimatedTime?: string;  // 预计耗时
}

/** 保险范围查询请求 */
export interface CoverageQueryRequest {
  insuranceType: InsuranceType;
  policyInfo?: PolicyInfo;
  incidentDescription: string;
}

/** 保险范围查询响应 */
export interface CoverageQueryResponse {
  coverageItems: CoverageItem[];
  generalInfo: string;
}

// ============================================================
// 工具函数
// ============================================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// ============================================================
// API 接口函数
// ============================================================

/**
 * 发送聊天消息，获取 AI 理赔顾问回复
 *
 * TODO: 对接后端聊天接口
 * 建议接口: POST /chat/message
 * 请求体: ChatRequest
 * 响应体: ChatResponse
 *
 * 后端实现建议:
 * - 维护会话上下文（sessionId 关联历史消息）
 * - 基于保险类型和已收集信息，智能追问缺失信息
 * - 判断信息是否充足（isComplete = true 时触发报告生成）
 */
/**
 * 发送聊天消息，获取 AI 理赔顾问回复
 *
 * TODO: 对接后端聊天接口
 * 建议接口: POST /chat/message
 * 请求体: ChatRequest + 新增字段 { policyId?, relevantClauses? }
 * 响应体: ChatResponse
 *
 * 后端实现建议:
 * - 维护会话上下文（sessionId 关联历史消息）
 * - 如果提供了 policyId，调用 /policy/query 获取相关条款片段
 * - 在 System Prompt 中注入相关条款，提升 AI 回复的准确性
 * - 基于保险类型和已收集信息，智能追问缺失信息
 * - 判断信息是否充足（isComplete = true 时触发报告生成）
 * - 示例 Prompt:
 *   "用户的保单是：{productName}。相关条款如下：{relevantClauses}。基于这些条款，请回答用户的理赔问题..."
 */
export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  const { buildMessagesWithPolicyContext } = await import("./policyContextBuilder");
  
  // 构建包含保单信息的消息列表
  const messagesWithContext = buildMessagesWithPolicyContext(
    req.messages,
    req.policyInfo,
    req.insuranceType
  );
  
  return request<any>("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: messagesWithContext,
      temperature: 0.7,
      max_tokens: 2048,
      // 禁用 reasoning 模式，避免 thinking token 占满导致 content 为空
      thinking: { type: "disabled" },
    }),
  }).then((res: any) => {
    const rawMessage = res.choices?.[0]?.message?.content || "";
    // Bug 2 修复：通过 AI 在回复末尾附加 [INFO_COMPLETE] 标记来判断信息是否充足
    const isComplete = rawMessage.includes("[INFO_COMPLETE]");
    // Issue #2 修复：解析 [COMPLETENESS:N] 标记，获取信息完整度分数
    const completenessMatch = rawMessage.match(/\[COMPLETENESS:(\d+)\]/);
    const completenessScore = completenessMatch
      ? Math.min(100, Math.max(0, parseInt(completenessMatch[1], 10)))
      : undefined;
    const message = rawMessage
      .replace(/\[INFO_COMPLETE\]/g, "")
      .replace(/\[COMPLETENESS:\d+\]/g, "")
      .trim();
    return {
      message,
      sessionId: req.sessionId,
      isComplete,
      completenessScore,
    };
  });
}

/**
 * 生成理赔评估报告
 *
 * TODO: 对接后端报告生成接口
 * 建议接口: POST /claim/assessment
 * 请求体: { sessionId: string; messages: ChatMessage[]; insuranceType: InsuranceType; policyInfo?: PolicyInfo }
 * 响应体: ClaimAssessmentReport
 *
 * 后端实现建议:
 * - 基于完整对话历史提取关键信息
 * - 结合保单信息分析保险范围
 * - 给出理赔可能性评分（0-100）及原因
 * - 列出所需材料清单和理赔流程
 */
export async function generateClaimAssessment(
  sessionId: string,
  messages: ChatMessage[],
  insuranceType: InsuranceType,
  policyInfo?: PolicyInfo
): Promise<ClaimAssessmentReport> {
  // Bug 1 修复：构建详细的 System Prompt，要求 AI 返回符合 ClaimAssessmentReport 结构的 JSON
  // 不把完整 policyText 注入，改为只提取最相关的条款片段，避免 token 超限
  let relevantClausesText = "";
  if (policyInfo?.policyText) {
    const { searchPolicyClauses } = await import("./policyCache");
    // 用对话中最后一条用户消息作为搜索查询
    const lastUserMsg = messages.filter((m) => m.role === "user").slice(-1)[0]?.content || "";
    const clauses = searchPolicyClauses(policyInfo.policyText, lastUserMsg, 5);
    if (clauses.length > 0) {
      relevantClausesText = "\n\n相关条款片段：\n" + clauses.map((c) => `[${c.section}] ${c.content}`).join("\n");
    }
  }
  const policyContext = policyInfo
    ? `\n\n用户保单信息：产品名称=${policyInfo.productName || "未知"}，保险公司=${policyInfo.insurerName || "未知"}，保额=${policyInfo.coverageAmount ? policyInfo.coverageAmount + "元" : "未知"}，生效日=${policyInfo.effectiveDate || "未知"}，到期日=${policyInfo.expiryDate || "未知"}${relevantClausesText}`
    : "";

  const systemPrompt = `你是一个专业的保险理赔顾问。请基于用户提供的对话内容，生成一份详细的理赔评估报告。${policyContext}

请以如下 JSON 格式返回（不要包含任何 markdown 代码块标记）：
{
  "incidentSummary": "事故/就医情况简要描述，100字内",
  "claimProbability": 整数(0-100)，基于对话内容客观评估,
  "probabilityReason": "理赔可能性评估说明",
  "coverageAnalysis": [
    { "item": "保障项目名称", "covered": true/false, "detail": "详细说明" }
  ],
  "requiredDocuments": [
    { "name": "材料名称", "required": true/false, "description": "说明", "tips": "准备提示" }
  ],
  "claimProcess": [
    { "step": 1, "title": "步骤标题", "description": "步骤说明", "estimatedTime": "预计耗时" }
  ],
  "estimatedAmount": "预估赔付金额（可选）",
  "notes": "注意事项（可选）",
  "disclaimer": "免责声明"
}
要求：
1. coverageAnalysis 至少 3 条，包含主要保障项和常见除外责任
2. requiredDocuments 至少 5 条，包含必需和可选材料
3. claimProcess 至少 4 步，包含完整理赔流程
4. 根据对话内容客观分析，不要全部写成可能性高`;

  return request<any>("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.filter((m) => m.role === "user" || m.role === "assistant"),
      ],
      temperature: 0.3,
      max_tokens: 3000,
      thinking: { type: "disabled" },
    }),
  }).then((res: any) => {
    const content = res.choices?.[0]?.message?.content || "";
    
    // 尝试解析 AI 返回的 JSON
    let parsed: any = null;
    try {
      // 先尝试直接解析
      parsed = JSON.parse(content);
    } catch {
      // 如果直接解析失败，尝试提取 JSON 块
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = null;
        }
      }
    }

    if (parsed && typeof parsed.claimProbability === "number") {
      // 成功解析 AI 返回的结构化数据
      return {
        sessionId,
        insuranceType,
        incidentSummary: parsed.incidentSummary || content.substring(0, 200),
        claimProbability: Math.min(100, Math.max(0, Math.round(parsed.claimProbability))),
        probabilityReason: parsed.probabilityReason || "",
        coverageAnalysis: Array.isArray(parsed.coverageAnalysis) ? parsed.coverageAnalysis : [],
        requiredDocuments: Array.isArray(parsed.requiredDocuments) ? parsed.requiredDocuments : [],
        claimProcess: Array.isArray(parsed.claimProcess)
          ? parsed.claimProcess.map((s: any, i: number) => ({ ...s, step: s.step ?? i + 1 }))
          : [],
        estimatedAmount: parsed.estimatedAmount,
        notes: parsed.notes,
        disclaimer: parsed.disclaimer || "本报告仅供参考，不构成任何法律或保险专业意见。最终理赔结果以保险公司审核决定为准。",
      } as ClaimAssessmentReport;
    }

    // 解析失败时抛出错误，让上层展示错误提示
    console.warn("理赔评估报告 JSON 解析失败，AI 原始回复:", content.substring(0, 200));
    throw new Error("报告生成失败，AI 未返回有效的 JSON 格式，请重试");
  });
}

/**
 * 查询保险范围
 *
 * TODO: 对接后端保险范围查询接口
 * 建议接口: POST /coverage/query
 * 请求体: CoverageQueryRequest
 * 响应体: CoverageQueryResponse
 *
 * 后端实现建议:
 * - 根据险种和事故描述，返回相关保障范围说明
 * - 可结合保单信息给出个性化分析
 */
export async function queryCoverage(
  req: CoverageQueryRequest
): Promise<CoverageQueryResponse> {
  return request<CoverageQueryResponse>("/coverage/query", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

/**
 * 上传保险条款 PDF
 *
 * TODO: 对接后端 PDF 上传接口
 * 建议接口: POST /policy/upload (multipart/form-data)
 * 请求体: FormData { file, sessionId, insuranceType }
 * 响应体: {
 *   success: boolean,
 *   policyId: string,
 *   summary: PolicySummary,
 *   vectorId: string,
 *   processingTime: number
 * }
 *
 * 后端实现建议:
 * - 使用 PyPDF2/pdfplumber 提取 PDF 文本
 * - 使用 LLM 结构化输出（JSON Schema）提取关键信息
 * - 使用 OpenAI Embedding 或开源模型（BGE-base-zh）生成向量
 * - 存储向量到向量数据库（Pinecone/Weaviate）或本地 JSON
 * - 返回条款摘要给前端展示
 * - 预计处理时间: 2-5 秒
 */
export async function uploadPolicyPDF(
  sessionId: string,
  insuranceType: InsuranceType,
  file: File
): Promise<{
  policyId: string;
  summary: PolicySummary;
  fileName: string;
  policyText: string;
}> {
  const { extractTextFromPDF } = await import("./pdfExtractor");
  const { isPolicyCached, cachePolicy } = await import("./policyCache");
  
  try {
    const policyText = await extractTextFromPDF(file);
    
    const cached = isPolicyCached(policyText);
    if (cached) {
      console.log("条款已缓存，使用缓存数据");
      return {
        policyId: cached.policyId,
        summary: cached.summary,
        fileName: cached.fileName,
        policyText: cached.policyText,
      };
    }
    
    // 用 AI 真实解析 PDF 内容，提取保单摘要信息
    const policyId = `policy_${Date.now()}`;
    let summary: PolicySummary;
    try {
      const parsePrompt = `你是一个保险条款解析尓手。请从以下保单文本中提取关键信息，以 JSON 格式返回（不要包含 markdown 代码块标记）：
{
  "productName": "保险产品名称",
  "coverageTypes": ["主要保障项目1", "主要保障项目2"],
  "waitingPeriod": "等待期说明",
  "keyExclusions": ["除外责任1", "除外责任2"],
  "highlights": ["产品亮点1", "产品亮点2"]
}
保单文本（前3000字）：
${policyText.substring(0, 3000)}`;

      const parseRes = await request<any>("/chat/completions", {
        method: "POST",
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: "user", content: parsePrompt }],
          temperature: 0.1,
          max_tokens: 800,
          thinking: { type: "disabled" },
        }),
      });
      const parseContent = parseRes.choices?.[0]?.message?.content || "";
      let parsed: any = null;
      try { parsed = JSON.parse(parseContent); } catch {
        const m = parseContent.match(/\{[\s\S]*\}/);
        if (m) try { parsed = JSON.parse(m[0]); } catch { /* ignore */ }
      }
      summary = {
        productName: parsed?.productName || file.name.replace(/\.pdf$/i, ""),
        coverageTypes: Array.isArray(parsed?.coverageTypes) && parsed.coverageTypes.length > 0
          ? parsed.coverageTypes : ["保障范围请查阅条款"],
        waitingPeriod: parsed?.waitingPeriod || "请查阅条款",
        keyExclusions: Array.isArray(parsed?.keyExclusions) && parsed.keyExclusions.length > 0
          ? parsed.keyExclusions : ["请查阅除外责任条款"],
        highlights: Array.isArray(parsed?.highlights) && parsed.highlights.length > 0
          ? parsed.highlights : [],
      };
    } catch (parseErr) {
      console.warn("保单摘要解析失败，使用文件名占位:", parseErr);
      summary = {
        productName: file.name.replace(/\.pdf$/i, ""),
        coverageTypes: ["保障范围请查阅条款"],
        waitingPeriod: "请查阅条款",
        keyExclusions: ["请查阅除外责任条款"],
        highlights: [],
      };
    }

    const response = {
      policyId,
      summary,
      fileName: file.name,
      policyText,
    };
    
    // Bug 3 修复：使用 simpleHash 计算 policyText 的哈希值，确保缓存命中逻辑正常工作
    const computeHash = (text: string): string => {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    };
    cachePolicy({
      policyId: response.policyId,
      fileName: response.fileName,
      productName: response.summary.productName,
      policyText: response.policyText,
      summary: response.summary,
      uploadedAt: new Date().toISOString(),
      hash: computeHash(response.policyText),
    });
    
    return response;
  } catch (error) {
    console.error("PDF 上传失败:", error);
    throw error;
  }
}

/**
 * 查询相关条款片段（基于语义搜索）
 *
 * TODO: 对接后端条款查询接口
 * 建议接口: POST /policy/query
 * 请求体: { policyId, query, topK }
 * 响应体: {
 *   success: boolean,
 *   relevantClauses: Array<{
 *     section: string,
 *     content: string,
 *     relevanceScore: number
 *   }>
 * }
 *
 * 后端实现建议:
 * - 将用户查询转换为向量
 * - 在向量数据库中搜索相似条款片段
 * - 返回 topK 个最相关的条款片段
 * - 这样可避免每次都发送全文，节省 Token 消耗
 * - 在 /chat/message 中使用这些片段注入 System Prompt
 */
export async function queryPolicyClauses(
  policyId: string,
  query: string,
  topK: number = 3
): Promise<Array<{ section: string; content: string; relevanceScore: number }>> {
  return request<Array<{ section: string; content: string; relevanceScore: number }>>("/policy/query", {
    method: "POST",
    body: JSON.stringify({ policyId, query, topK }),
  });
}

/**
 * 创建新会话
 *
 * TODO: 对接后端会话创建接口
 * 建议接口: POST /session/create
 * 请求体: { insuranceType: InsuranceType }
 * 响应体: { sessionId: string; initialMessage: string }
 *
 * 后端实现建议:
 * - 生成唯一 sessionId
 * - 返回根据险种定制的开场白
 */
export async function createSession(
  insuranceType: InsuranceType
): Promise<{ sessionId: string; initialMessage: string }> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  return request<any>("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        {
          role: "user",
          content: `你是一个专业的保险理赔顾问。为一个需要处理${insuranceType}理赔的客户提供一个亲切、专业的开场白。`,
        },
      ],
      temperature: 0.8,
      max_tokens: 256,
      thinking: { type: "disabled" },
    }),
  }).then((res: any) => {
    const customMessage = res.choices?.[0]?.message?.content || getFallbackInitialMessage(insuranceType);
    return {
      sessionId,
      initialMessage: customMessage,
    };
  }).catch(() => {
    return {
      sessionId,
      initialMessage: getFallbackInitialMessage(insuranceType),
    };
  });
}

// 仅用于 AI 接口完全不可用时的网络故障回退（非 Mock 数据）
function getFallbackInitialMessage(type: InsuranceType): string {
  const typeLabel: Record<InsuranceType, string> = {
    health: "医疗/健康险",
    life: "寿险",
    accident: "意外险",
    property: "财产险",
    liability: "责任险",
    travel: "旅行险",
    other: "保险",
  };
  return `您好，我是您的专属理赔顾问。我将协助您处理${typeLabel[type] || "保险"}理赔事宜。

请先描述您的理赔情况，包括：事故经过、发生时间、损失情况等。`;
}
