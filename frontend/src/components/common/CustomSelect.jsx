import React, { useState, useRef, useEffect } from "react";
import "../../styles/customSelect.scss";

/**
 * Custom Select Dropdown Component
 * @param {Array} options - Array of option objects with label and value
 * @param {String} value - Current selected value
 * @param {Function} onChange - Callback function when option is selected
 * @param {String} placeholder - Placeholder text
 */
const CustomSelect = ({ options, value, onChange, placeholder = "Select an option" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(placeholder);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const selected = options.find(opt => opt.value === value);
    if (selected) {
      setSelectedLabel(selected.label);
    } else {
      setSelectedLabel(placeholder);
    }
  }, [value, options, placeholder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      <div
        className="custom-select-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="custom-select-label">{selectedLabel}</span>
        <svg
          className={`custom-select-arrow ${isOpen ? "open" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="custom-select-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-select-option ${
                value === option.value ? "selected" : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {value === option.value && (
                <svg
                  className="checkmark"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
