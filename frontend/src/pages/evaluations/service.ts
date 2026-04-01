import api from '@/lib/api';
import { EvaluationTask, EvaluationSubmission } from './schema';

export const getTemplates = async () => {
    return api.get<any[]>('/evaluations/templates');
};

export const createTemplate = async (data: any) => {
    return api.post('/evaluations/templates', data);
};

export const updateTemplate = async (id: string, data: any) => {
    return api.put(`/evaluations/templates/${id}`, data);
};

export const deleteTemplate = async (id: string) => {
    return api.delete(`/evaluations/templates/${id}`);
};

export const createEvaluationTask = async (data: any) => {
    return api.post('/evaluations/tasks', data);
};

export const getEvaluationTasks = async (params?: any) => {
    return api.get<{ data: EvaluationTask[], total: number }>('/evaluations/tasks', { params });
};

export const getEvaluationRecords = async (params?: any) => {
    return api.get<any[]>('/evaluations/records', { params });
};

export const submitEvaluation = async (data: EvaluationSubmission) => {
    return api.post('/evaluations/submit', data);
};

export const getIndicators = async () => {
    return api.get<any[]>('/evaluations/indicators');
}

export const getEvaluationRecord = async (id: string) => {
    return api.get<any>(`/evaluations/records/${id}`);
};

export const getSupplierHistory = async (supplierId: string) => {
    return api.get<any[]>(`/evaluations/history/${supplierId}`);
};
