import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSystemConfigs, createSystemConfig, updateSystemConfig, deleteSystemConfig, SystemConfig } from '../service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Props {
    category: string;
    configKey: string;
    title: string;
    placeholder?: string;
}

export function SystemDictionaryManager({ category, configKey, title, placeholder }: Props) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [newValue, setNewValue] = useState('');
    const [editItem, setEditItem] = useState<SystemConfig | null>(null);

    const { data: configsData } = useQuery({
        queryKey: ['system-configs', category],
        queryFn: () => getSystemConfigs(category),
    });

    // Handle extraction depending on how the backend returns nested or flat data
    const list = Array.isArray(configsData)
        ? configsData
        : ((configsData as any)?.data || []);

    const items = list.filter((c: SystemConfig) => c.key === configKey);

    const createMutation = useMutation({
        mutationFn: createSystemConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-configs', category] });
            setNewValue('');
            toast({ title: t('common.actions.success') });
        },
        onError: () => {
            toast({ variant: 'destructive', title: 'Failed to add item' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, value }: { id: string; value: string }) => updateSystemConfig(id, { value }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-configs', category] });
            setEditItem(null);
            toast({ title: t('common.actions.updated') });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSystemConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-configs', category] });
            toast({ title: t('common.actions.deleted') });
        }
    });

    const handleAdd = () => {
        if (!newValue.trim()) return;
        const exists = items.find((i: SystemConfig) => i.value.toLowerCase() === newValue.trim().toLowerCase());
        if (exists) {
            toast({ variant: 'destructive', title: 'Item already exists' });
            return;
        }
        createMutation.mutate({
            category,
            key: configKey,
            value: newValue.trim(),
        });
    };

    const handleEditSave = () => {
        if (!editItem || !editItem.value.trim()) return;
        updateMutation.mutate({ id: editItem.id, value: editItem.value.trim() });
    };

    return (
        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
            <h3 className="font-semibold text-lg">{title}</h3>

            <div className="flex gap-2 max-w-sm">
                <Input
                    placeholder={placeholder || `Add new ${title}...`}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <Button onClick={handleAdd} disabled={createMutation.isPending || !newValue.trim()}>
                    <Plus className="h-4 w-4 mr-1" /> {t('common.actions.add')}
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                {items.length === 0 && (
                    <span className="text-sm text-muted-foreground italic">No items configured yet.</span>
                )}
                {items.map((item: SystemConfig) => (
                    <Badge key={item.id} variant="secondary" className="px-3 py-1.5 text-sm font-medium flex items-center gap-2 group">
                        {item.value}
                        <button
                            className="bg-transparent hover:text-primary transition-colors focus:outline-none"
                            onClick={() => setEditItem(item)}
                            title="Edit"
                        >
                            <Edit className="h-3 w-3" />
                        </button>
                        <button
                            className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
                            onClick={() => confirm(t('common.actions.confirm_delete')) && deleteMutation.mutate(item.id)}
                            title="Delete"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </Badge>
                ))}
            </div>

            <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit {title}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="edit-value" className="mb-2 block">Value</Label>
                        <Input
                            id="edit-value"
                            value={editItem?.value || ''}
                            onChange={(e) => editItem && setEditItem({ ...editItem, value: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
                            {t('common.actions.cancel')}
                        </Button>
                        <Button type="button" onClick={handleEditSave} disabled={updateMutation.isPending || !editItem?.value.trim()}>
                            {t('common.actions.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
