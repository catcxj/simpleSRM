import api from '@/lib/api';

export interface Contract {
    id: string;
    code: string;
    name: string;
    amount?: number | null;
    signedAt?: string | null;
    projectId: string;
    supplierId: string;
    project?: { name: string; code: string };
    supplier?: { name: string };
}

export interface CreateContractDto {
    code?: string;
    name: string;
    amount?: number | null;
    signedAt?: string | null;
    projectId: string;
    supplierId: string;
}

export interface UpdateContractDto extends Partial<CreateContractDto> { }

const API_URL = "/contracts";

export const getContracts = async () => {
    const response = await api.get(API_URL);
    return response.data;
};

export const createContract = async (data: CreateContractDto) => {
    const response = await api.post(API_URL, data);
    return response.data;
};

export const updateContract = async ({ id, data }: { id: string; data: UpdateContractDto }) => {
    const response = await api.patch(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteContract = async (id: string) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
};
