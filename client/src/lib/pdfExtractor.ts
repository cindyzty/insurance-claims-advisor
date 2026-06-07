/**
 * PDF 文本提取工具
 * 使用 PDF.js 库提取 PDF 文件中的文本内容
 *
 * Issue #3 修复：
 * - B: 串行逐页提取改为 Promise.all 并行提取，大幅提升速度
 * - A: 新增 renderPDFPagesToBase64 函数，将前 N 页渲染为 base64 图片，供 AI 视觉验证使用
 */

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// 设置 PDF.js worker 路径 - 使用本地 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * 从 PDF 文件提取文本（Issue #3-B 修复：并行提取所有页）
 * @param file PDF 文件对象
 * @returns 提取的文本内容
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Issue #3-B 修复：改为 Promise.all 并行提取所有页，避免串行等待
    const pageNumbers = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
    const pageTexts = await Promise.all(
      pageNumbers.map(async (pageNum) => {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        return textContent.items.map((item: any) => item.str).join("") + "\n";
      })
    );

    return pageTexts.join("").trim();
  } catch (error) {
    console.error("PDF 文本提取失败:", error);
    throw new Error("无法解析 PDF 文件，请确保文件格式正确");
  }
}

/**
 * Issue #3-A：将 PDF 前 N 页渲染为 base64 图片，供 AI 视觉验证使用
 * @param file PDF 文件对象
 * @param maxPages 最多渲染页数，默认 3
 * @param scale 渲染缩放比例，默认 1.0（降低分辨率以减小 base64 体积）
 * @returns base64 图片数组（data URL 格式）
 */
export async function renderPDFPagesToBase64(
  file: File,
  maxPages = 3,
  scale = 1.0
): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pagesToRender = Math.min(maxPages, pdf.numPages);

    const pageNumbers = Array.from({ length: pagesToRender }, (_, i) => i + 1);
    const base64Images = await Promise.all(
      pageNumbers.map(async (pageNum) => {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // 创建离屏 canvas
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        // 转为 base64（JPEG 压缩，质量 0.7，减小体积）
        return canvas.toDataURL("image/jpeg", 0.7);
      })
    );

    return base64Images;
  } catch (error) {
    console.error("PDF 页面渲染失败:", error);
    throw new Error("无法渲染 PDF 页面，请确保文件格式正确");
  }
}

/**
 * 提取 PDF 的关键信息（产品名称、保障范围等）
 * @param text PDF 文本内容
 * @returns 关键信息对象
 */
export function extractPolicyInfo(text: string) {
  // 简单的关键词匹配（实际应用中可用 LLM 进行更精准的提取）
  const lines = text.split("\n");

  // 尝试从前几行提取产品名称
  const productName = lines.find((line) => line.length > 5 && line.length < 50) || "未知产品";

  // 查找保障范围、等待期等关键信息
  const coverageMatch = text.match(/保障范围[：:]([\s\S]*?)(?=等待期|免责|其他|$)/);
  const waitingPeriodMatch = text.match(/等待期[：:]\s*(\d+\s*(?:天|日|个月|年)?)/);
  const exclusionsMatch = text.match(/(?:免责|不保|排除)[：:]([\s\S]*?)(?=\n\n|其他|$)/);

  return {
    productName: productName.trim(),
    coverageTypes: coverageMatch ? [coverageMatch[1].trim().split("\n")[0]] : [],
    waitingPeriod: waitingPeriodMatch ? waitingPeriodMatch[1] : "未指定",
    keyExclusions: exclusionsMatch
      ? exclusionsMatch[1]
          .split("\n")
          .filter((line) => line.trim())
          .slice(0, 3)
      : [],
  };
}
