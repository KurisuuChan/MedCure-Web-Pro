import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

const Combobox = ({
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
  className = "",
  disabled = false,
  renderOption = null,
  filterFn = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    
    if (filterFn) {
      return options.filter(option => filterFn(option, searchTerm));
    }
    
    return options.filter(option => {
      const searchText = searchTerm.toLowerCase();
      return (
        option.label?.toLowerCase().includes(searchText) ||
        option.name?.toLowerCase().includes(searchText) ||
        option.brand?.toLowerCase().includes(searchText) ||
        option.category?.toLowerCase().includes(searchText)
      );
    });
  }, [options, searchTerm, filterFn]);

  // Get selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[focusedIndex]);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  // Handle option selection
  const handleSelectOption = (option) => {
    onValueChange(option.value, option);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle input click
  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setFocusedIndex(-1);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex];
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [focusedIndex]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={inputRef}
        type="button"
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-3 
          text-left bg-white/95 backdrop-blur-sm 
          border border-white/20 rounded-lg 
          focus:ring-2 focus:ring-white/50 focus:border-white/50 
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-white transition-colors
          ${isOpen ? 'ring-2 ring-white/50 border-white/50' : ''}
        `}
      >
        <div className="flex items-center min-w-0 flex-1">
          <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
          <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOption ? (selectedOption.label || selectedOption.name) : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div 
            ref={listRef}
            className="max-h-60 overflow-y-auto"
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = index === focusedIndex;
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 
                      border-b border-gray-50 last:border-0
                      flex items-center justify-between
                      ${isFocused ? 'bg-blue-50' : ''}
                      ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="min-w-0 flex-1">
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <div>
                          <div className="font-medium">
                            {option.label || option.name}
                          </div>
                          {(option.brand || option.category || option.stock_in_pieces !== undefined) && (
                            <div className="text-sm text-gray-500 mt-1">
                              {[
                                option.brand,
                                option.category,
                                option.stock_in_pieces !== undefined ? `Stock: ${option.stock_in_pieces}` : null
                              ].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Combobox;