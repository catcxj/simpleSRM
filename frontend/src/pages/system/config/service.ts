import api from '@/lib/api';

export interface AttributeDefinition {
    id: string;
    category: string;
    name: string;
    code: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
    options?: string; // JSON string or comma-separated? Backend expect string.
    required: boolean;
    isActive: boolean;
}

export const getAttributes = async (targetEntity?: string) => {
    return api.get<AttributeDefinition[]>('/system-config/attributes', { params: { targetEntity } });
};

export const createAttribute = async (data: Omit<AttributeDefinition, 'id'>) => {
    return api.post('/system-config/attributes', data);
};

export const updateAttribute = async (id: string, data: Partial<AttributeDefinition>) => {
    return api.patch(`/system-config/attributes/${id}`, data);
}; // Backend might not have PATCH implemented yet, need to check.

export const deleteAttribute = async (id: string) => {
    return api.delete(`/system-config/attributes/${id}`);
};

export interface SystemConfig {
    id: string;
    category: string;
    key: string;
    value: string;
    description?: string;
    isActive: boolean;
}

export const getSystemConfigs = async (category?: string) => {
    return api.get<SystemConfig[]>('/system-config', { params: { category } });
};

export const createSystemConfig = async (data: Omit<SystemConfig, 'id' | 'isActive'>) => {
    return api.post('/system-config', data);
};

export const updateSystemConfig = async (id: string, data: Partial<SystemConfig>) => {
    return api.patch(`/system-config/${id}`, data);
};

export const deleteSystemConfig = async (id: string) => {
    return api.delete(`/system-config/${id}`);
};
