import api from '@/lib/api';

export interface Project {
    id: string;
    code: string;
    name: string;
    projectManager?: string;
    status: "Active" | "Completed" | "Suspended";
    createdAt: string;
    updatedAt: string;
    _count?: {
        contracts: number;
    };
}

export interface CreateProjectDto {
    code: string;
    name: string;
    projectManager?: string;
    status?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> { }

const API_URL = "/projects";

export const getProjects = async (params?: any) => {
    const response = await api.get(API_URL, { params });
    return response.data;
};

export const createProject = async (data: CreateProjectDto) => {
    const response = await api.post(API_URL, data);
    return response.data;
};

export const updateProject = async ({ id, data }: { id: string; data: UpdateProjectDto }) => {
    const response = await api.patch(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteProject = async (id: string) => {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
};

export const getProjectContracts = async (projectId: string) => {
    const response = await api.get(`/contracts/project/${projectId}`);
    return response.data;
};
