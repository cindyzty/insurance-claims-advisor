/**
 * 智能问题建议模块
 * 功能：
 * - 根据险种和已上传的条款生成常见理赔问题
 * - 提供个性化的咨询建议
 * - 优化用户的提问流程
 */

import type { InsuranceType } from "./api";
import type { PolicyComparisonItem } from "./policyComparison";

export interface SmartQuestion {
  id: string;
  category: string;
  question: string;
  relevance: number; // 0-1，与用户条款的相关度
  priority: "high" | "medium" | "low";
}

// 各险种的常见问题库
const QUESTION_TEMPLATES: Record<InsuranceType, SmartQuestion[]> = {
  health: [
    {
      id: "health_1",
      category: "保障范围",
      question: "这份健康险的主要保障范围是什么？包括哪些疾病？",
      relevance: 1,
      priority: "high",
    },
    {
      id: "health_2",
      category: "等待期",
      question: "等待期内确诊疾病是否可以理赔？",
      relevance: 0.9,
      priority: "high",
    },
    {
      id: "health_3",
      category: "理赔条件",
      question: "需要住院多少天才能触发理赔？",
      relevance: 0.8,
      priority: "high",
    },
    {
      id: "health_4",
      category: "排除条款",
      question: "哪些情况下不能理赔？",
      relevance: 0.85,
      priority: "medium",
    },
    {
      id: "health_5",
      category: "理赔流程",
      question: "理赔需要提交哪些材料？流程需要多长时间？",
      relevance: 0.8,
      priority: "medium",
    },
  ],
  life: [
    {
      id: "life_1",
      category: "保障范围",
      question: "这份寿险的保障金额是多少？",
      relevance: 1,
      priority: "high",
    },
    {
      id: "life_2",
      category: "理赔条件",
      question: "投保后多久可以正常理赔？",
      relevance: 0.9,
      priority: "high",
    },
    {
      id: "life_3",
      category: "排除条款",
      question: "自杀、意外等特殊情况是否在保障范围内？",
      relevance: 0.85,
      priority: "high",
    },
    {
      id: "life_4",
      category: "受益人",
      question: "如何变更受益人？受益人有限制吗？",
      relevance: 0.7,
      priority: "medium",
    },
  ],
  accident: [
    {
      id: "accident_1",
      category: "保障范围",
      question: "这份意外险覆盖哪些类型的意外？",
      relevance: 1,
      priority: "high",
    },
    {
      id: "accident_2",
      category: "理赔条件",
      question: "意外伤害导致的医疗费用可以全额报销吗？",
      relevance: 0.9,
      priority: "high",
    },
    {
      id: "accident_3",
      category: "排除条款",
      question: "哪些意外情况不在保障范围内？",
      relevance: 0.85,
      priority: "high",
    },
    {
      id: "accident_4",
      category: "理赔流程",
      question: "发生意外后应该如何快速理赔？",
      relevance: 0.8,
      priority: "medium",
    },
  ],
  property: [
    {
      id: "property_1",
      category: "保障范围",
      question: "这份财产险保障哪些类型的财产损失？",
      relevance: 1,
      priority: "high",
    },
    {
      id: "property_2",
      category: "理赔条件",
      question: "财产受损后如何确定理赔金额？",
      relevance: 0.9,
      priority: "high",
    },
    {
      id: "property_3",
      category: "排除条款",
      question: "自然灾害、战争等特殊事件是否在保障范围内？",
      relevance: 0.85,
      priority: "high",
    },
    {
      id: "property_4",
      category: "理赔流程",
      question: "需要提供哪些证明材料？",
      relevance: 0.8,
      priority: "medium",
    },
  ],
  liability: [
    {
      id: "liability_1",
      category: "保障范围",
      question: "这份责任险的赔偿限额是多少？",
      relevance: 1,
      priority: "high",
    },
    {
      id: "liability_2",
      category: "理赔条件",
      question: "对第三方造成的伤害是否在保障范围内？",
      relevance: 0.9,
      priority: "high",
    },
    {
      id: "liability_3",
      category: "排除条款",
      question: "故意行为导致的责任是否可以理赔？",
      relevance: 0.85,
      priority: "high",
    },
    {
      id: "liability_4",
      category: "理赔流程",
      question: "发生责任事故后应该如何处理？",
      relevance: 0.8,
      priority: "medium",
    },
  ],
  travel: [
    {
      id: "travel_1",
      category: "保障范围",
      question: "这份旅行险覆盖哪些旅行风险？",
      relevance: 1,
      priority: "high",
    },
    {
      id: "travel_2",
      category: "理赔条件",
      question: "行程延误、行李丢失等情况如何理赔？",
      relevance: 0.9,
      priority: "high",
    },
    {
      id: "travel_3",
      category: "排除条款",
      question: "已知的天气预警、疫情等是否在保障范围内？",
      relevance: 0.85,
      priority: "high",
    },
    {
      id: "travel_4",
      category: "理赔流程",
      question: "旅行中发生事故应该如何快速理赔？",
      relevance: 0.8,
      priority: "medium",
    },
  ],
  other: [
    {
      id: "other_1",
      category: "基本信息",
      question: "这份保险的基本保障内容是什么？",
      relevance: 1,
      priority: "high",
    },
    {
      id: "other_2",
      category: "理赔条件",
      question: "理赔需要满足哪些条件？",
      relevance: 0.9,
      priority: "high",
    },
    {
      id: "other_3",
      category: "排除条款",
      question: "哪些情况下不能理赔？",
      relevance: 0.85,
      priority: "high",
    },
    {
      id: "other_4",
      category: "理赔流程",
      question: "理赔流程是怎样的？需要多长时间？",
      relevance: 0.8,
      priority: "medium",
    },
  ],
};

/**
 * 根据险种生成智能问题建议
 */
export function generateSmartQuestions(
  insuranceType: InsuranceType,
  policy?: PolicyComparisonItem,
  askedQuestions: string[] = []
): SmartQuestion[] {
  let questions = [...(QUESTION_TEMPLATES[insuranceType] || QUESTION_TEMPLATES.other)];

  // 如果有上传的条款，调整相关度
  if (policy) {
    questions = questions.map((q) => {
      let relevance = q.relevance;

      // 根据条款特性调整相关度
      if (q.category === "保障范围" && policy.coverageTypes.length > 0) {
        relevance = 1; // 最相关
      }

      if (q.category === "排除条款" && policy.keyExclusions.length > 0) {
        relevance = Math.min(1, relevance + 0.1);
      }

      if (q.category === "等待期" && policy.waitingPeriod) {
        relevance = Math.min(1, relevance + 0.05);
      }

      return { ...q, relevance };
    });
  }

  // 过滤已经问过的问题
  questions = questions.filter((q) => !askedQuestions.includes(q.question));

  // 按优先级和相关度排序
  questions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff =
      priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.relevance - a.relevance;
  });

  // 返回前 5 个最相关的问题
  return questions.slice(0, 5);
}

/**
 * 根据用户的理赔情况生成个性化建议
 */
export function generatePersonalizedAdvice(
  insuranceType: InsuranceType,
  claimDescription: string,
  policy?: PolicyComparisonItem
): string[] {
  const advice: string[] = [];

  // 基础建议
  advice.push("请详细描述您的理赔情况，包括时间、地点、经过等信息。");

  // 根据险种提供具体建议
  if (insuranceType === "health") {
    advice.push("请准备好医院诊断证明、住院记录等医疗文件。");
    if (policy && policy.waitingPeriod) {
      const waitDays = parseInt(policy.waitingPeriod) || 0;
      if (waitDays > 0) {
        advice.push(
          `注意：该保险有${policy.waitingPeriod}的等待期，等待期内的理赔可能受限。`
        );
      }
    }
  } else if (insuranceType === "accident") {
    advice.push("请收集事故现场照片、医疗记录等证据。");
    advice.push("建议及时向保险公司报案，以便快速处理。");
  } else if (insuranceType === "property") {
    advice.push("请记录受损财产的详细信息和损失金额。");
    advice.push("建议获取第三方评估或维修报价。");
  } else if (insuranceType === "liability") {
    advice.push("请收集事故责任认定书或相关法律文件。");
    advice.push("建议咨询法律专家确定责任范围。");
  }

  // 根据条款提供警告
  if (policy && policy.keyExclusions.length > 0) {
    const exclusionWarnings = policy.keyExclusions.slice(0, 2).join("、");
    advice.push(`请注意以下排除条款：${exclusionWarnings}`);
  }

  advice.push("理赔过程中有任何疑问，请随时咨询。");

  return advice;
}
