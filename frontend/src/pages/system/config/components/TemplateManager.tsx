import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/pages/evaluations/service';

export function TemplateManager() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isActive: true,
        indicators: [] as any[]
    });

    const { data: templates, isLoading } = useQuery({
        queryKey: ['evaluation-templates'],
        queryFn: getTemplates
    });

    const mutationCreate = useMutation({
        mutationFn: createTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-templates'] });
            toast({ title: t('common.actions.success') });
            setIsOpen(false);
        },
        onError: (err: any) => {
            toast({ variant: 'destructive', title: t('common.error'), description: err.response?.data?.message || err.message });
        }
    });

    const mutationUpdate = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => updateTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-templates'] });
            toast({ title: t('common.actions.success') });
            setIsOpen(false);
        },
        onError: (err: any) => {
            toast({ variant: 'destructive', title: t('common.error'), description: err.response?.data?.message || err.message });
        }
    });

    const mutationDelete = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-templates'] });
            toast({ title: t('common.actions.deleted') });
        }
    });

    const handleOpen = (template?: any) => {
        if (template) {
            setEditingId(template.id);
            setFormData({
                name: template.name,
                description: template.description || '',
                isActive: template.isActive,
                indicators: JSON.parse(template.indicators || '[]')
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                isActive: true,
                indicators: [{ key: `ind_${Date.now()}`, name: '', weight: 0 }]
            });
        }
        setIsOpen(true);
    };

    const handleAddIndicator = () => {
        setFormData(prev => ({
            ...prev,
            indicators: [...prev.indicators, { key: `ind_${Date.now()}`, name: '', weight: 0 }]
        }));
    };

    const handleRemoveIndicator = (index: number) => {
        const newIndicators = [...formData.indicators];
        newIndicators.splice(index, 1);
        setFormData(prev => ({ ...prev, indicators: newIndicators }));
    };

    const handleIndicatorChange = (index: number, field: string, value: any) => {
        const newIndicators = [...formData.indicators];
        newIndicators[index] = { ...newIndicators[index], [field]: value };
        setFormData(prev => ({ ...prev, indicators: newIndicators }));
    };

    const handleSubmit = () => {
        if (!formData.name) return toast({ variant: 'destructive', title: t('common.error'), description: '请输入模板名称' });

        const totalWeight = formData.indicators.reduce((sum, ind) => sum + Number(ind.weight), 0);
        if (totalWeight !== 100) {
            return toast({
                variant: 'destructive',
                title: t('common.error'),
                description: `总权重必须为100%。当前: ${totalWeight}%`
            });
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive,
            indicators: JSON.stringify(formData.indicators)
        };

        if (editingId) {
            mutationUpdate.mutate({ id: editingId, data: payload });
        } else {
            mutationCreate.mutate(payload);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpen()}>
                    <Plus className="mr-2 h-4 w-4" /> {t('common.actions.add')}
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('system.config.fields.name')}</TableHead>
                        <TableHead>{t('system.config.fields.description')}</TableHead>
                        <TableHead>{t('evaluations.indicators_and_weights', '指标 & 权重')}</TableHead>
                        <TableHead>{t('system.config.fields.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center">{t('common.actions.loading')}</TableCell></TableRow>
                    ) : (Array.isArray(templates) ? templates : (templates as any)?.data || [])?.map((template: any) => (
                        <TableRow key={template.id}>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>{template.description}</TableCell>
                            <TableCell>
                                {(() => {
                                    try {
                                        const inds = JSON.parse(template.indicators || '[]');
                                        return inds.map((i: any) => `${i.name}(${i.weight}%)`).join(', ');
                                    } catch (e) { return '-'; }
                                })()}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleOpen(template)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => {
                                        if (confirm(t('common.actions.confirm_delete'))) {
                                            mutationDelete.mutate(template.id);
                                        }
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!isLoading && (Array.isArray(templates) ? templates : (templates as any)?.data || [])?.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t('common.actions.no_data')}</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? t('common.actions.edit') : t('common.actions.add')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('system.config.fields.name')} *</Label>
                            <Input
                                className="col-span-3"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('system.config.fields.description')}</Label>
                            <Input
                                className="col-span-3"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="border-t pt-4 mt-2">
                            <div className="flex justify-between items-center mb-4">
                                <Label className="font-semibold text-lg">{t('evaluations.indicators', '评价指标')}</Label>
                                <Button variant="outline" size="sm" onClick={handleAddIndicator}>
                                    <Plus className="mr-2 h-4 w-4" /> {t('common.actions.add_indicator', '添加指标')}
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {formData.indicators.map((ind, index) => (
                                    <div key={index} className="flex gap-3 items-start border p-3 rounded-md bg-muted/30">
                                        <div className="grid gap-2 flex-grow">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">{t('system.config.fields.name', '名称')}*</Label>
                                                    <Input
                                                        size={1}
                                                        value={ind.name}
                                                        onChange={e => handleIndicatorChange(index, 'name', e.target.value)}
                                                        placeholder={t('evaluations.indicator_placeholder', '例如: 质量')}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">{t('evaluations.weight', '权重 (%)')}*</Label>
                                                    <Input
                                                        type="number"
                                                        size={1}
                                                        value={ind.weight}
                                                        onChange={e => handleIndicatorChange(index, 'weight', Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="shrink-0 mt-5" onClick={() => handleRemoveIndicator(index)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 p-3 bg-secondary rounded-md flex justify-between">
                                <span className="font-medium">{t('evaluations.total_weight_label', '总权重:')}</span>
                                <span className={
                                    formData.indicators.reduce((s, i) => s + Number(i.weight), 0) === 100
                                        ? "text-green-600 font-bold"
                                        : "text-red-500 font-bold"
                                }>
                                    {formData.indicators.reduce((s, i) => s + Number(i.weight), 0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>{t('common.actions.cancel')}</Button>
                        <Button onClick={handleSubmit}>{t('common.actions.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
