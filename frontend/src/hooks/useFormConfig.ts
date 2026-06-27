import { useState, useEffect } from 'react';
import { formConfigApi, type FormFieldConfig } from '../services/formConfigApi';

const configCache: Record<string, FormFieldConfig[]> = {};

export function useFormConfig(formKey: string) {
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (configCache[formKey]) {
      setFields(configCache[formKey]);
      setLoading(false);
      return;
    }

    formConfigApi
      .getConfig(formKey)
      .then((data) => {
        if (!cancelled) {
          const visibleFields = data.filter((f) => f.visible).sort((a, b) => a.sortOrder - b.sortOrder);
          configCache[formKey] = visibleFields;
          setFields(visibleFields);
        }
      })
      .catch(() => {
        if (!cancelled) setFields([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formKey]);

  return { fields, loading };
}

export function clearFormConfigCache(formKey?: string) {
  if (formKey) {
    delete configCache[formKey];
  } else {
    Object.keys(configCache).forEach((key) => delete configCache[key]);
  }
}
