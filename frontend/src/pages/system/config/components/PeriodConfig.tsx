import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

export function PeriodConfig() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // Fetch current period config
    const { data: config, isLoading } = useQuery({
        queryKey: ['system-config', 'EvaluationTask_Period'],
        queryFn: () => api.get('/system-config/by-key?key=EvaluationTask_Period').then(res => res.data),
    });

    const [period, setPeriod] = useState<string>('Yearly');

    useEffect(() => {
        if (config && config.value) {
            setPeriod(config.value);
        }
    }, [config]);

    const saveMutation = useMutation({
        mutationFn: (newPeriod: string) => api.post('/system-config', {
            category: 'Evaluation',
            key: 'EvaluationTask_Period',
            value: newPeriod,
            description: 'Period for evaluation tasks generation'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-config', 'EvaluationTask_Period'] });
            toast({ title: t("common.actions.success"), description: t('system.config.evaluation_period_saved') });
        }
    });

    const handleSave = () => {
        saveMutation.mutate(period);
    };

    if (isLoading) return <div>{t('common.actions.loading')}</div>;

    return (
        <div className="space-y-4 max-w-sm">
            <div className="space-y-2">
                <Label>{t('system.config.evaluation_frequency')}</Label>
                <p className="text-xs text-muted-foreground mb-4">{t('system.config.evaluation_frequency_desc')}</p>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('system.config.select_frequency')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Yearly">{t('system.config.frequency_yearly')}</SelectItem>
                        <SelectItem value="Quarterly">{t('system.config.frequency_quarterly')}</SelectItem>
                        <SelectItem value="Monthly">{t('system.config.frequency_monthly')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? t('common.actions.saving') : t('common.actions.save')}
            </Button>
        </div>
    );
}
