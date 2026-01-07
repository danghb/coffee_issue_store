import { useState, useEffect } from 'react';
import { settingsService, type DeviceModel, type FormField } from '../services/api';
import { Loader2, Plus, Trash2, Edit2, Check, X, Box, ListChecks, Power, PowerOff, ChevronRight, ArrowLeft, BarChart3, Settings2, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const [currentView, setCurrentView] = useState<'root' | 'models' | 'fields' | 'performance'>('root');

  const renderView = () => {
    switch (currentView) {
      case 'models':
        return <ModelSettings onBack={() => setCurrentView('root')} />;
      case 'fields':
        return <FieldSettings onBack={() => setCurrentView('root')} />;
      case 'performance':
        return <PerformanceSettings onBack={() => setCurrentView('root')} />;
      default:
        return <SettingsRoot onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {renderView()}
    </div>
  );
}

function SettingsRoot({ onNavigate }: { onNavigate: (view: any) => void }) {
  const menus = [
    {
      id: 'models',
      title: '机型管理',
      desc: '管理产品型号、启用/停用设备',
      icon: Box,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'fields',
      title: '表单配置',
      desc: '自定义问题上报的问卷字段',
      icon: ListChecks,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      id: 'performance',
      title: '绩效管理',
      desc: '设置SLA目标与考核指标',
      icon: BarChart3,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置系统参数与业务规则</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col text-left bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
          >
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110", item.color)}>
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 mt-2 mb-4 flex-1">
              {item.desc}
            </p>
            <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-blue-500">
              进入设置
              <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
        <p>系统版本 v1.2.0 &middot; 研发中心电子部开发</p>
      </div>
    </div>
  );
}

// --- Sub Views ---

function Header({ title, onBack }: { title: string, onBack: () => void }) {
  return (
    <div className="flex items-center space-x-4 mb-8">
      <button
        onClick={onBack}
        className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function ModelSettings({ onBack }: { onBack: () => void }) {
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
              暂无机型数据，请在上放添加
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function FieldSettings({ onBack }: { onBack: () => void }) {
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

function PerformanceSettings({ onBack }: { onBack: () => void }) {
  // Mock settings for performance
  const [targetSLA, setTargetSLA] = useState(24);
  const [warningThreshold, setWarningThreshold] = useState(12);

  return (
    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
      <Header title="绩效管理配置" onBack={onBack} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-base font-medium text-gray-900 mb-4">SLA 响应目标设置</h3>
          <div className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标准响应时间 (小时)</label>
              <p className="text-xs text-gray-500 mb-3">超过该时间未解决工单将标记为逾期</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={targetSLA}
                  onChange={e => setTargetSLA(Number(e.target.value))}
                  className="block w-32 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                />
                <span className="text-gray-500">Hours</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预警阈值 (小时)</label>
              <p className="text-xs text-gray-500 mb-3">剩余时间小于该值时，卡片将显示黄色预警</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={warningThreshold}
                  onChange={e => setWarningThreshold(Number(e.target.value))}
                  className="block w-32 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                />
                <span className="text-gray-500">Hours</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900 mb-1">说明</p>
            <p>绩效指标将用于统计看板中的 "SLA 达标率" 计算。目前的计算逻辑是基于工单的 "创建时间" 到 "解决时间" 的差值。</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
            保存配置
          </button>
        </div>
      </div>
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

// Icon helper
function InfoIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="12" y2="16" /><line x1="12" x2="12.01" y1="8" y2="8" /></svg>;
}
