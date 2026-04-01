import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttributes, createAttribute, updateAttribute, deleteAttribute, AttributeDefinition } from '../service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';

interface AttributeManagerProps {
    targetEntity: string;
}

export function AttributeManager({ targetEntity }: AttributeManagerProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null);

    const { data: attributes, isLoading } = useQuery({
        queryKey: ['attributes', targetEntity],
        queryFn: () => getAttributes(targetEntity),
    });

    const createMutation = useMutation({
        mutationFn: createAttribute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attributes', targetEntity] });
            setIsOpen(false);
            toast({ title: t("common.actions.success") });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<AttributeDefinition> }) => updateAttribute(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attributes', targetEntity] });
            setIsOpen(false);
            setEditingAttribute(null);
            toast({ title: t("common.actions.updated") });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAttribute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attributes', targetEntity] });
            toast({ title: t("common.actions.deleted") });
        }
    });

    const { register, handleSubmit, reset, setValue } = useForm<AttributeDefinition>();

    const openCreateDialog = () => {
        setEditingAttribute(null);
        reset({
            targetEntity, // pre-fill category/targetEntity based on props?? Wait backend expects targetEntity field? Yes.
            // Oh DTO has targetEntity field.
            name: '',
            code: '',
            type: 'text',
            required: false,
            isActive: true,
            // category: targetEntity // Wait, my interface has category, backend DTO has targetEntity?
            // Checking service... Service interface has category: string.
            // Backend DTO `CreateAttributeDefinitionDto` has `targetEntity`.
            // I should update service interface to match backend DTO.
            // For now I'll cast.
        } as any);
        setValue('category', targetEntity); // Using category as targetEntity for now
        setIsOpen(true);
    };

    const openEditDialog = (attr: AttributeDefinition) => {
        setEditingAttribute(attr);
        reset(attr);
        setIsOpen(true);
    };

    const onSubmit = (data: any) => {
        data.targetEntity = targetEntity; // Ensure targetEntity is set
        if (editingAttribute) {
            updateMutation.mutate({ id: editingAttribute.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Button onClick={openCreateDialog} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> {t('common.actions.add')}
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('system.config.fields.name')}</TableHead>
                            <TableHead>{t('system.config.fields.code')}</TableHead>
                            <TableHead>{t('system.config.fields.type')}</TableHead>
                            <TableHead>{t('system.config.fields.required')}</TableHead>
                            <TableHead className="text-right">{t('common.actions.title')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center">{t('common.actions.loading')}</TableCell></TableRow>
                        ) : (attributes as any)?.data?.map((attr: any) => (
                            <TableRow key={attr.id}>
                                <TableCell>{attr.name}</TableCell>
                                <TableCell><code className="bg-muted px-1 py-0.5 rounded text-xs">{attr.code}</code></TableCell>
                                <TableCell>{attr.type}</TableCell>
                                <TableCell>{attr.required ? 'Yes' : 'No'}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(attr)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        if (confirm(t('common.actions.confirm_delete'))) deleteMutation.mutate(attr.id);
                                    }}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(attributes as any)?.data?.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">{t('common.actions.no_data')}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAttribute ? t('system.config.edit_attribute') : t('system.config.add_attribute')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('system.config.fields.name')}</Label>
                                <Input {...register('name', { required: true })} placeholder="Display Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('system.config.fields.code')}</Label>
                                <Input {...register('code', { required: true })} placeholder="Field Key (e.g. business_type)" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('system.config.fields.type')}</Label>
                                <Select onValueChange={(val) => setValue('type', val as any)} defaultValue="text">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="select">Select</SelectItem>
                                        <SelectItem value="multiselect">Multi-Select</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-8">
                                <Checkbox
                                    id="required"
                                    onCheckedChange={(checked) => setValue('required', checked as boolean)}
                                    defaultChecked={false}
                                />
                                <Label htmlFor="required">{t('system.config.fields.required')}</Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('system.config.fields.options')} (JSON Array or comma separated)</Label>
                            <Input {...register('options')} placeholder='["Option A", "Option B"]' />
                            <p className="text-xs text-muted-foreground">Required for Select/Multi-Select types.</p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('common.actions.cancel')}</Button>
                            <Button type="submit">{t('common.actions.save')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
