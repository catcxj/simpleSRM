import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData, DashboardFilter } from './service';
import { getSuppliers } from '../suppliers/service';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Users, CheckCircle, TrendingUp, Filter, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

export default function DashboardPage() {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    // Generate an array of years, e.g., current year and past 4 years
    const yearsInfo = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const [filters, setFilters] = useState<DashboardFilter>({
        year: currentYear,
        businessType: 'all',
        grade: 'all',
    });

    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', filters],
        queryFn: () => getDashboardData(filters),
    });

    const { data: configData } = useQuery({
        queryKey: ['system-config', 'SupplierAttribute'],
        queryFn: async () => {
            const res = await fetch('/api/system-config?category=SupplierAttribute', {
                headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
            });
            const json = await res.json();
            return Array.isArray(json) ? json : (json?.data || []);
        }
    });

    const businessTypeConfigs = configData?.filter((c: any) => c.key === 'BusinessType') || [];

    const { data: topSuppliers } = useQuery({
        queryKey: ['top-suppliers', filters.businessType],
        queryFn: () => getSuppliers({
            limit: 3,
            sortBy: 'averageScore',
            sortOrder: 'desc',
            status: 'Active' as any,
            ...(filters.businessType !== 'all' && { businessType: filters.businessType })
        })
    });

    const stats = (data as any)?.data?.overview || { totalResources: 0, newThisYear: 0, avgScore: 0, growthRate: 0 };
    const quality = (data as any)?.data?.quality || { high: 0, low: 0 };
    const distributions = (data as any)?.data?.distributions || { grade: {}, status: [], businessType: [], scoreRange: {} };
    const qualityTrend = (data as any)?.data?.qualityTrend || [];
    const trend = (data as any)?.data?.trend || [];

    const combinedTrendData = trend.map((t: any, i: number) => ({
        name: t.name,
        newSuppliers: t.value,
        avgScore: qualityTrend[i]?.value || 0
    }));

    // Transform for Recharts
    const gradeData = Object.entries(distributions.grade || {}).map(([key, value]) => ({
        name: key,
        value
    }));

    const statusData = (distributions.status || []).map((item: any) => ({
        name: t(`common.status.${item.status}`, { defaultValue: item.status }),
        value: item._count.status
    }));

    const scoreRangeData = Object.entries(distributions.scoreRange || {}).map(([key, value]) => ({
        name: key,
        value
    }));



    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold tracking-tight">{t('app.dashboard')}</h2>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-2 bg-card p-2 rounded-md border shadow-sm">
                    <Filter className="h-4 w-4 text-muted-foreground ml-2" />
                    <Select value={filters.year?.toString()} onValueChange={(v) => setFilters({ ...filters, year: parseInt(v) })}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder={t('evaluations.fields.year', 'Year')} />
                        </SelectTrigger>
                        <SelectContent>
                            {yearsInfo.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y} {t('evaluations.fields.year_suffix', '')}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.businessType} onValueChange={(v) => setFilters({ ...filters, businessType: v })}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder={t('suppliers.fields.business_type', 'Business Type')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.actions.all_types', 'All Types')}</SelectItem>
                            {businessTypeConfigs.length > 0 ? (
                                businessTypeConfigs.map((c: any) => (
                                    <SelectItem key={c.id} value={c.value}>{c.value}</SelectItem>
                                ))
                            ) : (
                                ['Construction', 'Material', 'Equipment', 'Service', 'Other'].map(type => (
                                    <SelectItem key={type} value={type}>{t(`common.business_types.${type}`, type)}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>

                    <Select value={filters.grade} onValueChange={(v) => setFilters({ ...filters, grade: v })}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder={t('dashboard.score_range', 'Score Range')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.actions.all_ranges', 'All Ranges')}</SelectItem>
                            <SelectItem value="90-100">90-100</SelectItem>
                            <SelectItem value="80-89">80-89</SelectItem>
                            <SelectItem value="70-79">70-79</SelectItem>
                            <SelectItem value="60-69">60-69</SelectItem>
                            <SelectItem value="<60">{'<'} 60</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Metrics Layout */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.total_suppliers')}</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalResources}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className={stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {stats.growthRate > 0 ? '+' : ''}{stats.growthRate}%
                            </span> {t('dashboard.from_last_year', '较去年同期')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.excellent_suppliers')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "-" : quality.high}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.grade_recommended')}
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.new_suppliers')}</CardTitle>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "-" : stats.newThisMonth}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.added_this_year', { count: stats.newThisYear })}
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.avg_score')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? "-" : stats.avgScore}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.overall_performance', '系统整体表现')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>{t('dashboard.monthly_addition_trend', '月度入库趋势与质量评估')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={combinedTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" name={t('dashboard.new_suppliers', 'New Suppliers')} dataKey="newSuppliers" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} />
                                    <Line yAxisId="right" type="step" name={t('dashboard.avg_score', 'Avg Score')} dataKey="avgScore" stroke="#ffc658" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">{t('dashboard.top_suppliers', 'Top 3 Suppliers')}</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px] text-center">{t('dashboard.rank', 'Rank')}</TableHead>
                                    <TableHead className="w-[80px]">{t('evaluations.fields.score', 'Score')}</TableHead>
                                    <TableHead>{t('suppliers.fields.name', 'Supplier Name')}</TableHead>
                                    <TableHead className="max-w-[150px]">{t('dashboard.projects', 'Projects')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(topSuppliers as any)?.data && (topSuppliers as any).data.length > 0 ? (topSuppliers as any).data.map((supplier: any, index: number) => {
                                    const projects = Array.from(new Set(supplier.contracts?.map((c: any) => c.project?.name).filter(Boolean)));
                                    const projectsStr = projects.join(', ');
                                    return (
                                        <TableRow key={supplier.id}>
                                            <TableCell className="font-medium text-center text-lg">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                            </TableCell>
                                            <TableCell className="font-semibold text-primary">{supplier.averageScore ?? 66}</TableCell>
                                            <TableCell className="truncate max-w-[120px]" title={supplier.name}>
                                                {supplier.name}
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate" title={projectsStr || '-'}>
                                                {projectsStr || '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.actions.no_data')}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">


                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>{t('dashboard.score_range_distribution', 'Score Range Distribution')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={scoreRangeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="value" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>{t('dashboard.grade_distribution', 'Grade Distribution')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={gradeData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {gradeData.map((entry: any, index: number) => {
                                            const colors = { 推荐: '#4ade80', 审慎: '#fbbf24', 不推荐: '#f87171' };
                                            return <Cell key={`cell-${index}`} fill={(colors as any)[entry.name] || COLORS[index % COLORS.length]} />;
                                        })}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle>{t('dashboard.status_distribution', 'Status Distribution')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {statusData.map((_entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
