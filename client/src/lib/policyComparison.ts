/**
 * 保险条款版本对比模块
 * 功能：
 * - 对比多份条款的保障范围、排除条款、等待期等关键信息
 * - 生成对比分析报告
 * - 识别条款差异
 */

export interface PolicyComparisonItem {
  policyId: string;
  productName: string;
  coverageTypes: string[];
  waitingPeriod: string;
  keyExclusions: string[];
  maxClaimAge?: string;
  highlights: string[];
}

export interface ComparisonDifference {
  field: string;
  policy1: string;
  policy2: string;
  advantage: "policy1" | "policy2" | "equal";
}

export interface ComparisonResult {
  policy1: PolicyComparisonItem;
  policy2: PolicyComparisonItem;
  differences: ComparisonDifference[];
  summary: {
    betterCoverage: "policy1" | "policy2" | "equal";
    reason: string;
  };
}

/**
 * 对比两份条款
 */
export function comparePolicies(
  policy1: PolicyComparisonItem,
  policy2: PolicyComparisonItem
): ComparisonResult {
  const differences: ComparisonDifference[] = [];

  // 对比产品名称
  if (policy1.productName !== policy2.productName) {
    differences.push({
      field: "产品名称",
      policy1: policy1.productName,
      policy2: policy2.productName,
      advantage: "equal",
    });
  }

  // 对比保障范围
  const coverage1 = policy1.coverageTypes.join("、");
  const coverage2 = policy2.coverageTypes.join("、");
  if (coverage1 !== coverage2) {
    differences.push({
      field: "保障范围",
      policy1: coverage1,
      policy2: coverage2,
      advantage:
        policy1.coverageTypes.length > policy2.coverageTypes.length
          ? "policy1"
          : policy2.coverageTypes.length > policy1.coverageTypes.length
            ? "policy2"
            : "equal",
    });
  }

  // 对比等待期（越短越好）
  const waitDays1 = parseInt(policy1.waitingPeriod) || 0;
  const waitDays2 = parseInt(policy2.waitingPeriod) || 0;
  if (waitDays1 !== waitDays2) {
    differences.push({
      field: "等待期",
      policy1: policy1.waitingPeriod,
      policy2: policy2.waitingPeriod,
      advantage:
        waitDays1 < waitDays2 ? "policy1" : waitDays2 < waitDays1 ? "policy2" : "equal",
    });
  }

  // 对比排除条款（越少越好）
  const exclusions1 = policy1.keyExclusions.join("、");
  const exclusions2 = policy2.keyExclusions.join("、");
  if (exclusions1 !== exclusions2) {
    differences.push({
      field: "关键排除",
      policy1: exclusions1 || "无",
      policy2: exclusions2 || "无",
      advantage:
        policy1.keyExclusions.length < policy2.keyExclusions.length
          ? "policy1"
          : policy2.keyExclusions.length < policy1.keyExclusions.length
            ? "policy2"
            : "equal",
    });
  }

  // 对比最高理赔年龄
  if (policy1.maxClaimAge && policy2.maxClaimAge) {
    const age1 = parseInt(policy1.maxClaimAge) || 0;
    const age2 = parseInt(policy2.maxClaimAge) || 0;
    if (age1 !== age2) {
      differences.push({
        field: "最高理赔年龄",
        policy1: policy1.maxClaimAge,
        policy2: policy2.maxClaimAge,
        advantage: age1 > age2 ? "policy1" : age2 > age1 ? "policy2" : "equal",
      });
    }
  }

  // 计算哪个条款更优
  let policy1Score = 0;
  let policy2Score = 0;

  differences.forEach((diff) => {
    if (diff.advantage === "policy1") policy1Score++;
    else if (diff.advantage === "policy2") policy2Score++;
  });

  const betterCoverage =
    policy1Score > policy2Score
      ? "policy1"
      : policy2Score > policy1Score
        ? "policy2"
        : "equal";

  const reason =
    betterCoverage === "policy1"
      ? `${policy1.productName}在保障范围、等待期等方面更有优势`
      : betterCoverage === "policy2"
        ? `${policy2.productName}在保障范围、等待期等方面更有优势`
        : "两份条款各有优势，建议根据个人需求选择";

  return {
    policy1,
    policy2,
    differences,
    summary: {
      betterCoverage,
      reason,
    },
  };
}

/**
 * 批量对比多份条款
 */
export function compareMultiplePolicies(
  policies: PolicyComparisonItem[]
): {
  pairwise: ComparisonResult[];
  bestPolicy: PolicyComparisonItem;
  analysis: string;
} {
  const pairwise: ComparisonResult[] = [];

  // 生成所有两两对比
  for (let i = 0; i < policies.length; i++) {
    for (let j = i + 1; j < policies.length; j++) {
      pairwise.push(comparePolicies(policies[i], policies[j]));
    }
  }

  // 统计每个条款的优势次数
  const scores: Record<string, number> = {};
  policies.forEach((p) => {
    scores[p.policyId] = 0;
  });

  pairwise.forEach((result) => {
    if (result.summary.betterCoverage === "policy1") {
      scores[result.policy1.policyId]++;
    } else if (result.summary.betterCoverage === "policy2") {
      scores[result.policy2.policyId]++;
    }
  });

  // 找到最优条款
  const bestPolicyId = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
  const bestPolicy = policies.find((p) => p.policyId === bestPolicyId)!;

  const analysis = `基于对比分析，${bestPolicy.productName}在整体保障上最具竞争力，建议优先考虑。`;

  return {
    pairwise,
    bestPolicy,
    analysis,
  };
}

/**
 * 提取条款的关键特性（用于智能建议）
 */
export function extractPolicyFeatures(policy: PolicyComparisonItem): {
  strengths: string[];
  weaknesses: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // 分析优势
  if (policy.coverageTypes.length >= 3) {
    strengths.push(`保障范围广泛（包含${policy.coverageTypes.length}种保障）`);
  }

  const waitDays = parseInt(policy.waitingPeriod) || 0;
  if (waitDays <= 30) {
    strengths.push("等待期短（快速生效）");
  }

  if (policy.keyExclusions.length <= 2) {
    strengths.push("排除条款少（保障更全面）");
  }

  if (policy.highlights.some((h) => h.includes("额外"))) {
    strengths.push("提供额外保障（增值服务丰富）");
  }

  // 分析劣势
  if (policy.coverageTypes.length < 2) {
    weaknesses.push("保障范围有限");
  }

  if (waitDays > 90) {
    weaknesses.push("等待期较长");
  }

  if (policy.keyExclusions.length > 5) {
    weaknesses.push("排除条款较多（保障限制较多）");
  }

  if (!policy.maxClaimAge || parseInt(policy.maxClaimAge) < 70) {
    weaknesses.push("理赔年龄限制较严");
  }

  return { strengths, weaknesses };
}
