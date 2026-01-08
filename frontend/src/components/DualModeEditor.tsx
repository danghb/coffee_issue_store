import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import MarkdownEditor from './MarkdownEditor';
import { Toggle } from './ui/toggle';
import { FileText, Code } from 'lucide-react';
import TurndownService from 'turndown';
import { marked } from 'marked';

interface DualModeEditorProps {
    value: string; // Accepts either HTML or Markdown, effectively
    onChange: (value: string) => void;
    height?: number;
    editable?: boolean;
}

const turndownService = new TurndownService();

const DualModeEditor: React.FC<DualModeEditorProps> = ({ value, onChange, height = 400, editable = true }) => {
    const [mode, setMode] = useState<'rich' | 'markdown'>('markdown');
    const [internalValue, setInternalValue] = useState(value);
    // 保留原始Markdown，避免切换丢失格式
    const [originalMarkdown, setOriginalMarkdown] = useState(value);

    useEffect(() => {
        // 当外部value变化时，同步更新
        setOriginalMarkdown(value);

        // 根据当前模式转换显示值
        if (mode === 'rich' && !value.trim().startsWith('<')) {
            try {
                const html = marked.parse(value) as string;
                setInternalValue(html);
            } catch (e) {
                setInternalValue(value);
            }
        } else {
            setInternalValue(value);
        }
    }, [value]);

    const handleModeSwitch = (newMode: 'rich' | 'markdown') => {
        if (newMode === mode) return;

        if (newMode === 'markdown') {
            // 切换回Markdown：恢复原始Markdown，避免格式丢失
            setInternalValue(originalMarkdown);
        } else {
            // 切换到富文本：将Markdown转为HTML用于显示
            try {
                const html = marked.parse(originalMarkdown) as string;
                setInternalValue(html);
            } catch (e) {
                console.error("Conversion to HTML failed", e);
                setInternalValue(originalMarkdown);
            }
        }

        setMode(newMode);
        // 注意：这里不调用onChange，模式切换不应该触发保存
    };

    const handleChange = (val: string) => {
        setInternalValue(val);

        // Always output Markdown to parent (方案A: 统一存储为Markdown)
        if (mode === 'rich') {
            // Rich mode: 转换为Markdown后保存
            try {
                const markdown = turndownService.turndown(val);
                setOriginalMarkdown(markdown); // 更新原始Markdown
                onChange(markdown);
            } catch (e) {
                console.error("Failed to convert HTML to Markdown", e);
                onChange(val);
            }
        } else {
            // Markdown mode: 直接保存
            setOriginalMarkdown(val); // 更新原始Markdown
            onChange(val);
        }
    };

    if (!editable) {
        return (
            <MarkdownEditor
                value={value}
                onChange={() => { }}
                editable={false}
            />
        );
    }

    return (
        <div
            className="border border-gray-200 rounded-lg bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 flex flex-col"
            style={{ height: `${height + 90}px` }}
        >
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50/80 border-b border-gray-200 flex-shrink-0">
                <div className="flex bg-gray-200/50 p-1 rounded-lg">
                    <button
                        type="button"
                        onClick={() => handleModeSwitch('rich')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'rich'
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        文档模式
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeSwitch('markdown')}
                        className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'markdown'
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                    >
                        <Code className="w-4 h-4 mr-2" />
                        Markdown
                    </button>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                    {mode === 'rich' ? 'WYSIWYG' : 'Markdown + Mermaid'}
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {mode === 'rich' ? (
                    <RichTextEditor
                        value={internalValue}
                        onChange={handleChange}
                        editable={editable}
                        bordered={false}
                    />
                ) : (
                    <MarkdownEditor
                        value={internalValue}
                        onChange={handleChange}
                        height={height}
                        editable={editable}
                    />
                )}
            </div>

            <div className="bg-white border-t border-gray-100 px-4 py-2 flex justify-end flex-shrink-0">
                <span className="text-xs text-gray-400 tabular-nums">
                    {internalValue.length} 字符
                </span>
            </div>
        </div>
    );
};

export default DualModeEditor;
