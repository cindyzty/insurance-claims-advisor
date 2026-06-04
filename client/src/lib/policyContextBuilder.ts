/**
 * policyContextBuilder.ts
 *
 * 构建保单信息上下文，供 AI 使用
 * 将上传的保单信息转换为 AI 可理解的系统提示
 */

import type { PolicyInfo, InsuranceType } from './api';

/**
 * 构建保单信息上下文供 AI 使用
 */
export function buildPolicyContext(
  policyInfo: PolicyInfo,
  insuranceType: InsuranceType
): string {
  const parts: string[] = [
    '你是专业保险理赔顾问。用户已上传保单，请基于以下保单信息提供理赔建议：',
    '',
  ];

  if (policyInfo.productName) {
    parts.push(`产品名称：${policyInfo.productName}`);
  }

  if (policyInfo.insurerName) {
    parts.push(`保险公司：${policyInfo.insurerName}`);
  }

  if (policyInfo.policyNumber) {
    parts.push(`保单号：${policyInfo.policyNumber}`);
  }

  if (policyInfo.coverageAmount) {
    parts.push(`保额：${policyInfo.coverageAmount} 元`);
  }

  if (policyInfo.coverageDetails) {
    parts.push(`保障范围：${policyInfo.coverageDetails}`);
  }

  if (policyInfo.effectiveDate) {
    parts.push(`生效日期：${policyInfo.effectiveDate}`);
  }

  if (policyInfo.expiryDate) {
    parts.push(`到期日期：${policyInfo.expiryDate}`);
  }

  // 修复：不再把完整 PDF 文本全部注入（会导致 token 超限、内容返回空）
  // 改为只提示 AI 保单已上传，具体条款通过追问时在对话中提供
  if (policyInfo.policyText) {
    parts.push('');
    parts.push(`注意：用户已上传保单条款文件（共 ${Math.round(policyInfo.policyText.length / 1000)}k 字）。请基于保单摘要信息回答用户问题。如需引用具体条款，请告知用户可在当前界面查看“引用条款”区块。`);
  }

  // 添加保单摘要信息
  if (policyInfo.policySummary) {
    const summary = policyInfo.policySummary;

    if (summary.coverageTypes && summary.coverageTypes.length > 0) {
      parts.push(`保障类型：${summary.coverageTypes.join('、')}`);
    }

    if (summary.waitingPeriod) {
      parts.push(`等待期：${summary.waitingPeriod}`);
    }

    if (summary.maxClaimAge) {
      parts.push(`最高理赔年龄：${summary.maxClaimAge}`);
    }

    if (summary.keyExclusions && summary.keyExclusions.length > 0) {
      parts.push(`关键排除：${summary.keyExclusions.join('、')}`);
    }

    if (summary.highlights && summary.highlights.length > 0) {
      parts.push(`关键提示：${summary.highlights.join('、')}`);
    }
  }

  parts.push('');
  parts.push('请根据用户的具体情况，结合上述保单信息，提供专业的理赔建议。');
  parts.push('如果用户的情况不在保单覆盖范围内，请明确指出。');
  parts.push('在每次回复末尾，必须附加一行：[COMPLETENESS:数字]，其中数字为 0-100 的整数，表示当前已收集到的理赔信息完整度。计算规则：每收集到一项关键信息（事故经过、事发时间、事发地点、损失金额、保单号、医院名称、诊断结果、已有材料、费用金额、社保情况）各占 10 分。示例：用户仅说明了事故经过，返回 [COMPLETENESS:10]；如果还提供了时间和医院，返回 [COMPLETENESS:30]。');
  parts.push('当你已经收集到足够的信息（包括：事故经过、保单信息、损失情况）可以生成理赔评估报告时，在回复末尾附加 [INFO_COMPLETE] 标记。');

  return parts.join('\n');
}

/**
 * 构建带有保单上下文的消息列表
 */
export function buildMessagesWithPolicyContext(
  messages: Array<{ role: string; content: string }>,
  policyInfo?: PolicyInfo,
  insuranceType?: InsuranceType
): Array<{ role: string; content: string }> {
  const result: Array<{ role: string; content: string }> = [];

  if (policyInfo) {
    // 有保单信息：构建包含保单上下文的系统消息
    const policyContext = buildPolicyContext(policyInfo, insuranceType || 'other');
    result.push({
      role: 'system',
      content: policyContext,
    });
  } else {
    // 无保单信息：也要注入基础 System Prompt，确保 [INFO_COMPLETE] 指令生效
    const typeLabel: Record<string, string> = {
      health: '健康险/医疗险', life: '寿险', accident: '意外险',
      property: '财产险', liability: '责任险', travel: '旅行险', other: '保险'
    };
    const label = typeLabel[insuranceType || 'other'] || '保险';
    result.push({
      role: 'system',
      content: `你是一个专业的${label}理赔顾问。请通过追问收集用户的理赔信息，包括：事故经过、保单信息、损失情况。在每次回复末尾，必须附加一行：[COMPLETENESS:数字]，其中数字为 0-100 的整数，表示当前已收集到的理赔信息完整度。计算规则：每收集到一项关键信息（事故经过、事发时间、事发地点、损失金额、保单号、医院名称、诊断结果、已有材料、费用金额、社保情况）各占 10 分。当你已经收集到足够的信息可以生成理赔评估报告时，在回复末尾附加 [INFO_COMPLETE] 标记。`,
    });
  }

  // 添加原始消息
  result.push(...messages);

  return result;
}
