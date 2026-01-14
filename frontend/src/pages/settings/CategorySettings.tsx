import { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import { Loader2, Plus, Trash2, Edit2, Check, X, Tag } from 'lucide-react';
import Header from './Header';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';

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
                    <div className="flex w-full sm:w-auto gap-2 items-center">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="输入新分类名称..."
                            className="min-w-[250px]"
                        />
                        <Button
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            icon={<Plus className="w-4 h-4" />}
                        >
                            添加
                        </Button>
                    </div>
                </div>

                <ul className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                        <li key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            {editingId === cat.id ? (
                                <div className="flex items-center gap-2 flex-1 max-w-md">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        autoFocus
                                        className="h-8"
                                    />
                                    <Button size="sm" variant="ghost" onClick={() => handleUpdate(cat.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-gray-500">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                        {cat.name}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-1 sm:ml-4">
                                {editingId !== cat.id && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                                            className="text-gray-400 hover:text-blue-600"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(cat.id)}
                                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                    {categories.length === 0 && (
                        <li className="p-4">
                            <EmptyState
                                icon={Tag}
                                title="暂无分类数据"
                                description="请在上方添加新的问题分类"
                                className="border-0 bg-transparent"
                            />
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}

