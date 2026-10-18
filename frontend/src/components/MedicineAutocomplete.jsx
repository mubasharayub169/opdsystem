import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { Pill, Search, X, Loader2 } from 'lucide-react';

export default function MedicineAutocomplete({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text);
    console.log("⌨️ Typing:", text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length >= 1) {
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          console.log("📡 Calling API for:", text);
          const { data } = await api.get(`/doctor/medicines/search?q=${text}`);
          console.log("✅ API Response:", data);
          
          if (data.medicines && data.medicines.length > 0) {
            setSuggestions(data.medicines);
            setIsOpen(true);
            setHighlightedIndex(-1);
          } else {
            setSuggestions([]);
            setIsOpen(false);
          }
        } catch (err) {
          console.error("❌ API Error:", err);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (med) => {
    setQuery(med.name);
    onChange(med.name);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex]);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Pill className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isOpen ? 'text-medical-600' : 'text-slate-400'}`} />
        
        <input
          ref={inputRef}
          type="text"
          className={`w-full pl-9 pr-10 py-2.5 bg-white border rounded-lg transition-all text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/20 ${
            isOpen 
              ? 'border-medical-500 shadow-[0_0_0_3px_rgba(37,99,235,0.1)]' 
              : 'border-slate-200 hover:border-slate-300'
          }`}
          placeholder={placeholder || "Type medicine name..."}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <Loader2 className="w-4 h-4 text-medical-500 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => { setQuery(''); onChange(''); setSuggestions([]); setIsOpen(false); inputRef.current?.focus(); }}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-4 h-4 text-slate-300" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[9999] w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medicine Database</span>
            <span className="text-[10px] font-medium text-slate-400">{suggestions.length} results</span>
          </div>

          <ul className="max-h-60 overflow-y-auto py-1">
            {suggestions.map((med, index) => {
              const isHighlighted = highlightedIndex === index;
              return (
                <li
                  key={med.id}
                  onClick={() => handleSelect(med)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-3 transition-colors ${
                    isHighlighted ? 'bg-medical-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isHighlighted ? 'bg-medical-100 text-medical-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Pill className="w-4 h-4" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{med.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {med.generic_name || 'No generic name'} 
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}