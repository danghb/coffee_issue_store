import { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import { Loader2, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import Header from './Header';

interface CategorySettingsProps {
    onBack: () => void;
}

export default function CategorySettings({ onBack }: CategorySettingsProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [newName, setNewName] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await settingsService.getCategories();
            setCategories(data);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            await settingsService.createCategory(newName);
            setNewName('');
            loadCategories();
        } catch (err) {
            alert('添加失败');
        }
    };

    const handleUpdate = async (id: number) => {
        try {
            await settingsService.updateCategory(id, editName);
            setEditingId(null);
            loadCategories();
        } catch (err) {
            alert('更新失败');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('确定删除该分类吗？如果该分类下有问题记录，建议不要删除。')) return;
        try {
            await settingsService.deleteCategory(id);
            loadCategories();
        } catch (err) {
            alert('删除失败：该分类下可能存在关联的问题记录。');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <Header title="问题分类管理" onBack={onBack} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <p className="text-sm text-gray-500">管理问题的原因/类型分类列表</p>
                    <div className="flex w-full sm:w-auto gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="输入新分类名称..."
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
                    {categories.map((cat) => (
                        <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            {editingId === cat.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                                        autoFocus
                                    />
                                    <button onClick={() => handleUpdate(cat.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-md"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingId(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-900">
                                        {cat.name}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-1 sm:ml-4">
                                {editingId !== cat.id && (
                                    <>
                                        <button
                                            onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                    {categories.length === 0 && (
                        <li className="p-12 text-center text-gray-500 text-sm">
                            暂无分类数据，请在上方添加
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
