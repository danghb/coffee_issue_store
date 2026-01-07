import { useState, useEffect } from 'react';
import { issueService, settingsService, type DeviceModel, type CreateIssueData, type FormField } from '../services/api';
import { cn } from '../lib/utils';
import { Loader2, CheckCircle2, AlertCircle, Calendar, Info, Settings, Wrench, FileImage, ClipboardList } from 'lucide-react';
import { FileUpload } from '../components/Upload';

// 表单分块配置
const SECTIONS = [
  { id: 'basic', title: '基本信息', icon: Info },
  { id: 'detail', title: '问题描述', icon: FileImage },
  { id: 'env', title: '环境信息', icon: Settings },
  { id: 'custom', title: '附加信息', icon: ClipboardList },
  { id: 'troubleshoot', title: '初步排查', icon: Wrench },
];

export default function SubmitIssuePage() {
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  // 表单状态
  const [formData, setFormData] = useState<Partial<CreateIssueData>>({
    // ... initial state
    submitDate: new Date().toISOString().split('T')[0],
    reporterName: '',
    modelId: undefined,
    // ...
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
      const [modelsData, fieldsData] = await Promise.all([
        issueService.getModels(),
        settingsService.getFields()
      ]);
      setModels(modelsData);
      setCustomFields(fieldsData);
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
        customData: JSON.stringify(customData)
      };
      
      await issueService.createIssue(payload);
      setSuccess(true);
      // Reset form (simplified)
      setFormData({
        submitDate: new Date().toISOString().split('T')[0],
        reporterName: '',
        modelId: undefined,
        title: '',
        description: '',
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

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 渲染动态字段
  const renderCustomField = (field: FormField) => {
    const commonProps = {
      name: field.label,
      required: field.required,
      className: "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border",
      value: customData[field.label] || '',
      onChange: (e: any) => handleCustomFieldChange(field.label, e.target.value)
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={3} />;
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">请选择</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
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
        return <input type="text" {...commonProps} />;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">提交成功</h2>
          <p className="text-gray-600 mb-6">感谢您的反馈，我们会尽快处理。</p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            提交新问题
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">提交新问题</h1>
        <p className="text-sm text-gray-500 mt-1">请填写以下信息以报告产品故障，带 * 为必填项</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left Side: Navigation (Desktop) - Hidden as requested */}
        {/* <div className="hidden lg:block w-64 flex-shrink-0 sticky top-8">...</div> */}

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    提交人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="reporterName"
                    required
                    value={formData.reporterName}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    placeholder="手机号或邮箱"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    设备机型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="modelId"
                    required
                    value={formData.modelId || ''}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                  >
                    <option value="">请选择机型</option>
                    {models.filter(m => m.isEnabled).map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">设备序列号 (SN)</label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border font-mono"
                    placeholder="设备背后的序列号"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    placeholder="客户或门店名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">购买日期</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">固件版本</label>
                  <input
                    type="text"
                    name="firmware"
                    value={formData.firmware}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">软件版本</label>
                  <input
                    type="text"
                    name="softwareVer"
                    value={formData.softwareVer}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    问题标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    placeholder="简要描述问题 (例如: 开机无反应)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">详细描述 <span className="text-red-500">*</span></label>
                  <textarea
                    name="description"
                    rows={4}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    placeholder="请详细描述问题发生的经过、现象等..."
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">发生时间</label>
                    <input
                      type="datetime-local"
                      name="occurredAt"
                      value={formData.occurredAt}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">出现频率</label>
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    >
                      <option value="">请选择</option>
                      <option value="必现">必现 (每次都出现)</option>
                      <option value="高频">高频 (经常出现)</option>
                      <option value="低频">低频 (偶尔出现)</option>
                      <option value="单次">单次 (仅出现一次)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">问题现象</label>
                    <input
                      type="text"
                      name="phenomenon"
                      value={formData.phenomenon}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                      placeholder="例如: 黑屏, 异响"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">错误代码</label>
                    <input
                      type="text"
                      name="errorCode"
                      value={formData.errorCode}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border font-mono"
                      placeholder="例如: E01"
                    />
                  </div>
                </div>
                
                {/* File Upload */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">图片/视频附件</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">使用环境</label>
                  <select
                    name="environment"
                    value={formData.environment}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                  >
                    <option value="">请选择</option>
                    <option value="商用">商用</option>
                    <option value="家用">家用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">使用地点</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="例如: 咖啡厅、办公室"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">水源类型</label>
                  <select
                    name="waterType"
                    value={formData.waterType}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                  >
                    <option value="">请选择</option>
                    <option value="自来水">自来水</option>
                    <option value="过滤水">过滤水</option>
                    <option value="瓶装水">瓶装水</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电源电压</label>
                  <input
                    type="text"
                    name="voltage"
                    value={formData.voltage}
                    onChange={handleChange}
                    placeholder="例如: 220V"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
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
                     <span className="text-sm text-gray-900 font-medium">尝试重启</span>
                   </label>
                   
                   <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 w-full sm:w-auto">
                     <input
                       type="checkbox"
                       name="cleaned"
                       checked={formData.cleaned}
                       onChange={handleChange}
                       className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                     />
                     <span className="text-sm text-gray-900 font-medium">尝试清洁</span>
                   </label>
                 </div>
                 
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">更换配件</label>
                  <input
                    type="text"
                    name="replacedPart"
                    value={formData.replacedPart}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                    placeholder="如有更换，请填写配件名称"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">其他排查步骤</label>
                  <textarea
                    name="troubleshooting"
                    rows={3}
                    value={formData.troubleshooting}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
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
                        "block text-sm mb-1",
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
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all hover:shadow-lg"
              >
                {submitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                提交问题报告
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
