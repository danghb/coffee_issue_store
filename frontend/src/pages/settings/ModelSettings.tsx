import { useState, useEffect } from 'react';
import { settingsService, type DeviceModel } from '../../services/api';
import { Loader2, Plus, Trash2, Edit2, Check, X, Power, PowerOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import Header from './Header';

interface ModelSettingsProps {
    onBack: () => void;
}

export default function ModelSettings({ onBack }: ModelSettingsProps) {
    const [models, setModels] = useState<DeviceModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [newName, setNewName] = useState('');

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            const data = await settingsService.getModels();
            setModels(data);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            await settingsService.createModel(newName);
            setNewName('');
            loadModels();
        } catch (err) {
            alert('添加失败');
        }
    };

    const handleUpdate = async (id: number) => {
        try {
            await settingsService.updateModel(id, { name: editName });
            setEditingId(null);
            loadModels();
        } catch (err) {
            alert('更新失败');
        }
    };

    const handleToggleStatus = async (model: DeviceModel) => {
        try {
            await settingsService.updateModel(model.id, { isEnabled: !model.isEnabled });
            loadModels();
        } catch (err) {
            alert('状态更新失败');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('确定彻底删除该机型吗？如果该机型下有问题记录，建议使用"停用"功能。')) return;
        try {
            await settingsService.deleteModel(id);
            loadModels();
        } catch (err) {
            alert('删除失败：该机型下可能存在关联的问题记录，请尝试"停用"该机型。');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <Header title="机型管理" onBack={onBack} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <p className="text-sm text-gray-500">管理系统中可用的产品型号列表</p>
                    <div className="flex w-full sm:w-auto gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="输入新机型名称..."
                            className="flex-1 min-w-[200px] block rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            添加
                        </button>
                    </div>
                </div>

                <ul className="divide-y divide-gray-100">
                    {models.map((model) => (
                        <li key={model.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            {editingId === model.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                        autoFocus
                                    />
                                    <button onClick={() => handleUpdate(model.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-md"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingId(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-2 h-2 rounded-full", model.isEnabled ? "bg-green-500" : "bg-gray-300")} />
                                    <span className={cn("text-sm font-medium", model.isEnabled ? "text-gray-900" : "text-gray-400 line-through")}>
                                        {model.name}
                                    </span>
                                    {!model.isEnabled && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">已停用</span>}
                                </div>
                            )}

                            <div className="flex items-center gap-1 sm:ml-4">
                                {editingId !== model.id && (
                                    <>
                                        <button
                                            onClick={() => handleToggleStatus(model)}
                                            className={cn(
                                                "p-2 rounded-md transition-colors",
                                                model.isEnabled
                                                    ? "text-green-600 hover:bg-green-50"
                                                    : "text-gray-400 hover:bg-gray-100"
                                            )}
                                            title={model.isEnabled ? "点击停用" : "点击启用"}
                                        >
                                            {model.isEnabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => { setEditingId(model.id); setEditName(model.name); }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(model.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                    {models.length === 0 && (
                        <li className="p-12 text-center text-gray-500 text-sm">
                            暂无机型数据，请在上方添加
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
