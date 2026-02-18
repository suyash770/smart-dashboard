import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';

export default function CreatableSelect({ options = [], value, onChange, placeholder = "Select or create..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // If the search term is exactly the same as the selected value, 
    // it implies the user hasn't started searching yes, so show all options.
    // Otherwise, filter based on search term.
    const showAll = isOpen && value && searchTerm.toLowerCase() === value.toLowerCase();

    // Filter options based on search term
    const filteredOptions = showAll ? options : options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Check if the exact search term exists in options
    const exactMatch = options.some(opt =>
        opt.toLowerCase() === searchTerm.toLowerCase()
    );

    useEffect(() => {
        // Sync search term with value when value changes externally (e.g. form reset)
        if (value && !isOpen) {
            setSearchTerm(value);
        } else if (!value && !isOpen) {
            setSearchTerm('');
        }
    }, [value, isOpen]);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // If closing and no value selected, revert search term to current value
                if (value) setSearchTerm(value);
                else setSearchTerm('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value]);

    const handleSelect = (option) => {
        onChange(option);
        setSearchTerm(option);
        setIsOpen(false);
    };

    const handleCreate = () => {
        if (searchTerm.trim()) {
            onChange(searchTerm.trim());
            setIsOpen(false);
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
        setIsOpen(true); // Keep open to show options
        // Focus input
        const input = wrapperRef.current?.querySelector('input');
        if (input) input.focus();
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className="relative cursor-text"
                onClick={() => setIsOpen(true)}
            >
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={(e) => e.target.select()} // Auto-select text on focus
                    placeholder={placeholder}
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-4 pr-10 py-2.5
                    text-sm text-white placeholder-slate-600
                    focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30
                    transition-all duration-200"
                />

                {value ? (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                        <Plus className="w-4 h-4 rotate-45" /> {/* X icon using Plus rotated */}
                    </button>
                ) : (
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group
                                ${option === value ? 'bg-indigo-600/10 text-indigo-400' : 'text-slate-300 hover:bg-dark-700 hover:text-white'}`}
                            >
                                <span>{option}</span>
                                {option === value && <Check className="w-3.5 h-3.5" />}
                            </button>
                        ))
                    ) : null}

                    {searchTerm && !exactMatch && (
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="w-full text-left px-4 py-2.5 text-sm text-indigo-400 hover:bg-indigo-600/10 transition-colors flex items-center gap-2 border-t border-dark-600"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create "{searchTerm}"</span>
                        </button>
                    )}

                    {filteredOptions.length === 0 && !searchTerm && (
                        <div className="px-4 py-3 text-xs text-slate-500 text-center">
                            Start typing to search or create...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
