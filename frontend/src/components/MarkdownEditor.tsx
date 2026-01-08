import React, { useCallback, useState, useEffect, useRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import mermaid from "mermaid";

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
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (code && ref.current) {
            mermaid.render(`mermaid-${Date.now()}`, code)
                .then(({ svg }) => setSvg(svg))
                .catch((error) => console.error("Mermaid error:", error));
        }
    }, [code]);

    return (
        <>
            <div
                ref={ref}
                dangerouslySetInnerHTML={{ __html: svg }}
                onClick={() => setIsModalOpen(true)}
                className="cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 rounded p-2 inline-block max-w-full overflow-auto"
                title="点击查看大图"
                style={{ maxWidth: '100%' }}
            />

            {/* 放大模态框 */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-8"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl p-6 border border-gray-300 overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '95vw', maxHeight: '90vh' }}
                    >
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">流程图</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl leading-none px-2 hover:bg-gray-100 rounded"
                            >
                                ×
                            </button>
                        </div>
                        <div
                            dangerouslySetInnerHTML={{ __html: svg }}
                            className="flex justify-center items-center"
                            style={{ transform: 'scale(2)', transformOrigin: 'center', padding: '3rem' }}
                        />
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
