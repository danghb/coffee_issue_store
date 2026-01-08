import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MultiSelectProps<T extends string | number> {
    options: { label: string; value: T }[];
    value: T[];
    onChange: (value: T[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect<T extends string | number>({ options, value, onChange, placeholder = "Select...", className }: MultiSelectProps<T>) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue: T) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const selectedLabels = value.map(v => options.find(o => o.value === v)?.label).filter(Boolean);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-gray-50 hover:bg-white transition-colors h-[42px]"
            >
                <span className="block truncate">
                    {selectedLabels.length > 0 ? (
                        <span className="text-gray-900 font-medium">{selectedLabels.join(', ')}</span>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
                {value.length > 0 && (
                    <div
                        className="absolute inset-y-0 right-8 flex items-center pr-2 cursor-pointer group"
                        onClick={handleClear}
                    >
                        <X className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100">
                    {options.length === 0 ? (
                        <div className="py-2 px-3 text-gray-500 italic">无选项</div>
                    ) : (
                        options.map((option) => (
                            <div
                                key={String(option.value)}
                                className={cn(
                                    "relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50 transition-colors",
                                    value.includes(option.value) ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700"
                                )}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span className="block truncate">{option.label}</span>
                                {value.includes(option.value) && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                        <Check className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
