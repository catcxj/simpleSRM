import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import { createEvaluationTask } from './service';
import { getProjects } from '@/pages/projects/service';
import { getSuppliers } from '@/pages/suppliers/service';

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState<{
        year: number;
        deadline: string;
        templateId: string;
        projectId: string;
        supplierIds: string[];
    }>({
        year: new Date().getFullYear(),
        deadline: `${new Date().getFullYear()}-12-31`,
        templateId: '',
        projectId: '',
        supplierIds: []
    });

    const getArrayData = (res: any) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (res.data && Array.isArray(res.data.data)) return res.data.data;
        return [];
    };

    const { data: projectsRes } = useQuery({ queryKey: ['projects'], queryFn: () => getProjects({ limit: 1000 }) });
    const projects = getArrayData(projectsRes);

    // Fetch suppliers, optionally filtered by projectId
    const { data: suppliersRes, isFetching: isSuppliersFetching } = useQuery({
        queryKey: ['suppliers', formData.projectId],
        queryFn: () => getSuppliers({ 
            limit: 1000,
            ...(formData.projectId && formData.projectId !== 'none' ? { projectId: formData.projectId } : {})
        })
    });
    const suppliersData = getArrayData(suppliersRes);
    const suppliers = suppliersData.filter((s: any) => s.status === 'Active');

    const mutationCreate = useMutation({
        mutationFn: createEvaluationTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluations'] });
            toast({ title: t('common.actions.success', '创建成功') });
            onOpenChange(false);
        },
        onError: (err: any) => {
            const rawMsg = err.detailedMessage;
            let friendlyMsg = rawMsg;
            if (rawMsg === 'Task already exists for this project in this period' || rawMsg === '该项目在此周期内已存在评价任务') {
                friendlyMsg = t('evaluations.errors.task_exists', '该年份/周期和项目范围内已存在评价任务，请勿重复创建。');
            }
            toast({ variant: 'destructive', title: t('common.error'), description: t(friendlyMsg) });
        }
    });

    const toggleSupplierSelection = (id: string) => {
        setFormData(prev => {
            if (prev.supplierIds.includes(id)) {
                return { ...prev, supplierIds: prev.supplierIds.filter(s => s !== id) };
            } else {
                return { ...prev, supplierIds: [...prev.supplierIds, id] };
            }
        });
    };

    const toggleAllSuppliers = () => {
        setFormData(prev => {
            if (prev.supplierIds.length === suppliers.length && suppliers.length > 0) {
                return { ...prev, supplierIds: [] };
            } else {
                return { ...prev, supplierIds: suppliers.map((s: any) => s.id) };
            }
        });
    };

    const handleSubmit = () => {
        if (!formData.year || !formData.deadline) {
            return toast({ variant: 'destructive', title: t('evaluations.year_deadline_required', '请填写年份和截止日期') });
        }

        mutationCreate.mutate({
            year: Number(formData.year),
            deadline: new Date(formData.deadline).toISOString(),
            projectId: formData.projectId && formData.projectId !== 'none' ? formData.projectId : undefined,
            supplierIds: formData.supplierIds.length > 0 ? formData.supplierIds : undefined
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t('evaluations.create_task', '创建评价任务')}</DialogTitle>
                    <DialogDescription>
                        {t('evaluations.create_task_desc', '创建评价任务并指定参与评价的供应商范围。')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('evaluations.year', '所属年份')} <span className="text-destructive">*</span></Label>
                        <Input
                            type="number"
                            className="col-span-3"
                            value={formData.year}
                            onChange={e => setFormData({ ...formData, year: Number(e.target.value) })}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('evaluations.deadline', '截止日期')} <span className="text-destructive">*</span></Label>
                        <Input
                            type="date"
                            className="col-span-3"
                            value={formData.deadline}
                            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">{t('evaluations.scope_project', '评价范围：按项目')}</Label>
                        <Select value={formData.projectId} onValueChange={v => setFormData({ ...formData, projectId: v, supplierIds: [] })}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder={t('evaluations.select_project', '选择项目（可选）')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('evaluations.none_project', '无（所有供应商）')}</SelectItem>
                                {projects.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <div className="flex justify-between items-center mb-2">
                            <Label className="font-semibold text-lg">{t('evaluations.supplier_scope', '指定供应商范围')}</Label>
                            <span className="text-sm text-muted-foreground">{formData.supplierIds.length} {t('evaluations.selected', '已选择')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">{t('evaluations.supplier_scope_desc', '选择特定的供应商。如果不选，则默认评价在该项目下（或全部）符合条件的供应商。')}</p>

                        <div className="border rounded-md p-4 max-h-[250px] overflow-y-auto space-y-2">
                            {isSuppliersFetching ? (
                                <p className="text-sm text-muted-foreground">{t('common.actions.loading', '加载中...')}</p>
                            ) : (
                                <>
                                    {suppliers.length > 0 && (
                                        <div className="flex items-center space-x-2 border-b pb-2 mb-2">
                                            <input
                                                type="checkbox"
                                                id="select_all_supp"
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={formData.supplierIds.length === suppliers.length && suppliers.length > 0}
                                                onChange={toggleAllSuppliers}
                                            />
                                            <Label htmlFor="select_all_supp" className="text-sm font-bold leading-none cursor-pointer">
                                                {t('common.actions.select_all', '全选')}
                                            </Label>
                                        </div>
                                    )}
                                    {suppliers.map((supplier: any) => (
                                        <div key={supplier.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`supp_${supplier.id}`}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={formData.supplierIds.includes(supplier.id)}
                                                onChange={() => toggleSupplierSelection(supplier.id)}
                                            />
                                            <Label htmlFor={`supp_${supplier.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                                {supplier.name}
                                            </Label>
                                        </div>
                                    ))}
                                    {suppliers.length === 0 && <p className="text-sm text-muted-foreground">{t('evaluations.no_active_suppliers', '未找到在库供应商。')}</p>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.actions.cancel')}</Button>
                    <Button onClick={handleSubmit}>{t('common.actions.save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
