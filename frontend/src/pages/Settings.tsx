import { useState } from 'react';
import SettingsRoot from './settings/SettingsRoot';
import ModelSettings from './settings/ModelSettings';
import CategorySettings from './settings/CategorySettings';
import FieldSettings from './settings/FieldSettings';
import PerformanceSettings from './settings/PerformanceSettings';
import UserManagementSettings from './settings/UserManagementSettings';

export default function SettingsPage() {
  const [currentView, setCurrentView] = useState<'root' | 'models' | 'categories' | 'fields' | 'performance' | 'users'>('root');

  const renderView = () => {
    switch (currentView) {
      case 'models':
        return <ModelSettings onBack={() => setCurrentView('root')} />;
      case 'categories':
        return <CategorySettings onBack={() => setCurrentView('root')} />;
      case 'fields':
        return <FieldSettings onBack={() => setCurrentView('root')} />;
      case 'performance':
        return <PerformanceSettings onBack={() => setCurrentView('root')} />;
      case 'users':
        return <UserManagementSettings onBack={() => setCurrentView('root')} />;
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
