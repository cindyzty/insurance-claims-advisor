/**
 * SessionHistory.tsx — 会话历史列表页面
 * 功能：
 * - 显示所有历史会话
 * - 支持搜索和筛选
 * - 支持会话恢复、删除、导出
 * - 显示会话统计信息
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  Search,
  Trash2,
  Download,
  RotateCcw,
  FileText,
  Calendar,
  MessageSquare,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  getAllSessions,
  deleteSession,
  generateSessionTitle,
  generateSessionSummary,
  getSessionStats,
  searchSessions,
  exportSessionAsMarkdown,
  type SessionData,
} from "@/lib/sessionManager";

const INSURANCE_TYPE_LABELS: Record<string, string> = {
  health: "健康险",
  life: "寿险",
  accident: "意外险",
  property: "财产险",
  liability: "责任险",
  travel: "旅行险",
  other: "其他险种",
};

const INSURANCE_TYPE_COLORS: Record<string, string> = {
  health: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  life: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300",
  accident: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  property: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  liability: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
  travel: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300",
  other: "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-300",
};

export default function SessionHistory() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "probability">("recent");

  // Bug 7 修复：将 allSessions 改为 useState，删除后触发 state 更新使列表重新渲染
  const [allSessions, setAllSessions] = useState<SessionData[]>(() => getAllSessions());
  const stats = getSessionStats(allSessions);

  const filteredSessions = useMemo(() => {
    let result = searchQuery ? searchSessions(searchQuery) : allSessions;

    if (filterType) {
      result = result.filter((s) => s.insuranceType === filterType);
    }

    if (sortBy === "probability") {
      result.sort((a, b) => (b.report?.probability || 0) - (a.report?.probability || 0));
    }

    return result;
  }, [allSessions, searchQuery, filterType, sortBy]);

  const handleResumeSession = (sessionId: string) => {
    localStorage.setItem("resumeSessionId", sessionId);
    setLocation("/consult");
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    // Bug 7 修复：删除后更新 state，触发重新渲染
    setAllSessions(getAllSessions());
    toast.success("会话已删除");
  };

  const handleExportSession = (session: SessionData) => {
    const markdown = exportSessionAsMarkdown(session);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generateSessionTitle(session)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("会话已导出");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "rgba(20,20,22,1)" }}>
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">会话历史</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">总会话数</div>
            <div className="text-xl font-bold text-foreground">{stats.totalSessions}</div>
          </Card>
          <Card className="p-3 bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">平均消息数</div>
            <div className="text-xl font-bold text-foreground">{stats.avgMessages}</div>
          </Card>
          <Card className="p-3 bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">已生成报告</div>
            <div className="text-xl font-bold text-foreground">{stats.sessionsWithReport}</div>
          </Card>
          <Card className="p-3 bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">平均理赔概率</div>
            <div className="text-xl font-bold" style={{ color: "#F59E0B" }}>
              {stats.avgProbability}%
            </div>
          </Card>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex-shrink-0 p-6 border-b border-border space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterType === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(null)}
            style={filterType === null ? { backgroundColor: "#F59E0B", color: "#1C1C1E" } : {}}
          >
            全部
          </Button>
          {Object.entries(INSURANCE_TYPE_LABELS).map(([type, label]) => (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
              style={filterType === type ? { backgroundColor: "#F59E0B", color: "#1C1C1E" } : {}}
            >
              {label} {stats.byType[type] ? `(${stats.byType[type]})` : ""}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recent")}
            style={sortBy === "recent" ? { backgroundColor: "#F59E0B", color: "#1C1C1E" } : {}}
          >
            最新
          </Button>
          <Button
            variant={sortBy === "probability" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("probability")}
            style={sortBy === "probability" ? { backgroundColor: "#F59E0B", color: "#1C1C1E" } : {}}
          >
            理赔概率
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">暂无会话记录</p>
            <Button
              onClick={() => setLocation("/")}
              className="mt-4"
              style={{ backgroundColor: "#F59E0B", color: "#1C1C1E" }}
            >
              开始新咨询
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <Card
                key={session.sessionId}
                className="p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleResumeSession(session.sessionId)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="font-semibold text-foreground mb-2 truncate group-hover:text-amber-500 transition-colors">
                      {generateSessionTitle(session)}
                    </h3>

                    {/* Summary */}
                    <p className="text-sm text-muted-foreground mb-3">
                      {generateSessionSummary(session)}
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={INSURANCE_TYPE_COLORS[session.insuranceType]}
                      >
                        {INSURANCE_TYPE_LABELS[session.insuranceType]}
                      </Badge>

                      {session.report && (
                        <Badge
                          variant="outline"
                          className={
                            session.report.probability >= 70
                              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                              : session.report.probability >= 40
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                          }
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {session.report.probability}%
                        </Badge>
                      )}

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        {session.messages.length}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.createdAt).toLocaleDateString("zh-CN")}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSession(session);
                      }}
                      className="hover:bg-muted"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.sessionId);
                      }}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
