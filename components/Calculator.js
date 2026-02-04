
import React, { useState } from 'react';

const Calculator = ({ onTrigger }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [nineCount, setNineCount] = useState(0);

  const handleNumber = (num) => {
    if (num === '9') {
      const nextCount = nineCount + 1;
      setNineCount(nextCount);
      if (nextCount === 5) {
        onTrigger();
        return;
      }
    } else {
      setNineCount(0);
    }
    setDisplay(prev => (prev === '0' ? num : prev + num));
  };

  const handleOperator = (op) => {
    setNineCount(0);
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    setNineCount(0);
    try {
      const result = eval(equation + display);
      setDisplay(String(result));
      setEquation('');
    } catch {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setNineCount(0);
    setDisplay('0');
    setEquation('');
  };

  const buttons = [
    { label: 'C', action: clear, type: 'special' },
    { label: '±', action: () => {}, type: 'special' },
    { label: '%', action: () => {}, type: 'special' },
    { label: '÷', action: () => handleOperator('/'), type: 'operator' },
    { label: '7', action: () => handleNumber('7'), type: 'number' },
    { label: '8', action: () => handleNumber('8'), type: 'number' },
    { label: '9', action: () => handleNumber('9'), type: 'number' },
    { label: '×', action: () => handleOperator('*'), type: 'operator' },
    { label: '4', action: () => handleNumber('4'), type: 'number' },
    { label: '5', action: () => handleNumber('5'), type: 'number' },
    { label: '6', action: () => handleNumber('6'), type: 'number' },
    { label: '−', action: () => handleOperator('-'), type: 'operator' },
    { label: '1', action: () => handleNumber('1'), type: 'number' },
    { label: '2', action: () => handleNumber('2'), type: 'number' },
    { label: '3', action: () => handleNumber('3'), type: 'number' },
    { label: '+', action: () => handleOperator('+'), type: 'operator' },
    { label: '0', action: () => handleNumber('0'), type: 'number', wide: true },
    { label: '.', action: () => handleNumber('.'), type: 'number' },
    { label: '=', action: calculate, type: 'operator' },
  ];

  return (
    <div className="glass rounded-3xl p-6 shadow-2xl border border-slate-700/50">
      <div className="text-right mb-6 px-2">
        <div className="text-slate-500 text-sm h-6 mono overflow-hidden whitespace-nowrap">{equation}</div>
        <div className="text-5xl font-light mono text-white truncate">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`h-16 rounded-2xl flex items-center justify-center text-xl font-medium transition-all active:scale-95 active:brightness-110 ${btn.wide ? 'col-span-2' : ''} ${btn.type === 'number' ? 'bg-slate-800 text-white hover:bg-slate-700' : ''} ${btn.type === 'operator' ? 'bg-orange-500 text-white hover:bg-orange-400' : ''} ${btn.type === 'special' ? 'bg-slate-400/20 text-slate-300 hover:bg-slate-400/30' : ''}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calculator;
