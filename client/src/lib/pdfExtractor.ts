/**
 * PDF 文本提取工具
 * 使用 PDF.js 库提取 PDF 文件中的文本内容
 */

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// 设置 PDF.js worker 路径 - 使用本地 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * 从 PDF 文件提取文本
 * @param file PDF 文件对象
 * @returns 提取的文本内容
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    // 逐页提取文本
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // 合并页面中的文本项
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join("");

      fullText += pageText + "\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF 文本提取失败:", error);
    throw new Error("无法解析 PDF 文件，请确保文件格式正确");
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
