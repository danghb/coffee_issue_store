import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
    title: string;
    onBack: () => void;
}

export default function Header({ title, onBack }: HeaderProps) {
    return (
        <div className="flex items-center space-x-4 mb-8">
            <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
    );
}
