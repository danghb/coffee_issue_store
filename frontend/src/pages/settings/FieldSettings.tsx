import { useState, useEffect } from 'react';
import { settingsService, type FormField } from '../../services/api';
import { Loader2, Plus, Trash2, X, ListChecks } from 'lucide-react';
import Header from './Header';

interface FieldSettingsProps {
    onBack: () => void;
}

// Icon helper
function InfoIcon({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="12" y2="16" /><line x1="12" x2="12.01" y1="8" y2="8" /></svg>;
}

function getTypeLabel(type: string) {
    const map: Record<string, string> = {
        text: '单行文本',
        textarea: '多行文本',
        select: '下拉选择',
        radio: '单选框',
        checkbox: '多选框'
    };
    return map[type] || type;
}

export default function FieldSettings({ onBack }: FieldSettingsProps) {
    const [fields, setFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const [newLabel, setNewLabel] = useState('');
    const [newType, setNewType] = useState<FormField['type']>('text');
    const [newOptions, setNewOptions] = useState('');
    const [newRequired, setNewRequired] = useState(false);

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        try {
            const data = await settingsService.getFields();
            setFields(data);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newLabel) return;
        try {
            await settingsService.createField({
                label: newLabel,
                type: newType,
                options: newOptions ? newOptions.split(',').map(s => s.trim()) : [],
                required: newRequired,
                order: fields.length,
                isEnabled: true
            });
            setIsCreating(false);
            resetForm();
            loadFields();
        } catch (err) {
            alert('创建失败');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('确定删除该题目吗？')) return;
        try {
            await settingsService.deleteField(id);
            loadFields();
        } catch (err) {
            alert('删除失败');
        }
    };

    const resetForm = () => {
        setNewLabel('');
        setNewType('text');
        setNewOptions('');
        setNewRequired(false);
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <Header title="表单配置" onBack={onBack} />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">配置提交问题时需要填写的额外字段</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        添加新题目
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-md space-y-5 ring-4 ring-blue-50/50">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                            <h3 className="text-base font-medium text-gray-900">新建题目</h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">题目名称</label>
                            <input
                                type="text"
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                                placeholder="例如：安装环境"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">题目类型</label>
                                <select
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value as any)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                                >
                                    <option value="text">单行文本</option>
                                    <option value="textarea">多行文本</option>
                                    <option value="select">下拉选择</option>
                                    <option value="radio">单选框</option>
                                    <option value="checkbox">多选框</option>
                                </select>
                            </div>

                            <div className="flex items-center pt-7">
                                <label className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={newRequired}
                                        onChange={(e) => setNewRequired(e.target.checked)}
                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-900">设为必填项</span>
                                </label>
                            </div>
                        </div>

                        {(newType === 'select' || newType === 'radio' || newType === 'checkbox') && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <label className="block text-sm font-medium text-gray-700 mb-1">选项列表</label>
                                <input
                                    type="text"
                                    value={newOptions}
                                    onChange={(e) => setNewOptions(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                                    placeholder="例如：客厅, 厨房, 办公室"
                                />
                                <p className="mt-2 text-xs text-gray-500 flex items-center">
                                    <InfoIcon className="w-3 h-3 mr-1" />
                                    多个选项之间请使用英文逗号 "," 分隔
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newLabel}
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                保存题目
                            </button>
                        </div>
                    </div>
                )}

                <ul className="grid grid-cols-1 gap-4">
                    {fields.length === 0 && !isCreating && (
                        <li className="p-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
                            <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">暂无自定义题目</p>
                            <button onClick={() => setIsCreating(true)} className="text-blue-600 font-medium text-sm mt-2 hover:underline">立即创建</button>
                        </li>
                    )}
                    {fields.map((field) => (
                        <li key={field.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">{getTypeLabel(field.type)}</span>
                                    <h4 className="text-base font-semibold text-gray-900">
                                        {field.label}
                                    </h4>
                                    {field.required && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                                            必填
                                        </span>
                                    )}
                                </div>

                                {field.options && field.options.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {field.options.map((opt, idx) => (
                                            <span key={idx} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-100">
                                                {opt}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <p className="text-xs text-gray-400 mt-3 font-mono">ID: {field.id} &middot; Order: {field.order}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(field.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="删除题目"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
