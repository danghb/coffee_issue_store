import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { settingsService, type DeviceModel, type FormField } from '../services/api';
import { Loader2, ArrowLeft, Plus, Trash2, Edit2, Save, X, GripVertical, Check } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'models' | 'fields'>('models');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/issues" className="mr-4 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">系统设置</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('models')}
                className={`${
                  activeTab === 'models'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                机型管理
              </button>
              <button
                onClick={() => setActiveTab('fields')}
                className={`${
                  activeTab === 'fields'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                表单配置 (动态问卷)
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'models' ? <ModelSettings /> : <FieldSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelSettings() {
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
      await settingsService.updateModel(id, editName);
      setEditingId(null);
      loadModels();
    } catch (err) {
      alert('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除该机型吗？')) return;
    try {
      await settingsService.deleteModel(id);
      loadModels();
    } catch (err) {
      alert('删除失败');
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="输入新机型名称"
          className="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
        />
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加
        </button>
      </div>

      <ul className="divide-y divide-gray-200 border rounded-md">
        {models.map((model) => (
          <li key={model.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            {editingId === model.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-1 border"
                />
                <button onClick={() => handleUpdate(model.id)} className="text-green-600 p-1"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="text-gray-500 p-1"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-900">{model.name}</span>
            )}
            
            <div className="flex items-center gap-2 ml-4">
              {editingId !== model.id && (
                <>
                  <button
                    onClick={() => { setEditingId(model.id); setEditName(model.name); }}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(model.id)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldSettings() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New Field State
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

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加新题目
        </button>
      </div>

      {isCreating && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">题目名称</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              placeholder="例如：安装环境"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">类型</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
              >
                <option value="text">单行文本</option>
                <option value="textarea">多行文本</option>
                <option value="select">下拉选择</option>
                <option value="radio">单选框</option>
                <option value="checkbox">多选框</option>
              </select>
            </div>
            
            <div className="flex items-center pt-6">
              <input
                id="required"
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                必填项
              </label>
            </div>
          </div>

          {(newType === 'select' || newType === 'radio' || newType === 'checkbox') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">选项 (用逗号分隔)</label>
              <input
                type="text"
                value={newOptions}
                onChange={(e) => setNewOptions(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                placeholder="例如：客厅, 厨房, 办公室"
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-gray-200 border rounded-md bg-white">
        {fields.length === 0 && (
           <li className="p-8 text-center text-gray-500 text-sm">暂无自定义题目</li>
        )}
        {fields.map((field) => (
          <li key={field.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                类型: {field.type} 
                {field.options && field.options.length > 0 && ` | 选项: ${field.options.join(', ')}`}
              </p>
            </div>
            <button
              onClick={() => handleDelete(field.id)}
              className="text-red-600 hover:text-red-900 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
