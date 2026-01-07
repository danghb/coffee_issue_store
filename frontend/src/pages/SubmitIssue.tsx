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
  { id: 'custom', title: '调查问卷', icon: ClipboardList },
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
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* 顶部导航 */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">产品问题收集</h1>
              </div>
            </div>
            {/* 简单的进度导航 */}
            <div className="hidden sm:flex space-x-8 items-center">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeSection === section.id 
                        ? "text-blue-600 bg-blue-50" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {section.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center sticky top-20 z-20">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: 基本信息 */}
          <section id="basic" className="bg-white shadow rounded-lg overflow-hidden scroll-mt-24">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Info className="w-5 h-5 mr-2 text-blue-500" />
                基本信息
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">提交日期</label>
                <input
                  type="date"
                  name="submitDate"
                  value={formData.submitDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">提交人 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="reporterName"
                  required
                  value={formData.reporterName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">联系方式</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="电话 / 邮箱"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">设备机型 <span className="text-red-500">*</span></label>
                <select
                  name="modelId"
                  required
                  value={formData.modelId || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="">请选择机型</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">设备序列号 (SN)</label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">购买日期</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">固件版本</label>
                <input
                  type="text"
                  name="firmware"
                  value={formData.firmware}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">软件版本</label>
                <input
                  type="text"
                  name="softwareVer"
                  value={formData.softwareVer}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
          </section>

          {/* Section 2: 问题描述 */}
          <section id="detail" className="bg-white shadow rounded-lg overflow-hidden scroll-mt-24">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <FileImage className="w-5 h-5 mr-2 text-blue-500" />
                问题描述
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">问题标题 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="一句话概括问题"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">发生时间</label>
                  <input
                    type="datetime-local"
                    name="occurredAt"
                    value={formData.occurredAt}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">问题频率</label>
                  <select
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  >
                    <option value="">请选择</option>
                    <option value="偶发">偶发</option>
                    <option value="经常发生">经常发生</option>
                    <option value="持续存在">持续存在</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">问题现象</label>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                   {['无法启动', '出现错误代码', '液体泄漏', '咖啡口感异常', '功能异常', '其他'].map(p => (
                     <label key={p} className="inline-flex items-center">
                       <input
                         type="radio"
                         name="phenomenon"
                         value={p}
                         checked={formData.phenomenon === p}
                         onChange={handleChange}
                         className="form-radio h-4 w-4 text-blue-600"
                       />
                       <span className="ml-2 text-sm text-gray-700">{p}</span>
                     </label>
                   ))}
                </div>
              </div>

              {formData.phenomenon === '出现错误代码' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">错误代码</label>
                  <input
                    type="text"
                    name="errorCode"
                    value={formData.errorCode}
                    onChange={handleChange}
                    placeholder="例如: E01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">详细描述 <span className="text-red-500">*</span></label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="请详细描述问题的发生情况、操作步骤、异常现象等..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">附件上传 (照片/视频/日志)</label>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </div>
            </div>
          </section>

          {/* Section 3: 环境信息 */}
          <section id="env" className="bg-white shadow rounded-lg overflow-hidden scroll-mt-24">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-500" />
                环境信息
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">使用环境</label>
                <select
                  name="environment"
                  value={formData.environment}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="">请选择</option>
                  <option value="商用">商用</option>
                  <option value="家用">家用</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">使用地点</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="例如: 咖啡厅、办公室"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">水源类型</label>
                <select
                  name="waterType"
                  value={formData.waterType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="">请选择</option>
                  <option value="自来水">自来水</option>
                  <option value="过滤水">过滤水</option>
                  <option value="瓶装水">瓶装水</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">电源电压</label>
                <input
                  type="text"
                  name="voltage"
                  value={formData.voltage}
                  onChange={handleChange}
                  placeholder="例如: 220V"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
          </section>

          {/* Section 3.5: 动态问卷 */}
          {customFields.length > 0 && (
            <section id="custom" className="bg-white shadow rounded-lg overflow-hidden scroll-mt-24">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <ClipboardList className="w-5 h-5 mr-2 text-blue-500" />
                  调查问卷
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-6">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 4: 初步排查 */}
          <section id="troubleshoot" className="bg-white shadow rounded-lg overflow-hidden scroll-mt-24">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Wrench className="w-5 h-5 mr-2 text-blue-500" />
                初步排查
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 space-y-6">
               <div className="flex space-x-6">
                 <label className="flex items-center space-x-2">
                   <input
                     type="checkbox"
                     name="restarted"
                     checked={formData.restarted}
                     onChange={handleChange}
                     className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                   />
                   <span className="text-sm text-gray-700">是否尝试重启设备</span>
                 </label>
                 <label className="flex items-center space-x-2">
                   <input
                     type="checkbox"
                     name="cleaned"
                     checked={formData.cleaned}
                     onChange={handleChange}
                     className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                   />
                   <span className="text-sm text-gray-700">是否尝试清洁或维护</span>
                 </label>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700">更换过的配件 (如有)</label>
                 <input
                   type="text"
                   name="replacedPart"
                   value={formData.replacedPart}
                   onChange={handleChange}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                   />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700">其他排查步骤</label>
                 <textarea
                   name="troubleshooting"
                   rows={3}
                   value={formData.troubleshooting}
                   onChange={handleChange}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                 />
               </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full sm:w-auto flex justify-center py-3 px-8 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                submitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  正在提交...
                </>
              ) : (
                '提交反馈'
              )}
            </button>
          </div>

        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} 产品问题收集系统
        </div>
      </div>
    </div>
  );
}
