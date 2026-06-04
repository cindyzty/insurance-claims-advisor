/**
 * policyAnalyzer.ts — 保险条款自动分析
 * 功能：
 * - 从条款文本中提取关键信息
 * - 生成理赔相关的智能问题
 * - 识别潜在的理赔风险
 */

export interface PolicyAnalysis {
  keyPoints: string[];
  potentialRisks: string[];
  suggestedQuestions: string[];
  coverage: {
    included: string[];
    excluded: string[];
  };
}

/**
 * 分析保险条款文本
 * 返回关键信息、风险提示和建议问题
 */
export function analyzePolicyText(policyText: string): PolicyAnalysis {
  const lowerText = policyText.toLowerCase();

  // 提取关键点
  const keyPoints = extractKeyPoints(policyText);

  // 识别潜在风险
  const potentialRisks = identifyRisks(lowerText);

  // 生成建议问题
  const suggestedQuestions = generateSuggestedQuestions(policyText);

  // 分析保障范围
  const coverage = analyzeCoverage(lowerText);

  return {
    keyPoints,
    potentialRisks,
    suggestedQuestions,
    coverage,
  };
}

/**
 * 提取关键点
 */
function extractKeyPoints(text: string): string[] {
  const keyPoints: string[] = [];
  const patterns = [
    /等待期[：:]\s*(\d+\s*(?:天|日|个月|年))/gi,
    /保额[：:]\s*([^。\n]+)/gi,
    /免赔额[：:]\s*([^。\n]+)/gi,
    /理赔比例[：:]\s*(\d+%)/gi,
    /最高赔付[：:]\s*([^。\n]+)/gi,
    /保障期限[：:]\s*([^。\n]+)/gi,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      keyPoints.push(match[1].trim());
    }
  });

  // 如果没有找到具体的关键点，添加通用提示
  if (keyPoints.length === 0) {
    keyPoints.push("建议仔细阅读保单条款中的保障范围部分");
    keyPoints.push("注意条款中的免赔额和等待期规定");
  }

  return keyPoints.slice(0, 5); // 最多返回 5 个关键点
}

/**
 * 识别潜在风险
 */
function identifyRisks(lowerText: string): string[] {
  const risks: string[] = [];

  // 风险关键词
  const riskKeywords = [
    { keyword: "既往症", risk: "既往症可能不在保障范围内，请确认您的健康状况" },
    { keyword: "高风险活动", risk: "高风险活动（如极限运动）可能被排除在外" },
    { keyword: "自杀", risk: "自杀通常在保障排除范围内" },
    { keyword: "酒后", risk: "酒后发生的事故可能不被理赔" },
    { keyword: "无证驾驶", risk: "无证驾驶导致的事故通常不被理赔" },
    { keyword: "战争", risk: "战争、恐怖袭击等政治事件通常被排除" },
    { keyword: "核辐射", risk: "核辐射等特殊风险通常被排除" },
    { keyword: "妊娠", risk: "妊娠相关的理赔可能有特殊限制" },
  ];

  riskKeywords.forEach(({ keyword, risk }) => {
    if (lowerText.includes(keyword)) {
      risks.push(risk);
    }
  });

  // 如果没有找到风险提示，添加通用建议
  if (risks.length === 0) {
    risks.push("建议重点关注条款中的'不保事项'和'责任免除'部分");
  }

  return risks.slice(0, 4); // 最多返回 4 个风险提示
}

/**
 * 生成建议问题
 */
function generateSuggestedQuestions(text: string): string[] {
  const questions: string[] = [];

  // 基础问题
  const basicQuestions = [
    "请问您遭遇的情况是否发生在保单有效期内？",
    "您的保单是否有等待期限制？如果有，事件是否发生在等待期后？",
    "请问您是否有任何既往症或健康问题需要披露？",
  ];

  // 根据条款内容生成特定问题
  const lowerText = text.toLowerCase();

  if (lowerText.includes("免赔额")) {
    questions.push("您了解保单的免赔额是多少吗？这可能影响最终的理赔金额。");
  }

  if (lowerText.includes("理赔比例") || lowerText.includes("赔付比例")) {
    questions.push("保单的理赔比例是多少？这决定了您能获得的赔付比例。");
  }

  if (lowerText.includes("医疗") || lowerText.includes("住院")) {
    questions.push("请问您需要在指定医院就医才能获得理赔吗？");
  }

  if (lowerText.includes("意外")) {
    questions.push("请问您的情况是否符合保单中'意外伤害'的定义？");
  }

  // 添加基础问题
  questions.push(...basicQuestions);

  return questions.slice(0, 6); // 最多返回 6 个问题
}

/**
 * 分析保障范围
 */
function analyzeCoverage(lowerText: string): { included: string[]; excluded: string[] } {
  const included: string[] = [];
  const excluded: string[] = [];

  // 常见的保障项目
  const coverageItems = [
    "住院医疗",
    "门诊医疗",
    "重大疾病",
    "意外伤害",
    "身故保障",
    "全残保障",
    "手术费用",
    "药物费用",
    "康复费用",
    "护理费用",
  ];

  coverageItems.forEach((item) => {
    const lowerItem = item.toLowerCase();
    if (lowerText.includes(lowerItem)) {
      included.push(item);
    }
  });

  // 常见的排除项目
  const excludedItems = [
    "既往症",
    "高风险活动",
    "自杀",
    "酒后驾驶",
    "无证驾驶",
    "战争",
    "恐怖袭击",
    "核辐射",
    "妊娠并发症",
  ];

  excludedItems.forEach((item) => {
    const lowerItem = item.toLowerCase();
    if (lowerText.includes(lowerItem)) {
      excluded.push(item);
    }
  });

  return { included, excluded };
}

/**
 * 为 AI 聊天生成条款分析提示词
 */
export function generatePolicyAnalysisPrompt(analysis: PolicyAnalysis): string {
  let prompt = "根据用户上传的保险条款分析，以下是关键信息：\n\n";

  if (analysis.keyPoints.length > 0) {
    prompt += "【关键条款】\n";
    analysis.keyPoints.forEach((point) => {
      prompt += `- ${point}\n`;
    });
    prompt += "\n";
  }

  if (analysis.coverage.included.length > 0) {
    prompt += "【保障范围】\n";
    analysis.coverage.included.forEach((item) => {
      prompt += `- ✓ ${item}\n`;
    });
    prompt += "\n";
  }

  if (analysis.coverage.excluded.length > 0) {
    prompt += "【排除责任】\n";
    analysis.coverage.excluded.forEach((item) => {
      prompt += `- ✗ ${item}\n`;
    });
    prompt += "\n";
  }

  if (analysis.potentialRisks.length > 0) {
    prompt += "【风险提示】\n";
    analysis.potentialRisks.forEach((risk) => {
      prompt += `- ⚠️ ${risk}\n`;
    });
    prompt += "\n";
  }

  prompt +=
    "请在回答用户问题时，参考上述条款分析，提供更准确和专业的理赔建议。如果用户的情况涉及排除责任中的项目，请明确指出可能无法理赔。";

  return prompt;
}
