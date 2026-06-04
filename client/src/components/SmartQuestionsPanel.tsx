/**
 * SmartQuestionsPanel.tsx — 智能问题建议面板
 * 功能：
 * - 展示根据险种和条款生成的常见问题
 * - 用户可点击问题快速提问
 * - 显示个性化建议
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ChevronRight, AlertCircle } from "lucide-react";
import type { SmartQuestion } from "@/lib/smartQuestions";

interface SmartQuestionsPanelProps {
  questions: SmartQuestion[];
  advice: string[];
  onQuestionClick: (question: string) => void;
  isLoading?: boolean;
}

export default function SmartQuestionsPanel({
  questions,
  advice,
  onQuestionClick,
  isLoading = false,
}: SmartQuestionsPanelProps) {
  const [expandedAdvice, setExpandedAdvice] = useState(false);

  if (questions.length === 0 && advice.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800";
      case "low":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800";
      default:
        return "";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "重要";
      case "medium":
        return "推荐";
      case "low":
        return "参考";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      {/* 推荐问题 */}
      {questions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">推荐提问</h3>
            <span className="text-xs text-muted-foreground">({questions.length})</span>
          </div>
          <div className="space-y-2">
            {questions.map((q) => (
              <Card
                key={q.id}
                className="p-3 cursor-pointer hover:shadow-md transition-all hover:bg-muted/50"
                onClick={() => onQuestionClick(q.question)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={getPriorityColor(q.priority)}
                      >
                        {getPriorityLabel(q.priority)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {q.category}
                      </span>
                      {q.relevance > 0.8 && (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                          ★ 高相关
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {q.question}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 个性化建议 */}
      {advice.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedAdvice(!expandedAdvice)}
            className="flex items-center gap-2 mb-3 hover:opacity-70 transition-opacity"
          >
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-sm">咨询建议</h3>
            <span className="text-xs text-muted-foreground">({advice.length})</span>
          </button>

          {expandedAdvice && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <ul className="space-y-2">
                {advice.map((item, index) => (
                  <li key={index} className="flex gap-2 text-sm text-foreground">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex-shrink-0">
                      •
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
