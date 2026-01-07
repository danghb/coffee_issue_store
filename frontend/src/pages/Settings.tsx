import { useState, useEffect } from 'react';
import { settingsService, type DeviceModel, type FormField } from '../services/api';
import { Loader2, Plus, Trash2, Edit2, Check, X, Box, ListChecks, Power, PowerOff } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'models' | 'fields'>('models');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">管理产品机型和自定义问卷字段</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="flex flex-col md:flex-row h-full">
          {/* Settings Sidebar */}
          <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-100 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('models')}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeTab === 'models'
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                )}
              >
                <Box className={cn("w-5 h-5 mr-3", activeTab === 'models' ? "text-blue-500" : "text-gray-400")} />
                机型管理
              </button>
              <button
                onClick={() => setActiveTab('fields')}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  activeTab === 'fields'
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                )}
              >
                <ListChecks className={cn("w-5 h-5 mr-3", activeTab === 'fields' ? "text-blue-500" : "text-gray-400")} />
                表单配置 (动态问卷)
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6 md:p-8">
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

  const handleToggleStatus = async (model: DeviceModel) => {
    try {
      await settingsService.updateModel(model.id, { isEnabled: !model.isEnabled });
      loadModels();
    } catch (err) {
      alert('状态更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    // 这里的删除仅作为最后的手段（物理删除），仅当无关联数据时才成功
    // 但 UI 上主要引导用户使用“停用”
    if (!window.confirm('确定彻底删除该机型吗？如果该机型下有问题记录，建议使用“停用”功能。')) return;
    try {
      await settingsService.deleteModel(id);
      loadModels();
    } catch (err) {
      alert('删除失败：该机型下可能存在关联的问题记录，请尝试“停用”该机型。');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h2 className="text-lg font-medium text-gray-900">产品机型列表</h2>
           <p className="text-sm text-gray-500 mt-1">配置系统中可供选择的产品型号</p>
         </div>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="输入新机型名称..."
          className="flex-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加
        </button>
      </div>

      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
        {models.map((model) => (
          <li key={model.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            {editingId === model.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                  autoFocus
                />
                <button onClick={() => handleUpdate(model.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-md"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-medium pl-2", model.isEnabled ? "text-gray-900" : "text-gray-400 line-through")}>
                  {model.name}
                </span>
                {!model.isEnabled && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">已停用</span>}
              </div>
            )}
            
            <div className="flex items-center gap-1 ml-4">
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
          <li className="p-8 text-center text-gray-500 text-sm">
            暂无机型数据，请添加
          </li>
        )}
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h2 className="text-lg font-medium text-gray-900">自定义表单字段</h2>
           <p className="text-sm text-gray-500 mt-1">添加额外的问卷题目到提交页面</p>
         </div>
         <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加新题目
          </button>
      </div>

      {isCreating && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">题目名称</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
              placeholder="例如：安装环境"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
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
              <label className="flex items-center cursor-pointer">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选项列表 (用逗号分隔)</label>
              <input
                type="text"
                value={newOptions}
                onChange={(e) => setNewOptions(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                placeholder="例如：客厅, 厨房, 办公室"
              />
              <p className="mt-1 text-xs text-gray-500">多个选项之间请使用英文逗号 "," 分隔</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
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

      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
        {fields.length === 0 && !isCreating && (
           <li className="p-12 text-center">
             <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500 text-sm">暂无自定义题目，点击右上角添加</p>
           </li>
        )}
        {fields.map((field) => (
          <li key={field.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  {field.label}
                </h4>
                {field.required && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    必填
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{getTypeLabel(field.type)}</span>
                {field.options && field.options.length > 0 && (
                  <span className="truncate max-w-xs border-l border-gray-300 pl-2">
                    选项: {field.options.join(', ')}
                  </span>
                )}
              </p>
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
  );
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
