import React, { forwardRef, useEffect, useMemo, useState } from 'react';

const DEBOUNCE_MS = 350;

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
  input: { width: '100%', minHeight: '84px', padding: '8px' },
  helper: { fontSize: '12px', color: '#666' },
  error: { fontSize: '12px', color: '#d02b20' },
  list: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    maxHeight: '220px',
    overflowY: 'auto',
    background: '#fff',
  },
  item: {
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    padding: '8px 10px',
    cursor: 'pointer',
  },
};

function getCurrentToken(value) {
  const parts = String(value || '').split(',');
  return parts[parts.length - 1].trim();
}

function replaceCurrentToken(value, replacement) {
  const parts = String(value || '').split(',');
  parts[parts.length - 1] = ` ${replacement}`;

  return parts
    .join(',')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .join(',');
}

const CreditCardSlugsInput = forwardRef(
  ({ name, value, onChange, required, disabled, attribute, error }, ref) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeToken, setActiveToken] = useState('');

    const inputValue = useMemo(() => String(value || ''), [value]);

    useEffect(() => {
      const token = getCurrentToken(inputValue);
      setActiveToken(token);

      if (!token || token.length < 2) {
        setSuggestions([]);
        return undefined;
      }

      const timer = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/credit-cards/external/search?q=${encodeURIComponent(token)}`,
            { method: 'GET', credentials: 'include' }
          );
          const payload = await response.json();
          setSuggestions(Array.isArray(payload?.data) ? payload.data : []);
        } catch (fetchError) {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, DEBOUNCE_MS);

      return () => clearTimeout(timer);
    }, [inputValue]);

    const handleChange = (nextValue) => {
      onChange({
        target: {
          name,
          type: attribute?.type || 'text',
          value: nextValue,
        },
      });
    };

    const handleSelect = (slug) => {
      handleChange(replaceCurrentToken(inputValue, slug));
      setSuggestions([]);
    };

    return (
      <div style={styles.wrapper}>
        <textarea
          ref={ref}
          name={name}
          required={required}
          disabled={disabled}
          value={inputValue}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="Enter comma-separated slugs, e.g. card-a,card-b"
          style={styles.input}
        />
        <div style={styles.helper}>
          Type at least 2 characters after the last comma to see suggestions.
        </div>
        {loading ? <div style={styles.helper}>Searching suggestions...</div> : null}
        {!loading && activeToken.length >= 2 && suggestions.length > 0 ? (
          <div style={styles.list}>
            {suggestions.map((item) => (
              <button
                key={item.value}
                type="button"
                style={styles.item}
                onClick={() => handleSelect(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {error ? <div style={styles.error}>{error}</div> : null}
      </div>
    );
  }
);

export default CreditCardSlugsInput;
