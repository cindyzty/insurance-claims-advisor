/**
 * Home.tsx — 首页：保险类型选择 + 平台介绍
 * Design: 「法律文书」深色专业风
 * - 全屏 Hero 背景图 + 中央标题
 * - 保险类型卡片网格选择
 * - 快速进入咨询流程
 */

import { useState } from "react";
import { useLocation } from "wouter";
import {
  Heart,
  Shield,
  Zap,
  Home as HomeIcon,
  Users,
  Plane,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  BarChart3,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InsuranceType } from "@/lib/api";

const INSURANCE_TYPES: {
  type: InsuranceType;
  label: string;
  icon: React.ElementType;
  description: string;
  examples: string;
}[] = [
  {
    type: "health",
    label: "健康险 / 医疗险",
    icon: Heart,
    description: "住院、手术、门诊、重疾等医疗费用理赔",
    examples: "住院报销、重疾赔付、门诊补贴",
  },
  {
    type: "life",
    label: "寿险",
    icon: Shield,
    description: "身故、全残等人身保障类理赔",
    examples: "身故赔付、全残赔付、身故保险金",
  },
  {
    type: "accident",
    label: "意外险",
    icon: Zap,
    description: "意外事故导致的伤残、身故、医疗费用",
    examples: "意外伤残、意外医疗、意外身故",
  },
  {
    type: "property",
    label: "财产险",
    icon: HomeIcon,
    description: "房屋、车辆、家庭财产等损失理赔",
    examples: "车险理赔、家财险、企业财产险",
  },
  {
    type: "liability",
    label: "责任险",
    icon: Users,
    description: "因过失造成第三方损失的责任赔偿",
    examples: "公众责任、雇主责任、产品责任",
  },
  {
    type: "travel",
    label: "旅行险",
    icon: Plane,
    description: "出行期间的意外、医疗、行李损失等",
    examples: "航班延误、境外就医、行李丢失",
  },
  {
    type: "other",
    label: "其他险种",
    icon: HelpCircle,
    description: "不确定险种类型，需要专业顾问协助判断",
    examples: "综合咨询、险种确认、保障分析",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "保险范围分析",
    desc: "根据您的保单类型，精准解析保障范围与除外责任",
  },
  {
    icon: FileText,
    title: "材料清单指引",
    desc: "生成个性化的理赔材料清单，逐项说明获取方式",
  },
  {
    icon: BarChart3,
    title: "理赔可能性评估",
    desc: "基于事故描述与保单信息，给出专业的理赔概率评估",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [hoveredType, setHoveredType] = useState<InsuranceType | null>(null);

  const handleSelectType = (type: InsuranceType) => {
    setLocation(`/consult?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero Section ── */}
      <section
        className="relative min-h-[520px] flex flex-col justify-center overflow-hidden"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663729146887/EoYqiGqFfaRj2FxVy9ddwb/hero-bg-4t4QGYNrgqFCt58LmTzXeg.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />

        {/* Nav */}
        <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-10">
          <div className="flex items-center gap-3">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663729146887/EoYqiGqFfaRj2FxVy9ddwb/shield-icon-H7CVzNv2ptvp46fT9mn63s.webp"
              alt="理赔通"
              className="w-8 h-8 object-contain"
            />
            <span
              className="text-xl font-semibold tracking-wide"
              style={{ fontFamily: "'Playfair Display', serif", color: "#F59E0B" }}
            >
              理赔通
            </span>
          </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/history")}
              className="text-white/60 hover:text-white/80 text-xs"
            >
              <History className="w-4 h-4 mr-1" />
              历史记录
            </Button>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>智能理赔咨询平台</span>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 container py-20 pt-28 fade-in-up">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6"
            style={{ borderColor: "rgba(245,158,11,0.3)", backgroundColor: "rgba(245,158,11,0.1)", color: "#FBBF24" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">专业理赔顾问 · AI 辅助分析</span>
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            保险理赔，
            <br />
            <span style={{ color: "#F59E0B" }}>专业指引每一步</span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
            描述您的情况，AI 顾问将协助您了解保险范围、整理理赔材料，
            并给出理赔可能性的专业评估。
          </p>
          <Button
            size="lg"
            className="gap-2 text-sm font-semibold active:scale-[0.97] transition-transform duration-150"
            style={{ backgroundColor: "#F59E0B", color: "#1C1C1E" }}
            onClick={() => {
              document.getElementById("insurance-types")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            开始咨询
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section className="border-y border-border" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  <f.icon className="w-5 h-5" style={{ color: "#F59E0B" }} />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm mb-1">{f.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Insurance Type Selection ── */}
      <section id="insurance-types" className="container py-16">
        <div className="mb-10">
          <div className="gold-divider mb-6" />
          <h2
            className="text-2xl md:text-3xl font-bold text-foreground mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            选择您的保险类型
          </h2>
          <p className="text-muted-foreground text-sm">
            请选择与您此次理赔相关的保险类型，以便为您提供针对性的咨询服务。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {INSURANCE_TYPES.map((item) => {
            const Icon = item.icon;
            const isHovered = hoveredType === item.type;
            return (
              <button
                key={item.type}
                className="group text-left p-5 rounded-xl border transition-all duration-200 active:scale-[0.98]"
                style={{
                  backgroundColor: isHovered ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)",
                  borderColor: isHovered ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.08)",
                  transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                  boxShadow: isHovered ? "0 8px 24px rgba(245,158,11,0.12)" : "none",
                }}
                onMouseEnter={() => setHoveredType(item.type)}
                onMouseLeave={() => setHoveredType(null)}
                onClick={() => handleSelectType(item.type)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: isHovered ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)",
                      transition: "background-color 0.2s",
                    }}
                  >
                    <Icon
                      className="w-5 h-5 transition-colors duration-200"
                      style={{ color: isHovered ? "#F59E0B" : "#9CA3AF" }}
                    />
                  </div>
                  <ArrowRight
                    className="w-4 h-4 transition-all duration-200"
                    style={{
                      color: isHovered ? "#F59E0B" : "transparent",
                      transform: isHovered ? "translateX(0)" : "translateX(-4px)",
                    }}
                  />
                </div>
                <div className="font-semibold text-foreground text-sm mb-1.5">{item.label}</div>
                <div className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {item.description}
                </div>
                <div className="text-xs" style={{ color: "rgba(245,158,11,0.6)" }}>
                  {item.examples}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663729146887/EoYqiGqFfaRj2FxVy9ddwb/shield-icon-H7CVzNv2ptvp46fT9mn63s.webp"
              alt="理赔通"
              className="w-5 h-5 object-contain opacity-60"
            />
            <span className="text-xs text-muted-foreground">理赔通 · 智能保险理赔咨询平台</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            本平台提供的信息仅供参考，不构成法律或保险专业意见。最终理赔结果以保险公司审核为准。
          </p>
        </div>
      </footer>
    </div>
  );
}
