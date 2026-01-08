import React, { useState, useEffect, useRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import mermaid from "mermaid";
import { Plus, Minus, RefreshCw, X } from 'lucide-react';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    height?: number;
    editable?: boolean;
}

// Helper function to extract text from React children
const extractTextFromChildren = (children: any): string => {
    if (!children) return '';
    if (typeof children === 'string') return children;
    if (typeof children === 'number') return String(children);
    if (Array.isArray(children)) {
        return children.map(child => extractTextFromChildren(child)).join('');
    }
    if (children.props && children.props.children) {
        return extractTextFromChildren(children.props.children);
    }
    return '';
};

// Mermaid Renderer Component
const Mermaid = ({ code }: { code: string }) => {
    const [svg, setSvg] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Zoom and Pan state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (code && ref.current) {
            mermaid.render(`mermaid-${Date.now()}`, code)
                .then(({ svg }) => setSvg(svg))
                .catch((error) => console.error("Mermaid error:", error));
        }
    }, [code]);

    // Reset zoom/pan when modal opens
    useEffect(() => {
        if (isModalOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Restore body scroll
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(s => Math.min(Math.max(0.5, s + delta), 5));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <>
            <div
                ref={ref}
                dangerouslySetInnerHTML={{ __html: svg }}
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 rounded p-2 inline-block max-w-full overflow-auto bg-white"
                title="点击查看大图"
                style={{ maxWidth: '100%' }}
            />

            {/* Interactive Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                    onClick={() => setIsModalOpen(false)}
                >
                    {/* Controls */}
                    <div className="absolute top-4 right-4 z-50 flex gap-2">
                        <div className="bg-white/90 backdrop-blur shadow-sm border border-gray-200 rounded-lg p-2 flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.2, 5)); }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-700"
                                title="放大"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(0.5, s - 0.2)); }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-700"
                                title="缩小"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({ x: 0, y: 0 }); }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-700"
                                title="重置"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                            <div className="w-px bg-gray-200 mx-1"></div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-gray-500"
                                title="关闭"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Viewport */}
                    <div
                        className="w-full h-full cursor-move flex items-center justify-center"
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            dangerouslySetInnerHTML={{ __html: svg }}
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                transformOrigin: 'center',
                                cursor: isDragging ? 'grabbing' : 'grab',
                                userSelect: 'none' // Prevent text selection while dragging
                            }}
                        />
                    </div>

                    {/* Help Text */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-500 pointer-events-none">
                        滚轮缩放 · 拖拽移动
                    </div>
                </div>
            )}
        </>
    );
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    height = 400,
    editable = true
}) => {
    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
        });
    }, []);

    if (!editable) {
        return (
            <div data-color-mode="light" className="wmde-markdown-var">
                <MDEditor.Markdown
                    source={value}
                    style={{ padding: 0, backgroundColor: 'transparent' }}
                    components={{
                        code: (props) => {
                            const { children, className, ...rest } = props;
                            if (className?.includes('language-mermaid')) {
                                const codeText = extractTextFromChildren(children);
                                return <Mermaid code={codeText.trim()} />;
                            }
                            return <code className={className} {...rest}>{children}</code>;
                        }
                    }}
                />
            </div>
        )
    }

    return (
        <div data-color-mode="light" className="markdown-editor-wrapper h-full">
            <style>{`
                .markdown-editor-wrapper .w-md-editor {
                    border: none !important;
                    box-shadow: none !important;
                    background-color: transparent !important;
                    height: 100% !important;
                }
                .markdown-editor-wrapper .w-md-editor-toolbar {
                    border-bottom: 1px solid #e5e7eb !important;
                    background-color: #f9fafb !important;
                    border-radius: 0 !important;
                }
                .markdown-editor-wrapper .w-md-editor-content {
                    height: calc(100% - 29px) !important;
                }
                .markdown-editor-wrapper .w-md-editor-input,
                .markdown-editor-wrapper .w-md-editor-text-pre,
                .markdown-editor-wrapper .w-md-editor-text-input {
                    min-height: 100% !important;
                }
            `}</style>
            <MDEditor
                value={value}
                onChange={(val) => onChange(val || "")}
                height={height}
                preview="live"
                components={{
                    preview: (source, state, dispatch) => {
                        return (
                            <MDEditor.Markdown
                                source={source}
                                style={{ padding: 15 }}
                                components={{
                                    code: (props) => {
                                        const { children, className, ...rest } = props;
                                        if (className?.includes('language-mermaid')) {
                                            const codeText = extractTextFromChildren(children);
                                            return <Mermaid code={codeText.trim()} />;
                                        }
                                        return <code className={className} {...rest}>{children}</code>;
                                    }
                                }}
                            />
                        )
                    }
                }}
            />
        </div>
    );
};

export default MarkdownEditor;
