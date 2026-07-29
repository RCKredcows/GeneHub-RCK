import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch, FiX, FiPlus } from 'react-icons/fi';
import './styles.css';

type OptionItem = any;

interface SyntheticChangeEvent {
  target: {
    name: string;
    value: string;
  };
}

interface SearchableSelectProps {
  id?: string;
  name: string;
  value: string;
  onChange: (event: SyntheticChangeEvent) => void;
  options?: OptionItem[];
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
}

export default function SearchableSelect({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  renderOption,
  getOptionLabel = (opt) => opt.label || opt.name || String(opt),
  getOptionValue = (opt) => opt.value || opt.id || opt,
  onCreateNew,
  createNewLabel = 'Create new...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find the selected option
  const selectedOption = options.find(opt => getOptionValue(opt) === value);
  const displayValue = selectedOption ? getOptionLabel(selectedOption) : '';

  // Filter options based on search
  const filteredOptions = options.filter(opt => {
    const label = getOptionLabel(opt).toLowerCase();
    return label.includes(search.toLowerCase());
  });

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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (opt: OptionItem) => {
    onChange({
      target: {
        name,
        value: getOptionValue(opt),
      }
    });
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      className={`searchable-select ${isOpen ? 'searchable-select--open' : ''} ${disabled ? 'searchable-select--disabled' : ''} ${className}`}
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
        className="searchable-select__trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`searchable-select__value ${!displayValue ? 'searchable-select__value--placeholder' : ''}`}>
          {displayValue || placeholder}
        </span>
        <div className="searchable-select__icons">
          {value && !disabled && (
            <span
              className="searchable-select__clear"
              onClick={handleClear}
              role="button"
              aria-label="Clear selection"
            >
              <FiX size={16} />
            </span>
          )}
          <FiChevronDown
            size={18}
            className={`searchable-select__chevron ${isOpen ? 'searchable-select__chevron--open' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="searchable-select__dropdown" onKeyDown={handleKeyDown}>
          {/* Search Input */}
          <div className="searchable-select__search">
            <FiSearch size={16} className="searchable-select__search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select__search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Options List */}
          <ul className="searchable-select__options" role="listbox">
            {/* Create New Option - Sticky at top */}
            {onCreateNew && (
              <li
                className="searchable-select__create-option"
                onClick={handleCreateNew}
                role="option"
              >
                <FiPlus size={16} />
                <span>{createNewLabel}</span>
              </li>
            )}

            {filteredOptions.length === 0 ? (
              <li className="searchable-select__no-results">
                No results found
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const optValue = getOptionValue(opt);
                const isSelected = optValue === value;

                return (
                  <li
                    key={optValue || index}
                    className={`searchable-select__option ${isSelected ? 'searchable-select__option--selected' : ''}`}
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
