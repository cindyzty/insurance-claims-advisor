// client/src/lib/reportCache.ts
import type { ChatMessage, ClaimAssessmentReport, InsuranceType, PolicyInfo } from "./api";

interface CacheEntry {
    report: ClaimAssessmentReport;
    createdAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 分钟

/** 根据会话上下文生成缓存 key */
export function buildReportCacheKey(
    sessionId: string,
    messages: ChatMessage[],
    insuranceType: InsuranceType,
    policyInfo?: PolicyInfo
): string {
    const msgFingerprint = messages
        .map((m) => `${m.role}:${m.content}`)
        .join("|");
    const policyKey = policyInfo?.policyId || policyInfo?.policyNumber || "none";
    return `${sessionId}::${insuranceType}::${policyKey}::${msgFingerprint}`;
}

export function getCachedReport(key: string): ClaimAssessmentReport | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.report;
}

export function setCachedReport(key: string, report: ClaimAssessmentReport): void {
    cache.set(key, { report, createdAt: Date.now() });
}

export function clearReportCache(sessionId?: string): void {
    if (!sessionId) {
        cache.clear();
        return;
    }
    for (const key of Array.from(cache.keys())) {
        if (key.startsWith(`${sessionId}::`)) cache.delete(key);
    }
}