import React, { useCallback, useState, useEffect, useRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import mermaid from "mermaid";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    height?: number;
    editable?: boolean;
}

// Mermaid Renderer Component
const Mermaid = ({ code }: { code: string }) => {
    const [svg, setSvg] = useState<string>("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (code && ref.current) {
            mermaid.render(`mermaid-${Date.now()}`, code)
                .then(({ svg }) => setSvg(svg))
                .catch((error) => console.error("Mermaid error:", error));
        }
    }, [code]);

    return <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />;
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
                                const codeText = Array.isArray(children) ? children.join('') : String(children);
                                return <Mermaid code={codeText} />;
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
                                            const codeText = Array.isArray(children) ? children.join('') : String(children);
                                            return <Mermaid code={codeText} />;
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
