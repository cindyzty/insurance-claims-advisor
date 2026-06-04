/**
 * HighlightedClause.tsx — 条款片段高亮显示组件
 * 功能：
 * - 在 AI 回复中高亮显示引用的条款片段
 * - 显示条款来源和相关度
 * - 支持点击查看完整条款
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

export interface ClauseReference {
  section: string;
  content: string;
  relevanceScore: number;
}

interface HighlightedClauseProps {
  text: string;
  clauses: ClauseReference[];
  onClauseClick?: (clause: ClauseReference) => void;
}

/**
 * 在文本中高亮显示条款关键词
 */
function highlightKeywords(text: string, keywords: string[]): React.ReactNode[] {
  if (!keywords || keywords.length === 0) return [text];

  let lastIndex = 0;
  const parts: React.ReactNode[] = [];

  // 创建正则表达式匹配关键词
  const pattern = new RegExp(`(${keywords.join("|")})`, "gi");
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // 添加匹配前的文本
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // 添加高亮的匹配文本
    parts.push(
      <mark
        key={`highlight-${match.index}`}
        className="bg-yellow-200/60 dark:bg-yellow-900/40 font-semibold rounded px-1"
      >
        {match[0]}
      </mark>
    );

    lastIndex = pattern.lastIndex;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export default function HighlightedClause({
  text,
  clauses,
  onClauseClick,
}: HighlightedClauseProps) {
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());

  const toggleClause = (index: number) => {
    setExpandedClauses((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // 提取条款中的关键词用于高亮
  const keywords = clauses
    .flatMap((clause) => clause.content.split(/\s+/).slice(0, 3)) // 取每个条款的前3个词
    .filter((word) => word.length > 2)
    .slice(0, 5); // 最多高亮5个关键词

  return (
    <div className="space-y-4">
      {/* 主文本，高亮关键词 */}
      <div className="text-foreground leading-relaxed">
        {highlightKeywords(text, keywords)}
      </div>

      {/* 条款引用卡片 */}
      {clauses.length > 0 && (
        <div className="space-y-2 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            相关条款引用 ({clauses.length})
          </div>

          {clauses.map((clause, index) => (
            <Card
              key={index}
              className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
              onClick={() => {
                toggleClause(index);
                onClauseClick?.(clause);
              }}
            >
              <div className="p-3">
                {/* 条款头部 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {clause.section}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs whitespace-nowrap"
                      >
                        相关度 {Math.round(clause.relevanceScore * 100)}%
                      </Badge>
                    </div>
                    {/* 条款预览 */}
                    <p className="text-sm text-foreground line-clamp-2">
                      {clause.content}
                    </p>
                  </div>

                  {/* 展开/收起按钮 */}
                  <button
                    className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleClause(index);
                    }}
                  >
                    {expandedClauses.has(index) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* 展开的完整内容 */}
                {expandedClauses.has(index) && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {clause.content}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded h-1">
                        <div
                          className="bg-green-500 h-full rounded transition-all"
                          style={{
                            width: `${clause.relevanceScore * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(clause.relevanceScore * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
