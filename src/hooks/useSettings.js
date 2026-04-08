import { useState, useEffect } from 'react';

function getSavedValue(key, initialValue) {
  const savedValue = localStorage.getItem(key);
  if (savedValue !== null) return savedValue;
  return initialValue;
}

export function useSettings() {
  const [language, setLanguage] = useState(() => getSavedValue('language', 'ar'));
  const [clockMode, setClockMode] = useState(() => getSavedValue('clockType', 'analog'));
  const [calculationMethod, setCalculationMethod] = useState(() => parseInt(getSavedValue('calculationMethod', '21')));

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('clockType', clockMode);
  }, [clockMode]);

  useEffect(() => {
    localStorage.setItem('calculationMethod', calculationMethod.toString());
  }, [calculationMethod]);

  return {
    language, setLanguage,
    clockMode, setClockMode,
    calculationMethod, setCalculationMethod
  };
}
