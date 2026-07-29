import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { FiChevronDown, FiSearch, FiX, FiPlus, FiLoader } from 'react-icons/fi';
import { useDebounce } from '../../../hooks/useDebounce';
import './styles.css';

type OptionItem = any;

interface SyntheticChangeEvent {
  target: {
    name: string;
    value: string;
  };
  option?: OptionItem;
}

interface SearchResult {
  data: OptionItem[];
  error: Error | null;
}

interface AsyncSearchableSelectProps {
  id?: string;
  name: string;
  value: string;
  onChange: (event: SyntheticChangeEvent) => void;
  searchFn?: (searchTerm: string, limit: number) => Promise<SearchResult>;
  initialOptions?: OptionItem[];
  minSearchLength?: number;
  debounceMs?: number;
  searchLimit?: number;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  renderOption?: (opt: OptionItem) => React.ReactNode;
  getOptionLabel?: (opt: OptionItem) => string;
  getOptionValue?: (opt: OptionItem) => string;
  onCreateNew?: () => void;
  createNewLabel?: string;
  selectedOption?: OptionItem;
}

export default function AsyncSearchableSelect({
  id,
  name,
  value,
  onChange,
  searchFn,
  initialOptions = [],
  minSearchLength = 0,
  debounceMs = 300,
  searchLimit = 20,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  renderOption,
  getOptionLabel = (opt) => opt.label || opt.name || String(opt),
  getOptionValue = (opt) => opt.value || opt.id || opt,
  onCreateNew,
  createNewLabel = 'Create new...',
  selectedOption: selectedOptionProp,
}: AsyncSearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<OptionItem[]>(initialOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<OptionItem | null>(selectedOptionProp || null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce the search query
  const debouncedSearch = useDebounce(search, debounceMs);

  // Update selected option when prop changes
  useEffect(() => {
    if (selectedOptionProp) {
      setSelectedOption(selectedOptionProp);
    }
  }, [selectedOptionProp]);

  // Find display value
  const displayValue = selectedOption ? getOptionLabel(selectedOption) : '';

  // Fetch options when search changes
  const fetchOptions = useCallback(async (searchTerm: string) => {
    if (!searchFn) return;

    if (searchTerm.length < minSearchLength && searchTerm.length > 0) {
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await searchFn(searchTerm, searchLimit);

    if (fetchError) {
      setError('Failed to load options');
      setOptions([]);
    } else {
      setOptions(data || []);
    }

    setLoading(false);
  }, [searchFn, minSearchLength, searchLimit]);

  // Fetch on debounced search change
  useEffect(() => {
    if (isOpen) {
      fetchOptions(debouncedSearch);
    }
  }, [debouncedSearch, isOpen, fetchOptions]);

  // Load initial options when dropdown opens
  useEffect(() => {
    if (isOpen && options.length === 0 && !loading) {
      fetchOptions('');
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear cached options when dropdown closes to ensure fresh data on reopen
  // This is important for quick-create scenarios where new items are added
  useEffect(() => {
    if (!isOpen) {
      setOptions([]);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (opt: OptionItem) => {
    setSelectedOption(opt);
    onChange({
      target: {
        name,
        value: getOptionValue(opt),
      },
      // Include full option data for auto-populate logic
      option: opt
    });
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onChange({
      target: {
        name,
        value: '',
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    setSearch('');
    onCreateNew?.();
  };

  return (
    <div
      ref={containerRef}
      className={`async-searchable-select ${isOpen ? 'async-searchable-select--open' : ''} ${disabled ? 'async-searchable-select--disabled' : ''} ${className}`}
    >
      {/* Hidden input for form data */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value || ''}
      />

      {/* Trigger Button */}
      <button
        type="button"
        className="async-searchable-select__trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`async-searchable-select__value ${!displayValue ? 'async-searchable-select__value--placeholder' : ''}`}>
          {displayValue || placeholder}
        </span>
        <div className="async-searchable-select__icons">
          {value && !disabled && (
            <span
              className="async-searchable-select__clear"
              onClick={handleClear}
              role="button"
              aria-label="Clear selection"
            >
              <FiX size={16} />
            </span>
          )}
          <FiChevronDown
            size={18}
            className={`async-searchable-select__chevron ${isOpen ? 'async-searchable-select__chevron--open' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="async-searchable-select__dropdown" onKeyDown={handleKeyDown}>
          {/* Search Input */}
          <div className="async-searchable-select__search">
            <FiSearch size={16} className="async-searchable-select__search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="async-searchable-select__search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loading && (
              <FiLoader size={16} className="async-searchable-select__loading-icon" />
            )}
          </div>

          {/* Options List */}
          <ul className="async-searchable-select__options" role="listbox">
            {/* Create New Option - Sticky at top */}
            {onCreateNew && (
              <li
                className="async-searchable-select__create-option"
                onClick={handleCreateNew}
                role="option"
              >
                <FiPlus size={16} />
                <span>{createNewLabel}</span>
              </li>
            )}

            {error ? (
              <li className="async-searchable-select__error">
                {error}
              </li>
            ) : loading && options.length === 0 ? (
              <li className="async-searchable-select__loading">
                Loading...
              </li>
            ) : options.length === 0 ? (
              <li className="async-searchable-select__no-results">
                No results found
              </li>
            ) : (
              options.map((opt, index) => {
                const optValue = getOptionValue(opt);
                const isSelected = optValue === value;

                return (
                  <li
                    key={optValue || index}
                    className={`async-searchable-select__option ${isSelected ? 'async-searchable-select__option--selected' : ''}`}
                    onClick={() => handleSelect(opt)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {renderOption ? renderOption(opt) : getOptionLabel(opt)}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
