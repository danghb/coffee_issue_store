import { useState, useEffect } from 'react';
import { issueService, type DeviceModel } from '../services/api';
import { cn } from '../lib/utils';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SubmitIssuePage() {
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    modelId: '',
    firmware: '',
    reporterName: '',
    contact: ''
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await issueService.getModels();
      setModels(data);
    } catch (err) {
      console.error(err);
      setError('无法加载机型列表，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modelId) {
      setError('请选择机型');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await issueService.createIssue({
        ...formData,
        modelId: Number(formData.modelId)
      });
      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        modelId: '',
        firmware: '',
        reporterName: '',
        contact: ''
      });
    } catch (err) {
      console.error(err);
      setError('提交失败，请检查网络或联系管理员');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">提交产品问题</h1>
          <p className="mt-2 text-gray-600">请详细描述您遇到的问题，帮助我们改进产品</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 标题 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  问题标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="一句话描述问题"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              {/* 描述 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  详细描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="请包含复现步骤、现象描述等..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* 机型 */}
                <div>
                  <label htmlFor="modelId" className="block text-sm font-medium text-gray-700">
                    设备机型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="modelId"
                    id="modelId"
                    required
                    value={formData.modelId}
                    onChange={handleChange}
                    disabled={loading}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  >
                    <option value="">请选择机型</option>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 固件版本 */}
                <div>
                  <label htmlFor="firmware" className="block text-sm font-medium text-gray-700">
                    固件版本
                  </label>
                  <input
                    type="text"
                    name="firmware"
                    id="firmware"
                    value={formData.firmware}
                    onChange={handleChange}
                    placeholder="例如：v1.2.3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* 提出人 */}
                <div>
                  <label htmlFor="reporterName" className="block text-sm font-medium text-gray-700">
                    您的姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="reporterName"
                    id="reporterName"
                    required
                    value={formData.reporterName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                {/* 联系方式 */}
                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                    联系方式
                  </label>
                  <input
                    type="text"
                    name="contact"
                    id="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="手机 / 邮箱 / 钉钉"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                    submitting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    '提交问题'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} 产品问题收集系统
        </div>
      </div>
    </div>
  );
}
