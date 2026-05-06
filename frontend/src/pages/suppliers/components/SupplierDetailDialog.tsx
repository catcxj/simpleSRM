import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getSupplierContracts, getSupplierById } from "../service";

interface SupplierDetailDialogProps {
    supplier: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SupplierDetailDialog({ supplier: initialSupplier, open, onOpenChange }: SupplierDetailDialogProps) {
    const { t } = useTranslation();
    
    const { data: supplierDetails, isLoading: isLoadingDetails } = useQuery({
        queryKey: ["supplier-detail", initialSupplier?.id],
        queryFn: () => getSupplierById(initialSupplier?.id!),
        enabled: !!initialSupplier?.id && open,
    });

    const supplier = supplierDetails || initialSupplier;
    
    const { data: contracts, isLoading: isLoadingContracts } = useQuery({
        queryKey: ["supplier-contracts", initialSupplier?.id],
        queryFn: () => getSupplierContracts(initialSupplier?.id!),
        enabled: !!initialSupplier?.id && open,
    });

    if (!initialSupplier) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        {supplier.name}
                        <Badge variant={supplier.status === 'Active' ? 'default' : 'secondary'}>
                            {t(`common.status.${supplier.status}`, { defaultValue: supplier.status })}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="basic">{t('suppliers.form.tabs.basic')}</TabsTrigger>
                        <TabsTrigger value="contact">{t('suppliers.form.tabs.contact')}</TabsTrigger>
                        <TabsTrigger value="business">{t('suppliers.form.tabs.business')}</TabsTrigger>
                        <TabsTrigger value="operation">{t('suppliers.form.tabs.operation')}</TabsTrigger>
                        <TabsTrigger value="contracts">{t('suppliers.form.tabs.contracts')}</TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                        <TabsContent value="basic">
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">{t('suppliers.fields.name')}</label>
                                            <p className="mt-1 font-medium">{supplier.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">{t('suppliers.fields.registration_number')}</label>
                                            <p className="mt-1">{supplier.registrationNumber || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">{t('suppliers.fields.address')}</label>
                                            <p className="mt-1">{supplier.address || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">{t('suppliers.fields.website')}</label>
                                            <p className="mt-1">{supplier.website || '-'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="contact">
                            <Card>
                                <CardContent className="pt-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('suppliers.fields.contact_person')}</TableHead>
                                                <TableHead>{t('suppliers.fields.position')}</TableHead>
                                                <TableHead>{t('suppliers.fields.phone')}</TableHead>
                                                <TableHead>{t('suppliers.fields.email')}</TableHead>
                                                <TableHead>{t('suppliers.fields.primary_contact')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingDetails ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8">{t('common.actions.loading')}</TableCell>
                                                </TableRow>
                                            ) : supplier.contacts?.map((c: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium">{c.name}</TableCell>
                                                    <TableCell>{c.position || '-'}</TableCell>
                                                    <TableCell>{c.phone}</TableCell>
                                                    <TableCell>{c.email || '-'}</TableCell>
                                                    <TableCell>{c.isPrimary ? <Badge>{t('common.primary')}</Badge> : '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                            {(!supplier.contacts || supplier.contacts.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">{t('common.actions.no_data')}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="business">
                            <Card>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">{t('suppliers.fields.business_type')}</label>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {(() => {
                                                    try {
                                                        const types = typeof supplier.businessType === 'string' ? JSON.parse(supplier.businessType) : supplier.businessType;
                                                        return Array.isArray(types)
                                                            ? types.map(t_ => <Badge key={t_} variant="outline">{t_}</Badge>)
                                                            : <Badge variant="outline">{supplier.businessType}</Badge>;
                                                    } catch (e) {
                                                        return <Badge variant="outline">{supplier.businessType}</Badge>;
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">{t('suppliers.form.fields.industry')}</label>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {(() => {
                                                    try {
                                                        const industries = typeof supplier.industry === 'string' ? JSON.parse(supplier.industry) : supplier.industry;
                                                        return Array.isArray(industries)
                                                            ? industries.map(i_ => <Badge key={i_} variant="secondary">{i_}</Badge>)
                                                            : (supplier.industry ? <Badge variant="secondary">{supplier.industry}</Badge> : '-');
                                                    } catch (e) {
                                                        return supplier.industry ? <Badge variant="secondary">{supplier.industry}</Badge> : '-';
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-medium text-muted-foreground">{t('suppliers.form.fields.qualifications')}</label>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t('suppliers.fields.qualification_name')}</TableHead>
                                                    <TableHead>{t('suppliers.fields.certificate_no')}</TableHead>
                                                    <TableHead>{t('suppliers.fields.effective_date')}</TableHead>
                                                    <TableHead>{t('suppliers.fields.expiry_date')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {isLoadingDetails ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8">{t('common.actions.loading')}</TableCell>
                                                    </TableRow>
                                                ) : supplier.qualifications?.map((q: any, i: number) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-medium">{q.name}</TableCell>
                                                        <TableCell>{q.certificateNo}</TableCell>
                                                        <TableCell>{q.effectiveDate ? format(new Date(q.effectiveDate), 'yyyy-MM-dd') : '-'}</TableCell>
                                                        <TableCell>{q.expiryDate ? format(new Date(q.expiryDate), 'yyyy-MM-dd') : '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {(!supplier.qualifications || supplier.qualifications.length === 0) && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">{t('common.actions.no_data')}</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="operation">
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">{t('suppliers.form.fields.service_country')}</label>
                                            <p className="mt-1">{supplier.serviceRegion || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">{t('suppliers.form.fields.cooperation_years')}</label>
                                            <p className="mt-1">{supplier.cooperationYears || 0} {t('common.years')}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">{t('suppliers.form.fields.problem_record')}</label>
                                        <div className="mt-1 p-3 bg-muted rounded-md min-h-[60px] whitespace-pre-wrap text-sm">
                                            {supplier.problemRecord || t('common.actions.no_data')}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="contracts">
                            <Card>
                                <CardContent className="pt-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('contracts.fields.code', 'Contract Code')}</TableHead>
                                                <TableHead>{t('contracts.fields.name', 'Contract Name')}</TableHead>
                                                <TableHead>{t('projects.fields.name', 'Project Name')}</TableHead>
                                                <TableHead>{t('contracts.fields.amount', 'Amount')} (10k)</TableHead>
                                                <TableHead>{t('contracts.fields.signed_at', 'Signed Date')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingContracts ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8">{t('common.actions.loading')}</TableCell>
                                                </TableRow>
                                            ) : contracts && contracts.length > 0 ? (
                                                contracts.map((c: any) => (
                                                    <TableRow key={c.id}>
                                                        <TableCell className="font-medium">{c.code}</TableCell>
                                                        <TableCell>{c.name}</TableCell>
                                                        <TableCell>{c.project?.name || '-'}</TableCell>
                                                        <TableCell>{Number(c.amount).toFixed(2)}</TableCell>
                                                        <TableCell>{c.signedAt ? format(new Date(c.signedAt), 'yyyy-MM-dd') : '-'}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('common.actions.no_data')}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
