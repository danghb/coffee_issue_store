import { useState, useEffect, useRef } from 'react';
import { FileIcon, Maximize2, Minimize2, FileText, Download, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface AttachmentItemProps {
    attachment: {
        id: number;
        filename: string;
        path: string;
        mimeType: string;
    };
    getDownloadUrl: (path: string) => string;
    onPreviewImage: (url: string) => void;
}

export const AttachmentItem: React.FC<AttachmentItemProps> = ({ attachment, getDownloadUrl, onPreviewImage }) => {
    const [isWebFullscreen, setIsWebFullscreen] = useState(false);
    const [textPreview, setTextPreview] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const downloadUrl = getDownloadUrl(attachment.path);
    const isImage = attachment.mimeType.startsWith('image/');
    const isVideo = attachment.mimeType.startsWith('video/');
    const isText = attachment.mimeType.startsWith('text/') ||
        attachment.filename.endsWith('.txt') ||
        attachment.filename.endsWith('.log') ||
        attachment.filename.endsWith('.md') ||
        attachment.filename.endsWith('.json') ||
        attachment.filename.endsWith('.csv');

    useEffect(() => {
        if (isText && !textPreview) {
            setLoadingText(true);
            fetch(downloadUrl)
                .then(res => {
                    // Read first chunk only
                    const reader = res.body?.getReader();
                    if (reader) {
                        return reader.read().then(({ value }) => {
                            const text = new TextDecoder().decode(value);
                            // Get first 5 lines
                            const lines = text.split('\n').slice(0, 5).join('\n');
                            setTextPreview(lines + (text.split('\n').length > 5 ? '\n...' : ''));
                            reader.cancel();
                        });
                    }
                    return res.text().then(text => {
                        const lines = text.split('\n').slice(0, 5).join('\n');
                        setTextPreview(lines + (text.split('\n').length > 5 ? '\n...' : ''));
                    });
                })
                .catch(err => {
                    console.error("Failed to preview text", err);
                    setTextPreview("无法预览文件内容");
                })
                .finally(() => setLoadingText(false));
        }
    }, [isText, downloadUrl, textPreview]);

    const toggleWebFullscreen = () => {
        setIsWebFullscreen(!isWebFullscreen);
    };

    // Video Render
    if (isVideo) {
        return (
            <div className={cn(
                "relative group border border-gray-200 bg-black/5 overflow-hidden transition-all",
                isWebFullscreen ? "fixed inset-0 z-50 flex items-center justify-center bg-black" : "rounded-lg w-64 h-48"
            )}>
                <video
                    ref={videoRef}
                    src={downloadUrl}
                    controls
                    className={cn(
                        "max-w-full max-h-full",
                        isWebFullscreen ? "w-auto h-auto" : "w-full h-full object-contain"
                    )}
                />
                <div className={cn(
                    "absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity",
                    isWebFullscreen ? "opacity-100" : ""
                )}>
                    <button
                        type="button"
                        onClick={toggleWebFullscreen}
                        className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                        title={isWebFullscreen ? "退出网页全屏" : "网页全屏"}
                    >
                        {isWebFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
                {isWebFullscreen && (
                    <button
                        type="button"
                        onClick={() => setIsWebFullscreen(false)}
                        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"
                    >
                        <X className="w-8 h-8" />
                    </button>
                )}
            </div>
        );
    }

    // Image Render
    if (isImage) {
        return (
            <div
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all h-24 w-24 bg-gray-100"
                onClick={() => onPreviewImage(downloadUrl)}
            >
                <img
                    src={downloadUrl}
                    alt={attachment.filename}
                    className="h-full w-full object-cover"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    {/* Use a generic maximize icon or eye icon */}
                    <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                </div>
            </div>
        );
    }

    // Text Render
    if (isText) {
        return (
            <div className="flex flex-col w-full max-w-sm border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                <div className="flex items-center p-2 bg-white border-b border-gray-200">
                    <FileText className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-xs font-medium text-gray-700 truncate flex-1">{attachment.filename}</span>
                    <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="下载"
                    >
                        <Download className="w-4 h-4" />
                    </a>
                </div>
                <div className="p-2 bg-gray-50 text-xs font-mono text-gray-600 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {loadingText ? (
                        <span className="text-gray-400">加载预览...</span>
                    ) : (
                        textPreview || <span className="text-gray-400 italic">无预览内容</span>
                    )}
                </div>
            </div>
        );
    }

    // Default File Render
    return (
        <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors max-w-xs"
        >
            <FileIcon className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-xs text-gray-700 truncate">{attachment.filename}</span>
        </a>
    );
};
