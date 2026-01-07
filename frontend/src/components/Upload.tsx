import { useState, useRef } from 'react';
import { Upload as UploadIcon, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { issueService, type Attachment } from '../services/api';

interface FileUploadProps {
  onUploadComplete: (attachmentIds: number[]) => void;
  className?: string;
}

export function FileUpload({ onUploadComplete, className }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length > 0) {
      await uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(Array.from(e.target.files));
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFiles = async (selectedFiles: File[]) => {
    setUploading(true);
    const newAttachments: Attachment[] = [];

    try {
      for (const file of selectedFiles) {
        try {
          const attachment = await issueService.uploadFile(file);
          newAttachments.push(attachment);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          // You might want to show a toast notification here
        }
      }

      const updatedFiles = [...files, ...newAttachments];
      setFiles(updatedFiles);
      onUploadComplete(updatedFiles.map(f => f.id));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (id: number) => {
    const updatedFiles = files.filter(f => f.id !== id);
    setFiles(updatedFiles);
    onUploadComplete(updatedFiles.map(f => f.id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors text-center cursor-pointer",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          uploading && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          ) : (
            <UploadIcon className="h-10 w-10 text-gray-400" />
          )}
          <p className="text-sm font-medium text-gray-700">
            {uploading ? '正在上传...' : '点击或拖拽文件到此处上传'}
          </p>
          <p className="text-xs text-gray-500">
            支持图片、视频、日志文件等
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {file.mimeType.startsWith('image/') ? (
                  <div className="h-10 w-10 shrink-0 rounded overflow-hidden bg-gray-100">
                     <img 
                       src={`/api/uploads/files/${file.path}`} 
                       alt={file.filename}
                       className="h-full w-full object-cover"
                     />
                  </div>
                ) : (
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center bg-gray-100 rounded">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
