import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueService, settingsService, type DeviceModel, type CreateIssueData, type FormField, type Category } from '../services/api';
import { AlertCircle, Info, FileImage, Settings, Wrench, ClipboardList, Loader2 } from 'lucide-react';
import { FileUpload } from '../components/Upload';
import MarkdownEditor from '../components/MarkdownEditor';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';

export default function SubmitIssuePage() {
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('basic');
  const navigate = useNavigate();

  // 表单状态
  const [formData, setFormData] = useState<Partial<CreateIssueData>>({
    submitDate: new Date().toISOString().split('T')[0],
    reporterName: '',
    contact: '',
    modelId: undefined,
    categoryId: undefined,
    serialNumber: '',
    purchaseDate: '',
    customerName: '',
    firmware: '',
    softwareVer: '',
    remarks: '',
    title: '',
    description: '',
    severity: 'MEDIUM',
    occurredAt: '',
    frequency: '',
    environment: '',
    location: '',
    waterType: '',
    voltage: '',
    restarted: false,
    cleaned: false,
    replacedPart: '',
    troubleshooting: '',
    attachmentIds: []
  });

  // 动态字段状态
  const [customData, setCustomData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modelsData, fieldsData, categoriesData] = await Promise.all([
        issueService.getModels(),
        settingsService.getFields(),
        settingsService.getCategories()
      ]);
      setModels(modelsData);
      setCustomFields(fieldsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error(err);
      setError('无法加载基础数据，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelId || !formData.title || !formData.reporterName) {
      setError('请填写必填项');
      return;
    }

    // 校验必填的自定义字段
    for (const field of customFields) {
      if (field.required && !customData[field.label]) {
        setError(`请填写 ${field.label}`);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateIssueData = {
        ...formData as CreateIssueData,
        modelId: Number(formData.modelId),
        customData: customData // Send as object, let backend handle stringify
      };

      const result = await issueService.createIssue(payload);

      // Save to local history
      const historyItem = {
        id: result.id,
        nanoId: result.nanoId,
        title: result.title,
        date: new Date().toISOString()
      };
      const existingHistory = JSON.parse(localStorage.getItem('issue_history') || '[]');
      localStorage.setItem('issue_history', JSON.stringify([historyItem, ...existingHistory]));

      // Redirect to the tracking page with success state
      navigate(`/track/${result.nanoId}`, { state: { submissionSuccess: true, nanoId: result.nanoId } });

      // Reset form
      setFormData({
        submitDate: new Date().toISOString().split('T')[0],
        reporterName: '',
        contact: '',
        modelId: undefined,
        categoryId: undefined,
        serialNumber: '',
        purchaseDate: '',
        customerName: '',
        firmware: '',
        softwareVer: '',
        remarks: '',
        title: '',
        description: '',
        severity: 'MEDIUM',
        occurredAt: '',
        frequency: '',
        environment: '',
        location: '',
        waterType: '',
        voltage: '',
        restarted: false,
        cleaned: false,
        replacedPart: '',
        troubleshooting: '',
        attachmentIds: []
      });
      setCustomData({});
      setActiveSection('basic');
    } catch (err) {
      console.error(err);
      setError('提交失败，请检查网络或联系管理员');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCustomFieldChange = (label: string, value: any) => {
    setCustomData(prev => ({
      ...prev,
      [label]: value
    }));
  };

  const handleUploadComplete = (ids: number[]) => {
    setFormData(prev => ({
      ...prev,
      attachmentIds: ids
    }));
  };

  // 渲染动态字段
  const renderCustomField = (field: FormField) => {
    const commonProps = {
      name: field.label,
      required: field.required,
      value: customData[field.label] || '',
      onChange: (e: any) => handleCustomFieldChange(field.label, e.target.value)
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} rows={3} />;
      case 'select':
        return (
          <Select {...commonProps}>
            <option value="">请选择</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Select>
        );
      case 'radio':
        return (
          <div className="mt-2 space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className="inline-flex items-center mr-4">
                <input
                  type="radio"
                  name={field.label}
                  value={opt}
                  checked={customData[field.label] === opt}
                  onChange={(e) => handleCustomFieldChange(field.label, e.target.value)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="mt-2 space-y-2">
            {field.options?.map(opt => {
              const currentValues = customData[field.label] || [];
              const isChecked = currentValues.includes(opt);
              return (
                <label key={opt} className="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    value={opt}
                    checked={isChecked}
                    onChange={(e) => {
                      const newValues = e.target.checked
                        ? [...currentValues, opt]
                        : currentValues.filter((v: string) => v !== opt);
                      handleCustomFieldChange(field.label, newValues);
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">{opt}</span>
                </label>
              );
            })}
          </div>
        );
      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">咖啡机问题上报</h1>
        <p className="text-sm text-gray-500 mt-1">请填写以下信息以报告咖啡机故障，带 * 为必填项</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Right Side: Form */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">提交出错</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Basic Info */}
            <section id="basic" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-24">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-500" />
                  基本信息
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    提交人 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="reporterName"
                    required
                    value={formData.reporterName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">联系方式</label>
                  <Input
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="手机号或邮箱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    设备机型 <span className="text-red-500">*</span>
                  </label>
                  <Select
                    name="modelId"
                    required
                    value={formData.modelId || ''}
                    onChange={handleChange}
                  >
                    <option value="">请选择机型</option>
                    {models.filter(m => m.isEnabled).map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">设备序列号 (SN)</label>
                  <Input
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="font-mono"
                    placeholder="设备背后的序列号"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">客户名称</label>
                  <Input
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="客户或门店名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">购买日期</label>
                  <div className="relative">
                    <Input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CTR版本号</label>
                  <Input
                    name="firmware"
                    value={formData.firmware || ''}
                    onChange={handleChange}
                    placeholder="如: V1.2.3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">HMI版本号</label>
                  <Input
                    name="softwareVer"
                    value={formData.softwareVer || ''}
                    onChange={handleChange}
                    placeholder="如: V2.0.1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">备注信息</label>
                  <Textarea
                    name="remarks"
                    rows={2}
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    placeholder="例如: 加装了冰箱、自清洗组件等非标品..."
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Detail Info */}
            <section id="detail" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-24">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <FileImage className="w-5 h-5 mr-2 text-indigo-500" />
                  问题描述
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    问题标题 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="简要描述问题 (例如: 开机无反应)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    严重程度
                  </label>
                  <Select
                    name="severity"
                    value={formData.severity || 'MEDIUM'}
                    onChange={handleChange}
                  >
                    <option value="LOW">🟢 轻微 (偶尔影响使用)</option>
                    <option value="MEDIUM">🟡 一般 (功能受限)</option>
                    <option value="HIGH">🟠 严重 (无法使用)</option>
                    <option value="CRITICAL">🔴 紧急 (安全隐患/着火)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">详细描述 <span className="text-red-500">*</span></label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <MarkdownEditor
                      value={formData.description || ''}
                      onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                      height={240}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">支持 Markdown 语法与 Mermaid 流程图</p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">发生时间</label>
                    <Input
                      type="datetime-local"
                      name="occurredAt"
                      value={formData.occurredAt}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">出现频率</label>
                    <Select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                    >
                      <option value="">请选择</option>
                      <option value="必现">必现 (每次都出现)</option>
                      <option value="高频">高频 (经常出现)</option>
                      <option value="低频">低频 (偶尔出现)</option>
                      <option value="单次">单次 (仅出现一次)</option>
                    </Select>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">图片/视频/日志附件</label>
                  <FileUpload onUploadComplete={handleUploadComplete} />
                </div>
              </div>
            </section>

            {/* Section 3: Environment Info */}
            <section id="env" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-24">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-gray-500" />
                  环境信息
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">国家或地区</label>
                  <Input
                    name="environment"
                    value={formData.environment}
                    onChange={handleChange}
                    placeholder="例如: 中国大陆, 欧洲..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">使用地点</label>
                  <Input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="例如: 咖啡厅、办公室"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">进水方式</label>
                  <Select
                    name="waterType"
                    value={formData.waterType}
                    onChange={handleChange}
                  >
                    <option value="">请选择</option>
                    <option value="水箱">水箱</option>
                    <option value="桶装水">桶装水</option>
                    <option value="自进水">自进水</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">电源电压频率</label>
                  <Input
                    name="voltage"
                    value={formData.voltage}
                    onChange={handleChange}
                    placeholder="例如: 220V 50Hz"
                  />
                </div>
              </div>
            </section>

            {/* Section 4: Troubleshooting */}
            <section id="troubleshoot" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-24">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center">
                  <Wrench className="w-5 h-5 mr-2 text-purple-500" />
                  初步排查
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex gap-8">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-full sm:w-auto">
                    <input
                      type="checkbox"
                      name="restarted"
                      checked={formData.restarted}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-900 font-medium">重启后可以修复</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-full sm:w-auto">
                    <input
                      type="checkbox"
                      name="cleaned"
                      checked={formData.cleaned}
                      onChange={handleChange}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-900 font-medium">清洁后可以修复</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">更换配件</label>
                  <Input
                    name="replacedPart"
                    value={formData.replacedPart}
                    onChange={handleChange}
                    placeholder="如有更换，请填写配件名称"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">其他排查步骤</label>
                  <Textarea
                    name="troubleshooting"
                    rows={3}
                    value={formData.troubleshooting}
                    onChange={handleChange}
                    placeholder="描述已进行的其他排查操作..."
                  />
                </div>
              </div>
            </section>

            {/* Section 3.5: Custom Fields */}
            {customFields.length > 0 && (
              <section id="custom" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-24">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-teal-500" />
                    附加信息
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 gap-6">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className={cn(
                        "block text-sm mb-1.5",
                        field.required ? "font-bold text-gray-900" : "font-medium text-gray-500"
                      )}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderCustomField(field)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="flex justify-end pt-4 pb-12">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 text-base shadow-lg"
                isLoading={submitting}
              >
                提交问题报告
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
