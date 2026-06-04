/**
 * policyCache.ts
 *
 * 保单文本缓存和搜索功能
 * - 本地存储上传的保单 PDF 提取文本
 * - 提供条款搜索和相关性评分
 */

export interface CachedPolicy {
  policyId: string;
  fileName: string;
  productName: string;
  policyText: string;
  summary: {
    productName: string;
    coverageTypes: string[];
    waitingPeriod: string;
    keyExclusions: string[];
    highlights: string[];
  };
  uploadedAt: string;
  hash: string;
}

const POLICY_CACHE_KEY = "policy_cache";

/**
 * 检查保单是否已缓存
 */
export function isPolicyCached(policyText: string): CachedPolicy | null {
  try {
    const cache = localStorage.getItem(POLICY_CACHE_KEY);
    if (!cache) return null;

    const policies: CachedPolicy[] = JSON.parse(cache);
    const hash = simpleHash(policyText);

    return policies.find((p) => p.hash === hash) || null;
  } catch {
    return null;
  }
}

/**
 * 简单哈希函数
 */
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * 缓存保单
 */
export function cachePolicy(policy: CachedPolicy): void {
  try {
    const cache = localStorage.getItem(POLICY_CACHE_KEY);
    const policies: CachedPolicy[] = cache ? JSON.parse(cache) : [];

    const existingIndex = policies.findIndex((p) => p.policyId === policy.policyId);
    if (existingIndex >= 0) {
      policies[existingIndex] = policy;
    } else {
      policies.push(policy);
    }

    localStorage.setItem(POLICY_CACHE_KEY, JSON.stringify(policies.slice(-10)));
  } catch {
    console.error("缓存保单失败");
  }
}

/**
 * 获取缓存的保单
 */
export function getCachedPolicy(policyId: string): CachedPolicy | null {
  try {
    const cache = localStorage.getItem(POLICY_CACHE_KEY);
    if (!cache) return null;

    const policies: CachedPolicy[] = JSON.parse(cache);
    return policies.find((p) => p.policyId === policyId) || null;
  } catch {
    return null;
  }
}

/**
 * 获取所有缓存的保单
 */
export function getAllCachedPolicies(): CachedPolicy[] {
  try {
    const cache = localStorage.getItem(POLICY_CACHE_KEY);
    return cache ? JSON.parse(cache) : [];
  } catch {
    return [];
  }
}

/**
 * 删除缓存的保单
 */
export function removeCachedPolicy(policyId: string): void {
  try {
    const cache = localStorage.getItem(POLICY_CACHE_KEY);
    if (!cache) return;

    const policies: CachedPolicy[] = JSON.parse(cache);
    const filtered = policies.filter((p) => p.policyId !== policyId);
    localStorage.setItem(POLICY_CACHE_KEY, JSON.stringify(filtered));
  } catch {
    console.error("删除缓存保单失败");
  }
}

/**
 * 清空所有缓存
 */
export function clearPolicyCache(): void {
  try {
    localStorage.removeItem(POLICY_CACHE_KEY);
  } catch {
    console.error("清空缓存失败");
  }
}

/**
 * 搜索保单条款并计算相关性评分
 * 改进的算法：
 * 1. 关键词匹配（权重高）
 * 2. 字符相似性（权重中）
 * 3. 保险相关关键词（权重低，作为兜底）
 * 4. 如果没有找到任何匹配，返回保险相关的条款
 */
export function searchPolicyClauses(
  policyText: string,
  query: string,
  topK: number = 3
): { section: string; content: string; relevanceScore: number }[] {
  const sentences = policyText.split(/[。！？\n]+/).filter((s) => s.trim());
  const queryWords = query.split(/\s+/).filter((w) => w.length > 0);
  const queryLower = query.toLowerCase();

  // 保险相关关键词库
  const insuranceKeywords = [
    "保险",
    "保险公司",
    "保额",
    "保障",
    "理赔",
    "条款",
    "条例",
    "条款细则",
    "保险责任",
    "除外责任",
    "等待期",
    "生效",
    "有效期",
    "保险期间",
    "保险人",
    "被保险人",
    "受益人",
    "赔付",
    "给付",
    "医疗",
    "住院",
    "手术",
    "门诊",
    "重疾",
    "身故",
    "全残",
    "伤残",
    "意外",
    "疾病",
    "免赔",
    "免赔额",
    "起付线",
    "报销比例",
    "最高赔付",
    "保障范围",
  ];

  // 计算每个句子与查询的相关度
  const scored = sentences
    .map((sentence, index) => {
      let score = 0;
      const sentenceLower = sentence.toLowerCase();

      // 方案 1: 关键词匹配（权重最高）
      for (const word of queryWords) {
        if (word.length > 1 && sentenceLower.includes(word.toLowerCase())) {
          score += 3;
        }
      }

      // 方案 2: 字符相似性（权重中）
      const commonChars = sentence.split("").filter((char) => queryLower.includes(char)).length;
      score += commonChars * 0.1;

      // 方案 3: 保险相关关键词（权重低，但重要）
      if (insuranceKeywords.some((kw) => sentenceLower.includes(kw))) {
        score += 1;
      }

      return {
        section: `第 ${Math.floor(index / 10) + 1} 部分`,
        content: sentence.trim(),
        relevanceScore: score,
        originalIndex: index,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 如果找到任何匹配，返回相关条款
  let result = scored.filter((item) => item.relevanceScore > 0).slice(0, topK);

  // 如果找不到任何匹配，返回保险相关的条款（兜底方案）
  if (result.length === 0) {
    const insuranceRelevant = scored.filter((item) =>
      insuranceKeywords.some((kw) => item.content.toLowerCase().includes(kw))
    );
    result = insuranceRelevant.slice(0, topK);
  }

  // 如果还是没有，返回最长的条款（通常包含更多信息）
  if (result.length === 0) {
    result = scored
      .filter((item) => item.content.length > 20)
      .slice(0, topK);
  }

  // 正常化相关度分数到 0-1 范围
  const maxScore = Math.max(
    ...result.map((r) => r.relevanceScore),
    1
  );
  return result.map(({ section, content, relevanceScore }) => ({
    section,
    content,
    relevanceScore: Math.min(relevanceScore / maxScore, 1),
  })) as { section: string; content: string; relevanceScore: number }[];
}
