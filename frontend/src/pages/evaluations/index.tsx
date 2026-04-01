import { useQuery } from '@tanstack/react-query';
import { getEvaluationRecords, getSupplierHistory } from './service';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { FileText, History } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CreateTaskDialog } from './CreateTaskDialog';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function EvaluationsPage() {
    const { t } = useTranslation();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['evaluations'],
        // Backend now returns EvaluationRecord[]
        queryFn: () => getEvaluationRecords(),
    });

    const { data: historyData } = useQuery({
        queryKey: ['history', selectedSupplierId],
        queryFn: () => getSupplierHistory(selectedSupplierId!),
        enabled: !!selectedSupplierId
    });

    const handleViewHistory = (supplierId: string) => {
        setSelectedSupplierId(supplierId);
        setIsHistoryOpen(true);
    };

    const { user } = useAuthStore();
    const isAdmin = user?.role === '系统管理员' || (user?.role as any)?.name === '系统管理员' || user?.username === 'admin';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{t("evaluations.title")}</h2>
                {isAdmin && (
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> {t("evaluations.create_task")}
                    </Button>
                )}
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("evaluations.fields.project")}</TableHead>
                            <TableHead>{t("evaluations.fields.supplier")}</TableHead>
                            <TableHead>{t("evaluations.fields.year")}</TableHead>
                            <TableHead>{t("evaluations.fields.status")}</TableHead>
                            <TableHead>{t("evaluations.fields.score")}</TableHead>
                            <TableHead>{t("evaluations.fields.grade")}</TableHead>
                            <TableHead className="w-[150px]">{t("evaluations.fields.action")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-8">{t("common.actions.loading")}</TableCell></TableRow>
                        ) : (data as any)?.data?.map((record: any) => (
                            <TableRow key={record.id}>
                                <TableCell>{record.task?.project?.name || '-'}</TableCell>
                                <TableCell className="font-medium">{record.supplier?.name}</TableCell>
                                <TableCell>{record.task?.year}</TableCell>
                                <TableCell>
                                    <Badge variant={record.status === 'Completed' ? 'default' : 'outline'}>
                                        {t(`common.status.${record.status}`, record.status) as string}
                                    </Badge>
                                </TableCell>
                                <TableCell>{record.totalScore ?? '-'}</TableCell>
                                <TableCell>{record.grade ?? '-'}</TableCell>
                                <TableCell>
                                    <div className="flex space-x-2">
                                        {record.status !== 'Completed' ? (
                                            <Button size="sm" asChild>
                                                <Link to={`/evaluations/${record.id}`}>
                                                    <FileText className="mr-2 h-4 w-4" /> {t("evaluations.evaluate_btn")}
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="secondary" asChild>
                                                <Link to={`/evaluations/${record.id}`}>
                                                    <FileText className="mr-2 h-4 w-4" /> {t("common.actions.view")}
                                                </Link>
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" onClick={() => handleViewHistory(record.supplierId)}>
                                            <History className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && (data as any)?.data?.length === 0 && (
                            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("common.actions.no_data")}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{t("evaluations.history_title")}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("evaluations.fields.date")}</TableHead>
                                    <TableHead>{t("evaluations.fields.score")}</TableHead>
                                    <TableHead>{t("evaluations.fields.grade")}</TableHead>
                                    <TableHead>{t("evaluations.fields.feedback")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historyData?.data?.map((record: any) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{format(new Date(record.updatedAt), 'yyyy-MM-dd')}</TableCell>
                                        <TableCell>{record.totalScore}</TableCell>
                                        <TableCell>{record.grade}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={record.problem}>
                                            {record.problem || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!historyData?.data || historyData?.data.length === 0) && (
                                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("common.actions.no_data")}</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <CreateTaskDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
    );
}
