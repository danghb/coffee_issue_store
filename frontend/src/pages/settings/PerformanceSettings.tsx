import { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import { Loader2, ShieldAlert } from 'lucide-react';
import Header from './Header';

interface PerformanceSettingsProps {
    onBack: () => void;
}

export default function PerformanceSettings({ onBack }: PerformanceSettingsProps) {
    const [targetSLA, setTargetSLA] = useState(5);
    const [warningThreshold, setWarningThreshold] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const config = await settingsService.getSLAConfig();
            setTargetSLA(config.targetSLA);
            setWarningThreshold(config.warningThreshold);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await settingsService.updateSLAConfig({ targetSLA, warningThreshold });
            alert('配置已保存');
        } catch (err) {
            alert('保存失败');
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
            <Header title="绩效管理配置" onBack={onBack} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-base font-medium text-gray-900 mb-4">SLA 响应目标设置 (工作日)</h3>
                    <div className="space-y-6 max-w-xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">常规问题标准解决时效 (天)</label>
                            <p className="text-xs text-gray-500 mb-3">默认 5 个工作日。超过该时间未解决工单将标记为逾期。</p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="1"
                                    value={targetSLA}
                                    onChange={e => setTargetSLA(Number(e.target.value))}
                                    className="block w-32 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                                />
                                <span className="text-gray-500">工作日</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">即将逾期预警阈值 (天)</label>
                            <p className="text-xs text-gray-500 mb-3">剩余时间小于该值时，卡片将显示黄色预警。</p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="0"
                                    value={warningThreshold}
                                    onChange={e => setWarningThreshold(Number(e.target.value))}
                                    className="block w-32 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2.5 border"
                                />
                                <span className="text-gray-500">工作日</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-900 mb-1">说明</p>
                        <p>系统会自动跳过周末和法定节假日（需后端配置节假日表，当前仅跳过周末）。</p>
                        <p className="mt-1">更改配置后，仅对<span className="font-bold text-gray-800">新提交</span>的工单生效，已存在的工单不会重新计算目标日期。</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        保存配置
                    </button>
                </div>
            </div>
        </div>
    );
}
