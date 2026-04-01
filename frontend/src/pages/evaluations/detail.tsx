import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEvaluationRecord, submitEvaluation } from "./service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function EvaluationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { data: recordRes, isLoading } = useQuery({
        queryKey: ['evaluation-record', id],
        queryFn: () => getEvaluationRecord(id!),
        enabled: !!id,
    });

    const mutation = useMutation({
        mutationFn: submitEvaluation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluations'] });
            toast({ title: t("evaluations.submit_success"), description: t("evaluations.submit_success_desc") });
            navigate("/evaluations");
        },
        onError: (err: any) => {
            const errMsg = err.response?.data?.msg || err.response?.data?.message || "Failed to submit evaluation";
            toast({
                variant: "destructive",
                title: t("common.error"),
                description: errMsg
            });
        }
    });

    const record = recordRes?.data || recordRes;
    
    const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
        values: record ? {
            grade: record.grade === '推荐' ? 'Recommended' : (record.grade === '审慎' ? 'Prudent' : 'NotRecommended'),
            problem: record.problem || '',
            suggestion: record.suggestion || ''
        } : undefined
    });

    const selectedGrade = watch('grade');

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!record) {
        return <div className="p-8 text-center text-red-500">Record not found</div>;
    }

    const { supplier, task, status } = record;

    const onSubmit = (data: any) => {
        if (data.grade === 'NotRecommended' && !data.problem?.trim()) {
            return toast({
                variant: 'destructive',
                title: t('common.error'),
                description: t('evaluations.errors.problem_mandatory')
            });
        }

        const gradeMap: Record<string, string> = {
            'Recommended': '推荐',
            'Prudent': '审慎',
            'NotRecommended': '不推荐'
        };

        mutation.mutate({
            recordId: id!,
            grade: gradeMap[data.grade],
            problem: data.problem,
            suggestion: data.suggestion
        });
    };

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <Button variant="ghost" className="mb-4" onClick={() => navigate("/evaluations")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.actions.back")}
            </Button>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("evaluations.detail_title")}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t("evaluations.detail_subtitle", { supplier: supplier?.name || 'Unknown', year: task?.year || '' })}
                    </p>
                </div>
                <Badge variant={status === 'Completed' ? 'default' : 'outline'} className="text-lg px-4 py-1">
                    {t(`common.status.${status || 'undefined'}`, status || 'Draft') as string}
                </Badge>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('evaluations.fields.overall_evaluation')}</CardTitle>
                        <CardDescription>{t('evaluations.overall_evaluation_desc', '请根据供应商的综合表现选择评价等级。分数：推荐(100)，审慎(66)，不推荐(0)')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Controller
                            name="grade"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Select 
                                    onValueChange={field.onChange} 
                                    value={field.value}
                                    disabled={status === 'Completed' || status === 'Submitted'}
                                >
                                    <SelectTrigger className="w-full md:max-w-md">
                                        <SelectValue placeholder={t('evaluations.select_grade', '选择评价等级')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Recommended">{t('evaluations.grades.Recommended')}</SelectItem>
                                        <SelectItem value="Prudent">{t('evaluations.grades.Prudent')}</SelectItem>
                                        <SelectItem value="NotRecommended" className="text-red-500 font-semibold">{t('evaluations.grades.NotRecommended')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {selectedGrade === 'NotRecommended' && (
                            <div className="flex items-center gap-2 p-3 text-sm text-destructive border border-destructive/20 rounded-md bg-destructive/5">
                                <AlertCircle className="h-4 w-4" />
                                <span>{t('evaluations.errors.problem_mandatory')}</span>
                            </div>
                        )}
                        {errors.grade && <p className="text-sm text-red-500">Required</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("evaluations.fields.problem_record")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder={t("evaluations.dialog.problem_placeholder")}
                            className="min-h-[120px]"
                            disabled={status === 'Completed' || status === 'Submitted'}
                            {...register('problem')}
                        />
                    </CardContent>
                </Card>

                {!(status === 'Completed' || status === 'Submitted') && (
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => navigate("/evaluations")}>
                            {t("common.actions.cancel")}
                        </Button>
                        <Button type="submit" size="lg" disabled={mutation.isPending}>
                            {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t("evaluations.submit_btn")}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
