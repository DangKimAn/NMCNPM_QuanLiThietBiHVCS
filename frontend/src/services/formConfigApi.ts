const API_BASE_URL = 'http://localhost:3000/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options?.headers as Record<string, string>),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface FormFieldConfig {
  formConfigId: number;
  formKey: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  required: boolean;
  visible: boolean;
  sortOrder: number;
  options: string | null;
  placeholder: string | null;
}

export const formConfigApi = {
  async getConfig(formKey: string): Promise<FormFieldConfig[]> {
    return request<FormFieldConfig[]>(`${API_BASE_URL}/form-config/${formKey}`);
  },

  async getAllForms(): Promise<string[]> {
    return request<string[]>(`${API_BASE_URL}/form-config`);
  },

  async updateConfig(
    formKey: string,
    fields: { fieldKey: string; label: string; fieldType: string; required: boolean; visible: boolean; sortOrder: number; options?: string | null; placeholder?: string | null }[],
  ): Promise<FormFieldConfig[]> {
    return request<FormFieldConfig[]>(`${API_BASE_URL}/form-config/${formKey}`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    });
  },

  async deleteField(formKey: string, fieldKey: string): Promise<FormFieldConfig[]> {
    return request<FormFieldConfig[]>(`${API_BASE_URL}/form-config/${formKey}/${fieldKey}`, {
      method: 'DELETE',
    });
  },
};
