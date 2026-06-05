/**
 * policyContextBuilder.ts
 *
 * 构建保单信息上下文，供 AI 使用
 * 将上传的保单信息转换为 AI 可理解的系统提示
 */

import type { PolicyInfo, InsuranceType } from './api';

/** 回复风格要求（所有场景通用） */
const REPLY_STYLE = `
【回复规范】
- 禁止客套话（不说"您好"、"感谢您的信任"、"很抱歉听到"等）
- 禁止复述条款原文或大段引用条款内容
- 直接给出结论和建议，每次回复不超过 150 字
- 如需追问，每次只问一个最关键的问题
- 格式：先给结论，再说建议，最后追问（如有）`.trim();

/**
 * 构建保单信息上下文供 AI 使用
 */
export function buildPolicyContext(
  policyInfo: PolicyInfo,
  insuranceType: InsuranceType
): string {
  const parts: string[] = [
    '你是专业保险理赔顾问。用户已上传保单，请基于以下保单信息提供理赔建议。',
    '',
    REPLY_STYLE,
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

  // 不再把完整 PDF 文本全部注入（会导致 token 超限）
  // 改为只提示 AI 保单已上传，具体条款通过引用条款区块展示
  if (policyInfo.policyText) {
    parts.push('');
    parts.push(`注意：用户已上传保单条款文件（共 ${Math.round(policyInfo.policyText.length / 1000)}k 字）。请基于保单摘要信息回答，具体条款用户可在界面"引用条款"区块查看，无需在回复中复述。`);
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
  parts.push('如果用户的情况不在保单覆盖范围内，请直接说明并给出替代建议。');
  parts.push('在每次回复末尾，必须附加：[COMPLETENESS:数字]（0-100 整数，每收集到一项关键信息各 10 分：事故经过、事发时间、事发地点、损失金额、保单号、医院名称、诊断结果、已有材料、费用金额、社保情况）。');
  parts.push('当已收集到足够信息（事故经过、保单信息、损失情况）可生成报告时，在末尾附加 [INFO_COMPLETE]。');

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
    // 无保单信息：注入基础 System Prompt
    const typeLabel: Record<string, string> = {
      health: '健康险/医疗险', life: '寿险', accident: '意外险',
      property: '财产险', liability: '责任险', travel: '旅行险', other: '保险'
    };
    const label = typeLabel[insuranceType || 'other'] || '保险';
    result.push({
      role: 'system',
      content: `你是专业的${label}理赔顾问。${REPLY_STYLE}

请通过追问收集用户的理赔信息（事故经过、保单信息、损失情况）。
在每次回复末尾，必须附加：[COMPLETENESS:数字]（0-100 整数，每收集到一项关键信息各 10 分：事故经过、事发时间、事发地点、损失金额、保单号、医院名称、诊断结果、已有材料、费用金额、社保情况）。
当已收集到足够信息可生成报告时，在末尾附加 [INFO_COMPLETE]。`,
    });
  }

  // 添加原始消息
  result.push(...messages);

  return result;
}
