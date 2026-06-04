/**
 * sessionManager.ts — 会话历史管理
 * 功能：
 * - 保存和恢复咨询会话
 * - 管理会话列表
 * - 支持会话对比
 * - 支持会话删除和导出
 */

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SessionData {
  sessionId: string;
  insuranceType: string;
  policyInfo?: {
    policyNumber?: string;
    company?: string;
    type?: string;
    amount?: string;
    validFrom?: string;
    validTo?: string;
  };
  uploadedPolicyId?: string;
  messages: SessionMessage[];
  report?: {
    probability: number;
    coverageAnalysis: string[];
    requiredDocuments: string[];
    claimProcess: string[];
  };
  createdAt: string;
  updatedAt: string;
  title?: string;
  summary?: string;
}

const SESSION_STORAGE_KEY = "claim_sessions";
const MAX_SESSIONS = 20;

/**
 * 获取所有会话
 */
export function getAllSessions(): SessionData[] {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 获取单个会话
 */
export function getSession(sessionId: string): SessionData | null {
  const sessions = getAllSessions();
  return sessions.find((s) => s.sessionId === sessionId) || null;
}

/**
 * 保存会话
 */
export function saveSession(session: SessionData): void {
  const sessions = getAllSessions();
  const existingIndex = sessions.findIndex((s) => s.sessionId === session.sessionId);

  if (existingIndex >= 0) {
    sessions[existingIndex] = {
      ...sessions[existingIndex],
      ...session,
      updatedAt: new Date().toISOString(),
    };
  } else {
    sessions.unshift({
      ...session,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 保持最多 20 个会话
  if (sessions.length > MAX_SESSIONS) {
    sessions.pop();
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
}

/**
 * 删除会话
 */
export function deleteSession(sessionId: string): void {
  const sessions = getAllSessions();
  const filtered = sessions.filter((s) => s.sessionId !== sessionId);
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 清空所有会话
 */
export function clearAllSessions(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * 生成会话摘要标题
 */
export function generateSessionTitle(session: SessionData): string {
  if (session.title) return session.title;

  const insuranceTypeLabel: Record<string, string> = {
    health: "健康险",
    life: "寿险",
    accident: "意外险",
    property: "财产险",
    liability: "责任险",
    travel: "旅行险",
    other: "其他险种",
  };

  const typeLabel = insuranceTypeLabel[session.insuranceType] || session.insuranceType;
  const date = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });

  // 从第一条用户消息提取关键词
  const firstUserMsg = session.messages.find((m) => m.role === "user");
  if (firstUserMsg) {
    const content = firstUserMsg.content.substring(0, 20);
    return `${typeLabel} - ${content}... (${dateStr})`;
  }

  return `${typeLabel} 咨询 (${dateStr})`;
}

/**
 * 生成会话摘要
 */
export function generateSessionSummary(session: SessionData): string {
  const messageCount = session.messages.length;
  const hasReport = !!session.report;
  const probability = session.report?.probability || 0;

  let summary = `共 ${messageCount} 条消息`;

  if (hasReport) {
    summary += ` • 理赔概率 ${probability}%`;
  }

  if (session.policyInfo?.company) {
    summary += ` • ${session.policyInfo.company}`;
  }

  return summary;
}

/**
 * 导出会话为 JSON
 */
export function exportSessionAsJSON(session: SessionData): string {
  return JSON.stringify(session, null, 2);
}

/**
 * 导出会话为 Markdown
 */
export function exportSessionAsMarkdown(session: SessionData): string {
  let md = `# 理赔咨询记录\n\n`;
  md += `**险种**: ${session.insuranceType}\n`;
  md += `**创建时间**: ${new Date(session.createdAt).toLocaleString("zh-CN")}\n\n`;

  if (session.policyInfo) {
    md += `## 保单信息\n\n`;
    if (session.policyInfo.company) md += `- **保险公司**: ${session.policyInfo.company}\n`;
    if (session.policyInfo.policyNumber) md += `- **保单号**: ${session.policyInfo.policyNumber}\n`;
    if (session.policyInfo.amount) md += `- **保额**: ${session.policyInfo.amount}\n`;
    md += `\n`;
  }

  md += `## 对话记录\n\n`;
  session.messages.forEach((msg) => {
    const role = msg.role === "user" ? "**用户**" : "**顾问**";
    md += `${role}: ${msg.content}\n\n`;
  });

  if (session.report) {
    md += `## 理赔评估报告\n\n`;
    md += `**理赔可能性**: ${session.report.probability}%\n\n`;

    if (session.report.coverageAnalysis.length > 0) {
      md += `### 保险范围分析\n\n`;
      session.report.coverageAnalysis.forEach((item) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (session.report.requiredDocuments.length > 0) {
      md += `### 所需材料\n\n`;
      session.report.requiredDocuments.forEach((item) => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (session.report.claimProcess.length > 0) {
      md += `### 理赔流程\n\n`;
      session.report.claimProcess.forEach((step, i) => {
        md += `${i + 1}. ${step}\n`;
      });
      md += `\n`;
    }
  }

  return md;
}

/**
 * 计算会话统计信息
 */
export function getSessionStats(sessions: SessionData[]) {
  const stats = {
    totalSessions: sessions.length,
    byType: {} as Record<string, number>,
    avgMessages: 0,
    avgProbability: 0,
    sessionsWithReport: 0,
  };

  sessions.forEach((session) => {
    // 按险种统计
    stats.byType[session.insuranceType] = (stats.byType[session.insuranceType] || 0) + 1;

    // 有报告的会话
    if (session.report) {
      stats.sessionsWithReport++;
      stats.avgProbability += session.report.probability;
    }

    // 平均消息数
    stats.avgMessages += session.messages.length;
  });

  if (stats.sessionsWithReport > 0) {
    stats.avgProbability = Math.round(stats.avgProbability / stats.sessionsWithReport);
  }

  if (sessions.length > 0) {
    stats.avgMessages = Math.round(stats.avgMessages / sessions.length);
  }

  return stats;
}

/**
 * 搜索会话
 */
export function searchSessions(query: string): SessionData[] {
  const sessions = getAllSessions();
  const lowerQuery = query.toLowerCase();

  return sessions.filter((session) => {
    const title = generateSessionTitle(session).toLowerCase();
    const summary = generateSessionSummary(session).toLowerCase();
    const messageContent = session.messages
      .map((m) => m.content)
      .join(" ")
      .toLowerCase();

    return title.includes(lowerQuery) || summary.includes(lowerQuery) || messageContent.includes(lowerQuery);
  });
}

/**
 * 比较两个会话的理赔概率
 */
export function compareSessionProbabilities(
  session1: SessionData,
  session2: SessionData
): {
  session1: { id: string; probability: number };
  session2: { id: string; probability: number };
  difference: number;
  recommendation: string;
} {
  const prob1 = session1.report?.probability || 0;
  const prob2 = session2.report?.probability || 0;
  const diff = prob1 - prob2;

  let recommendation = "";
  if (Math.abs(diff) < 10) {
    recommendation = "两个方案的理赔概率相近，建议根据其他因素选择";
  } else if (diff > 0) {
    recommendation = `第一个方案理赔概率更高，建议优先采用`;
  } else {
    recommendation = `第二个方案理赔概率更高，建议优先采用`;
  }

  return {
    session1: { id: session1.sessionId, probability: prob1 },
    session2: { id: session2.sessionId, probability: prob2 },
    difference: Math.abs(diff),
    recommendation,
  };
}
