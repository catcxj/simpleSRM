import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, updateSupplier, deleteSupplier, getSupplierEvaluationHistory, exportSuppliers } from './service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MoreHorizontal, Pencil, Ban, Trash2, Import, Download, HelpCircle, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';
export default function SuppliersPage() {
    const { t } = useTranslation();
    const [filters, setFilters] = useState({
        name: '',
        businessType: 'all',
        projectId: 'all',
        status: 'all',
        grade: 'all',
        serviceRegion: '',
        contactPerson: '',
        contractCount: '',
    });
    const [page, setPage] = useState(1);
    const limit = 10;
    const [sort, setSort] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
    const [viewEvaluationsSupplierId, setViewEvaluationsSupplierId] = useState<string | null>(null);
    const [viewContractsSupplierId, setViewContractsSupplierId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const { data: projectsRes } = useQuery({
        queryKey: ["all-projects"],
        queryFn: async () => {
            const res = await api.get('/projects?limit=1000');
            return res.data;
        }
    });
    const projects = Array.isArray(projectsRes?.data) ? projectsRes.data : (Array.isArray(projectsRes) ? projectsRes : []);

    const { data: evaluationHistory, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['supplier-evaluations', viewEvaluationsSupplierId],
        queryFn: () => getSupplierEvaluationHistory(viewEvaluationsSupplierId!),
        enabled: !!viewEvaluationsSupplierId,
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

    const activeFilters = {
        ...(filters.name && { name: filters.name }),
        ...(filters.businessType !== 'all' && { businessType: filters.businessType }),
        ...(filters.projectId !== 'all' && { projectId: filters.projectId }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.grade !== 'all' && { grade: filters.grade }),
        ...(filters.serviceRegion && { serviceRegion: filters.serviceRegion }),
        ...(filters.contactPerson && { contactPerson: filters.contactPerson }),
        ...(filters.contractCount && { contractCount: Number(filters.contractCount) }),
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        page,
        limit
    };

    const { data, isLoading } = useQuery({
        queryKey: ['suppliers', activeFilters],
        queryFn: () => getSuppliers(activeFilters),
    });

    const queryClient = useQueryClient();
    const { hasPermission } = useAuthStore();

    const suspendMutation = useMutation({
        mutationFn: (id: string) => updateSupplier(id, { status: 'Suspended' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteSupplier(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast({ title: t('common.actions.deleted'), description: t('common.actions.success') });
        },
        onError: () => {
            toast({ variant: 'destructive', title: t('common.actions.error'), description: t('common.actions.delete_failed', 'Delete failed') });
        }
    });

    const exportMutation = useMutation({
        mutationFn: () => {
            const payload: any = { ...activeFilters };
            if (selectedIds.size > 0) {
                payload.ids = Array.from(selectedIds).join(',');
            }
            return exportSuppliers(payload);
        },
        onSuccess: () => {
            toast({ title: t('suppliers.export_success', 'Export successful'), description: t('suppliers.export_success_desc', 'The XLSX file is downloading.') });
        },
        onError: () => {
            toast({ variant: 'destructive', title: t('suppliers.export_error', 'Export failed'), description: t('suppliers.export_error_desc', 'There was a problem exporting the data.') });
        }
    });

    const totalPages = data ? Math.ceil((data as any).total / limit) : 1;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{t('app.suppliers_evaluation')}</h2>
                <div className="flex gap-2">
                    {hasPermission('write', 'suppliers') && (
                        <>
                            <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                                <Import className="mr-2 h-4 w-4" /> {t('suppliers.import')}
                            </Button>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".xlsx,.csv"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append('file', file);

                                    try {
                                        const token = useAuthStore.getState().token;
                                        const res = await fetch('/api/suppliers/import/file', {
                                            method: 'POST',
                                            headers: { Authorization: `Bearer ${token}` },
                                            body: formData,
                                        });
                                        if (res.ok) {
                                            const result = await res.json();
                                            alert(t('suppliers.import_success', { count: result.data.count }));
                                            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
                                        } else {
                                            alert(t('suppliers.import_failed'));
                                        }
                                    } catch (error) {
                                        console.error('Import failed', error);
                                        alert(t('suppliers.import_error'));
                                    }
                                    e.target.value = ''; // Reset input
                                }}
                            />
                            <Button asChild>
                                <Link to="/suppliers/new">
                                    <Plus className="mr-2 h-4 w-4" /> {t('suppliers.add')}
                                </Link>
                            </Button>
                        </>
                    )}
                    <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
                        <Download className="mr-2 h-4 w-4" /> {exportMutation.isPending ? t('common.actions.exporting', 'Exporting...') : selectedIds.size > 0 ? t('suppliers.export_selected', { defaultValue: `Export Selected (${selectedIds.size})`, count: selectedIds.size }) : t('suppliers.export_all', 'Export All')}
                    </Button>
                </div>
            </div>

            <div className="bg-card p-4 rounded-md border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <Input
                        placeholder={t('suppliers.fields.name', 'Name')}
                        value={filters.name}
                        onChange={(e) => { setFilters({ ...filters, name: e.target.value }); setPage(1); }}
                    />
                    <Input
                        placeholder={t('suppliers.fields.service_region', 'Service Region')}
                        value={filters.serviceRegion}
                        onChange={(e) => { setFilters({ ...filters, serviceRegion: e.target.value }); setPage(1); }}
                    />
                    <Input
                        placeholder={t('suppliers.fields.contact_person', 'Contact Person')}
                        value={filters.contactPerson}
                        onChange={(e) => { setFilters({ ...filters, contactPerson: e.target.value }); setPage(1); }}
                    />
                    <Input
                        placeholder={t('suppliers.fields.contract_count', 'Contract Count')}
                        value={filters.contractCount}
                        onChange={(e) => { setFilters({ ...filters, contractCount: e.target.value }); setPage(1); }}
                    />
                    <Select value={filters.projectId} onValueChange={(v) => { setFilters({ ...filters, projectId: v }); setPage(1); }}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('projects.title', 'Project')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.actions.all_projects', 'All Projects')}</SelectItem>
                            {projects.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.businessType} onValueChange={(v) => { setFilters({ ...filters, businessType: v }); setPage(1); }}>
                        <SelectTrigger>
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
                    <Select value={filters.status} onValueChange={(v) => { setFilters({ ...filters, status: v }); setPage(1); }}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('suppliers.fields.status', 'Status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.actions.all_statuses', 'All Statuses')}</SelectItem>
                            {['Draft', 'Active', 'Suspended', 'Blacklisted'].map(status => (
                                <SelectItem key={status} value={status}>{t(`common.status.${status}`, status)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.grade} onValueChange={(v) => { setFilters({ ...filters, grade: v }); setPage(1); }}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('evaluations.fields.grade', 'Grade')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('common.actions.all_grades', 'All Grades')}</SelectItem>
                            <SelectItem value="推荐">推荐</SelectItem>
                            <SelectItem value="审慎">审慎</SelectItem>
                            <SelectItem value="不推荐">不推荐</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={data && (data as any).data?.length > 0 && selectedIds.size === (data as any).data?.length}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            const newSet = new Set(selectedIds);
                                            (data as any)?.data?.forEach((s: any) => newSet.add(s.id));
                                            setSelectedIds(newSet);
                                        } else {
                                            const newSet = new Set(selectedIds);
                                            (data as any)?.data?.forEach((s: any) => newSet.delete(s.id));
                                            setSelectedIds(newSet);
                                        }
                                    }}
                                />
                            </TableHead>
                            <TableHead>{t('suppliers.fields.name')}</TableHead>
                            <TableHead>{t('suppliers.fields.business_type')}</TableHead>
                            <TableHead>{t('suppliers.fields.service_region')}</TableHead>
                            <TableHead>{t('suppliers.fields.contact_person')}</TableHead>
                            <TableHead>{t('suppliers.fields.status')}</TableHead>
                            <TableHead>{t('suppliers.fields.contract_count', '合同数')}</TableHead>
                            <TableHead>
                                <Button variant="ghost" className="p-0 hover:bg-transparent h-auto font-medium" onClick={() => {
                                    setSort(prev => ({
                                        sortBy: 'averageScore',
                                        sortOrder: prev.sortBy === 'averageScore' && prev.sortOrder === 'desc' ? 'asc' : 'desc'
                                    }));
                                }}>
                                    {t('evaluations.fields.score', 'Score')}
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8">{t('common.actions.loading')}</TableCell>
                            </TableRow>
                        ) : (data as any)?.data?.map((supplier: any) => {
                            const primaryContact = supplier.contacts?.[0];
                            return (
                                <TableRow key={supplier.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(supplier.id)}
                                            onCheckedChange={(checked) => {
                                                const newSet = new Set(selectedIds);
                                                if (checked) newSet.add(supplier.id);
                                                else newSet.delete(supplier.id);
                                                setSelectedIds(newSet);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div>{supplier.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            try {
                                                const types = JSON.parse(supplier.businessType);
                                                return Array.isArray(types)
                                                    ? types.map((item: string) => t(`common.business_types.${item}`, { defaultValue: item })).join(', ')
                                                    : supplier.businessType;
                                            } catch (e) {
                                                return t(`common.business_types.${supplier.businessType}`, { defaultValue: supplier.businessType }) as string;
                                            }
                                        })()}
                                    </TableCell>
                                    <TableCell>{supplier.serviceRegion || '-'}</TableCell>
                                    <TableCell>
                                        {primaryContact ? (
                                            <div className="text-sm">
                                                <div>{primaryContact.name}</div>
                                                <div className="text-xs text-muted-foreground">{primaryContact.phone}</div>
                                            </div>
                                        ) : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={supplier.status === 'Active' ? 'default' : 'secondary'}>
                                            {t(`common.status.${supplier.status}`, { defaultValue: supplier.status }) as string}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {supplier.contractCount || 0}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6" 
                                                onClick={() => setViewContractsSupplierId(supplier.id)} 
                                                title={t('suppliers.view_contracts', '查看合同')}
                                            >
                                                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {supplier.averageScore != null ? (
                                                <span className="font-semibold">{supplier.averageScore}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewEvaluationsSupplierId(supplier.id)} title={t('suppliers.view_evaluations')}>
                                                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {hasPermission('write', 'suppliers') && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t('suppliers.fields.actions')}</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link to={`/suppliers/${supplier.id}`}>
                                                            <Pencil className="mr-2 h-4 w-4" /> {t('common.actions.edit')}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => {
                                                        if (confirm(t('common.actions.confirm_suspend', 'Are you sure you want to suspend this supplier?'))) suspendMutation.mutate(supplier.id);
                                                    }}>
                                                        <Ban className="mr-2 h-4 w-4" /> {t('common.actions.suspend', 'Suspend')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => {
                                                        if (confirm(t('common.actions.confirm_delete', 'Are you sure you want to delete this supplier?'))) deleteMutation.mutate(supplier.id);
                                                    }}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> {t('common.actions.delete', 'Delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {!isLoading && (data as any)?.data?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t('common.actions.no_data')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex items-center justify-between px-4 py-4">
                    <div className="text-sm text-muted-foreground">
                        {t('common.actions.total_count', { count: (data as any)?.total || 0 })}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {t('common.actions.prev', 'Previous')}
                        </Button>
                        <div className="text-sm px-2">
                            {page} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                        >
                            {t('common.actions.next', 'Next')}
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={!!viewEvaluationsSupplierId} onOpenChange={(open) => !open && setViewEvaluationsSupplierId(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{t('suppliers.evaluation_history')}</DialogTitle>
                        <DialogDescription></DialogDescription>
                    </DialogHeader>
                    {isLoadingHistory ? (
                        <div className="py-8 text-center">{t('common.actions.loading')}</div>
                    ) : (
                        <div className="border rounded-md mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('evaluations.fields.year')}</TableHead>
                                        <TableHead>{t('evaluations.fields.evaluation', '评价')}</TableHead>
                                        <TableHead>{t('evaluations.fields.evaluator', 'Evaluator')}</TableHead>
                                        <TableHead>{t('evaluations.fields.date')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(evaluationHistory?.data || evaluationHistory)?.map((record: any) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{record.task?.year || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {record.grade || '-'}
                                                    {record.grade === '不推荐' && record.problem && (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <button className="cursor-pointer outline-none inline-flex items-center">
                                                                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-3 shadow-lg border-muted">
                                                                <div className="space-y-2">
                                                                    <p className="text-sm font-semibold border-b pb-1">{t('evaluations.fields.problem_record', '不推荐原因')}</p>
                                                                    <p className="text-xs text-muted-foreground break-all leading-relaxed">{record.problem}</p>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{record.evaluator?.name || '-'}</TableCell>
                                            <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!(evaluationHistory?.data || evaluationHistory) || (evaluationHistory?.data || evaluationHistory).length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.actions.no_data')}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewContractsSupplierId} onOpenChange={(open) => !open && setViewContractsSupplierId(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{t('suppliers.contract_list', '合同列表')}</DialogTitle>
                        <DialogDescription>{t('suppliers.contract_list_desc', '该供应商的所有历史合同')}</DialogDescription>
                    </DialogHeader>
                    {(() => {
                        const supplier = (data as any)?.data?.find((s: any) => s.id === viewContractsSupplierId);
                        const contracts = supplier?.contracts || [];
                        return (
                            <div className="border rounded-md mt-4 max-h-[60vh] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('contracts.fields.code', '合同编号')}</TableHead>
                                            <TableHead>{t('contracts.fields.name', '合同名称')}</TableHead>
                                            <TableHead>{t('projects.fields.name', '项目名称')}</TableHead>
                                            <TableHead>{t('contracts.fields.amount', '金额')} (万元)</TableHead>
                                            <TableHead>{t('contracts.fields.signed_at', '签署日期')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {contracts.map((contract: any) => (
                                            <TableRow key={contract.id}>
                                                <TableCell className="font-medium">{contract.code}</TableCell>
                                                <TableCell>{contract.name}</TableCell>
                                                <TableCell>{contract.project?.name || '-'}</TableCell>
                                                <TableCell>{contract.amount != null ? Number(contract.amount).toFixed(2) : '-'}</TableCell>
                                                <TableCell>{contract.signedAt ? new Date(contract.signedAt).toLocaleDateString() : '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                        {contracts.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('common.actions.no_data')}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
