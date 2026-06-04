/**
 * styleUtils.ts
 *
 * Utility functions for consistent styling and animations
 * across the insurance claims advisor platform
 */

/**
 * Generate gradient background for different insurance types
 */
export const getInsuranceTypeGradient = (type: string): string => {
  const gradients: Record<string, string> = {
    health: 'from-red-600/20 to-red-400/10',
    life: 'from-blue-600/20 to-blue-400/10',
    accident: 'from-orange-600/20 to-orange-400/10',
    property: 'from-amber-600/20 to-amber-400/10',
    liability: 'from-purple-600/20 to-purple-400/10',
    travel: 'from-cyan-600/20 to-cyan-400/10',
    other: 'from-gray-600/20 to-gray-400/10',
  };
  return gradients[type] || gradients.other;
};

/**
 * Generate border color for different insurance types
 */
export const getInsuranceTypeBorder = (type: string): string => {
  const borders: Record<string, string> = {
    health: 'border-red-500/30',
    life: 'border-blue-500/30',
    accident: 'border-orange-500/30',
    property: 'border-amber-500/30',
    liability: 'border-purple-500/30',
    travel: 'border-cyan-500/30',
    other: 'border-gray-500/30',
  };
  return borders[type] || borders.other;
};

/**
 * Generate text color for different insurance types
 */
export const getInsuranceTypeText = (type: string): string => {
  const colors: Record<string, string> = {
    health: 'text-red-400',
    life: 'text-blue-400',
    accident: 'text-orange-400',
    property: 'text-amber-400',
    liability: 'text-purple-400',
    travel: 'text-cyan-400',
    other: 'text-gray-400',
  };
  return colors[type] || colors.other;
};

/**
 * Generate icon background for different insurance types
 */
export const getInsuranceTypeIconBg = (type: string): string => {
  const bgs: Record<string, string> = {
    health: 'bg-red-500/10',
    life: 'bg-blue-500/10',
    accident: 'bg-orange-500/10',
    property: 'bg-amber-500/10',
    liability: 'bg-purple-500/10',
    travel: 'bg-cyan-500/10',
    other: 'bg-gray-500/10',
  };
  return bgs[type] || bgs.other;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time for display
 */
export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate reading time for text content
 */
export const calculateReadingTime = (text: string): string => {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} 分钟阅读`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Generate smooth scroll behavior CSS
 */
export const smoothScrollCSS = `
  scroll-behavior: smooth;
  scroll-padding-top: 80px;
`;

/**
 * Generate fade-in animation CSS
 */
export const fadeInCSS = `
  animation: fadeIn 0.3s ease-out;
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

/**
 * Generate slide-up animation CSS
 */
export const slideUpCSS = `
  animation: slideUp 0.4s ease-out;
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

/**
 * Generate pulse animation CSS
 */
export const pulseCSS = `
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;
