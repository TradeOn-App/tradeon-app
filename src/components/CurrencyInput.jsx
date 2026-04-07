import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';

function toDisplay(raw) {
  if (raw === '' || raw === null || raw === undefined) return '';
  const num = Number(raw);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toRaw(display) {
  if (!display) return '';
  const cleaned = display.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? '' : String(num);
}

export default function CurrencyInput({ value, onChange, prefix = 'R$', ...props }) {
  const [display, setDisplay] = useState(() => toDisplay(value));

  useEffect(() => {
    const currentRaw = toRaw(display);
    if (String(value) !== currentRaw) {
      setDisplay(toDisplay(value));
    }
  }, [value]);

  const handleChange = (e) => {
    let input = e.target.value;

    // Remove tudo exceto dígitos e vírgula
    input = input.replace(/[^\d,]/g, '');

    // Garante apenas uma vírgula
    const parts = input.split(',');
    if (parts.length > 2) {
      input = parts[0] + ',' + parts.slice(1).join('');
    }

    // Limita casas decimais a 2
    if (parts.length === 2 && parts[1].length > 2) {
      input = parts[0] + ',' + parts[1].substring(0, 2);
    }

    setDisplay(input);

    const raw = toRaw(input);
    onChange(raw);
  };

  const handleBlur = () => {
    const raw = toRaw(display);
    if (raw) {
      setDisplay(toDisplay(raw));
    }
  };

  return (
    <div className="currency-input-wrapper">
      {prefix && <span className="currency-input-prefix">{prefix}</span>}
      <Form.Control
        {...props}
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        style={{ paddingLeft: prefix ? '2.2rem' : undefined, ...props.style }}
      />
    </div>
  );
}
