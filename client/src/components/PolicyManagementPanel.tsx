/**
 * PolicyManagementPanel.tsx
 * 
 * User-friendly policy management interface with:
 * - Upload and store multiple policies
 * - Quick access to saved policies
 * - Policy metadata display
 * - Delete and organize policies
 */

import { useState } from 'react';
import { Upload, Trash2, FileText, Calendar, Building2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { PolicyInfo } from '@/lib/api';

interface StoredPolicy extends PolicyInfo {
  id: string;
  uploadedAt: string;
}

interface PolicyManagementPanelProps {
  policies: StoredPolicy[];
  onPolicySelect: (policy: StoredPolicy) => void;
  onPolicyDelete: (policyId: string) => void;
  onPolicyUpload: (file: File) => void;
}

export default function PolicyManagementPanel({
  policies,
  onPolicySelect,
  onPolicyDelete,
  onPolicyUpload,
}: PolicyManagementPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        onPolicyUpload(file);
        setIsOpen(false);
      } else {
        toast.error('请上传 PDF 文件');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      onPolicyUpload(files[0]);
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <FileText className="w-4 h-4 inline mr-2" />
          我的保单
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              上传保单
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>上传保单 PDF</DialogTitle>
            </DialogHeader>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                拖拽 PDF 文件到此处
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                或点击下方按钮选择文件
              </p>
              <label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button size="sm" variant="secondary" asChild className="cursor-pointer">
                  <span>选择文件</span>
                </Button>
              </label>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {policies.length === 0 ? (
        <Card className="p-6 text-center border-dashed">
          <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            暂无保单，上传保单后可获得更精准的理赔建议
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {policies.map((policy) => (
            <Card
              key={policy.id}
              className="p-4 hover:bg-card/80 transition-colors cursor-pointer border-l-4 border-l-primary"
              onClick={() => onPolicySelect(policy)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-foreground truncate">
                      {policy.productName || '未命名保单'}
                    </h4>
                    {policy.policyNumber && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {policy.policyNumber}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {policy.insurerName && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {policy.insurerName}
                      </div>
                    )}
                    {policy.uploadedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(policy.uploadedAt).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>

                  {policy.coverageAmount && (
                    <p className="text-xs text-foreground/70 mt-2">
                      保额: ¥{policy.coverageAmount.toLocaleString()}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPolicyDelete(policy.id);
                  }}
                  className="flex-shrink-0 p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
