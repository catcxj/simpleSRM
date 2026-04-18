import api from '@/lib/api';

export const getSuppliers = async (params?: any) => {
    const res = await api.get<any>('/suppliers', { params });
    return res.data;
};

export const getSupplierById = async (id: string) => {
    const res = await api.get(`/suppliers/${id}`);
    return res.data;
};

export const createSupplier = async (data: any) => {
    return api.post('/suppliers', data);
};

export const updateSupplier = async (id: string, data: any) => {
    return api.patch(`/suppliers/${id}`, data);
};

export const deleteSupplier = async (id: string) => {
    return api.delete(`/suppliers/${id}`);
};

export const getSupplierEvaluationHistory = async (id: string) => {
    const res = await api.get(`/evaluations/history/${id}`);
    return res.data;
};

export const getSupplierContracts = async (id: string) => {
    const res = await api.get(`/contracts/supplier/${id}`);
    return res.data;
};

export const exportSuppliers = async (params: any) => {
    const res = await api.get('/suppliers/export', {
        params,
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res as any]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Suppliers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
