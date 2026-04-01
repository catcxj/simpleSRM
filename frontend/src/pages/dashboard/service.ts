import api from '@/lib/api';

export interface DashboardFilter {
    year?: number;
    businessType?: string;
    grade?: string;
}

export const getDashboardData = async (filter: DashboardFilter) => {
    const params = new URLSearchParams();
    if (filter.year) params.append('year', filter.year.toString());
    if (filter.businessType && filter.businessType !== 'all') params.append('businessType', filter.businessType);
    if (filter.grade && filter.grade !== 'all') params.append('grade', filter.grade);

    return api.get<any>(`/analytics/dashboard?${params.toString()}`);
};
