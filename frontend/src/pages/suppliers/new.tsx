import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider } from "react-hook-form"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import { createSupplier, updateSupplier, getSupplierById, getSuppliers } from "./service"
import { supplierSchema, SupplierFormValues } from "./schema"
import { Button } from "@/components/ui/button"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from '@/hooks/use-toast'
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from 'react-i18next';
import { ContactTab } from "./components/ContactTab"
import { QualificationTab } from "./components/QualificationTab"
import { ContractTab } from "./components/ContractTab"
export default function SupplierFormPage() {
    const { t } = useTranslation();
    const navigate = useNavigate()
    const { id } = useParams()
    const queryClient = useQueryClient()
    const isEditing = Boolean(id)

    const [supplierSearchText, setSupplierSearchText] = useState("");
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [regNumberForUniqueCheck, setRegNumberForUniqueCheck] = useState("");

    // Auto-complete querying based on the input text
    const { data: suggestionsData, isFetching: isLoadingSuggestions } = useQuery({
        queryKey: ['supplierSuggestions', supplierSearchText],
        queryFn: () => getSuppliers({ name: supplierSearchText, limit: 10 }),
        enabled: supplierSearchText.length > 0 && isSuggestionsOpen, // Work for both creating and editing
    });
    const suggestions = ((suggestionsData as any)?.data || []).filter((s: any) => s.id !== id);

    // Real-time unique check for registrationNumber
    const { data: regCheckData } = useQuery({
        queryKey: ['supplierUniqueCheck', regNumberForUniqueCheck],
        queryFn: () => getSuppliers({ registrationNumber: regNumberForUniqueCheck, limit: 1 }),
        enabled: Boolean(regNumberForUniqueCheck), // Work for both creating and editing
    });
    const isRegDuplicate = (regCheckData as any)?.total > 0 && (regCheckData as any).data[0].id !== id;

    const { data: configData } = useQuery({
        queryKey: ['system-config', 'SupplierAttribute'],
        queryFn: async () => {
            const res = await fetch('/api/system-config?category=SupplierAttribute');
            const json = await res.json();
            return Array.isArray(json) ? json : (json?.data || []);
        }
    });

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema) as any,
        mode: "onChange",
        defaultValues: {
            name: "",
            businessType: [],
            industry: [],
            status: "Draft",
            isInLibrary: true,
            cooperationYears: 0,

            // Nested Defaults
            contacts: [{ name: "", position: "", phone: "", email: "", isPrimary: true }],
            qualifications: [],

            // Basic Info
            legalRepresentative: "",
            registeredCapital: 0,
            establishDate: "",
            companyType: "",
            address: "",
            website: "",

            // Operation
            serviceRegion: "",
            problemRecord: "",
            // ensure the parsed existing data fields are arrays if saved as JSON strings by backend
        } as any,
    })

    const { isLoading: isLoadingSupplier } = useQuery({
        queryKey: ['supplier', id],
        queryFn: async () => {
            if (!id) return null;
            const data = await getSupplierById(id);
            // Replace null values with empty strings to prevent uncontrolled component warnings
            const sanitizedData = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, value === null ? "" : value])
            ) as any;

            if (sanitizedData.establishDate) {
                sanitizedData.establishDate = new Date(sanitizedData.establishDate).toISOString().split('T')[0];
            }
            if (sanitizedData.qualifications && Array.isArray(sanitizedData.qualifications)) {
                sanitizedData.qualifications = sanitizedData.qualifications.map((q: any) => ({
                    ...q,
                    effectiveDate: q.effectiveDate ? new Date(q.effectiveDate).toISOString().split('T')[0] : "",
                    expiryDate: q.expiryDate ? new Date(q.expiryDate).toISOString().split('T')[0] : "",
                }));
            }

            // reset form softly
            // parse JSON strings if backend stores them as strings
            try {
                if (typeof sanitizedData.businessType === 'string') {
                    sanitizedData.businessType = JSON.parse(sanitizedData.businessType) || [];
                }
            } catch (e) {
                sanitizedData.businessType = sanitizedData.businessType ? [sanitizedData.businessType] : [];
            }
            try {
                if (typeof sanitizedData.industry === 'string') {
                    sanitizedData.industry = JSON.parse(sanitizedData.industry) || [];
                }
            } catch (e) {
                sanitizedData.industry = sanitizedData.industry ? [sanitizedData.industry] : [];
            }

            form.reset({
                ...form.getValues(),
                ...sanitizedData,
            });
            return data;
        },
        enabled: isEditing,
    });

    useEffect(() => {
        const registrationNumber = form.watch("registrationNumber");
        if (!registrationNumber) {
            setRegNumberForUniqueCheck("");
            return;
        }
        const handler = setTimeout(() => {
            setRegNumberForUniqueCheck(registrationNumber);
        }, 300);
        return () => clearTimeout(handler);
    }, [form.watch("registrationNumber")]);

    const createMutation = useMutation({
        mutationFn: createSupplier,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] })
            toast({ title: t('suppliers.form.success_msg') || "供应商已创建", description: "该供应商已成功添加到系统。" })
            navigate("/suppliers")
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: t('common.error', '错误'),
                description: t(error.detailedMessage)
            })
        }
    })

    const updateMutation = useMutation({
        mutationFn: (data: SupplierFormValues) => updateSupplier(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] })
            toast({ title: t('suppliers.form.success_msg') || "供应商已更新", description: "供应商信息已成功更新。" })
            navigate("/suppliers")
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: t('common.error', '错误'),
                description: t(error.detailedMessage)
            })
        }
    })

    const isPending = createMutation.isPending || updateMutation.isPending;

    function onSubmit(data: SupplierFormValues) {
        const payload = {
            ...data,
            businessType: JSON.stringify(data.businessType),
            industry: data.industry ? JSON.stringify(data.industry) : null
        };

        // Remove empty date strings that cause validation errors on backend
        if (!payload.establishDate) {
            delete payload.establishDate;
        }

        if (payload.qualifications) {
            payload.qualifications = payload.qualifications.map((q: any) => {
                const newQ = { ...q };
                if (!newQ.effectiveDate) delete newQ.effectiveDate;
                if (!newQ.expiryDate) delete newQ.expiryDate;
                return newQ;
            });
        }

        if (isEditing) {
            updateMutation.mutate(payload as any)
        } else {
            createMutation.mutate(payload as any)
        }
    }

    function onError(errors: any) {
        console.error("Form validation errors:", errors);
        toast({
            variant: "destructive",
            title: t('common.validation_error', '校验错误'),
            description: t('common.form_error_desc', '表单填写有误，请检查。'),
        });
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">
                {isEditing ? t('common.actions.edit') : t('suppliers.form.create_title')}
            </h2>
            {isLoadingSupplier ? (
                <div>Loading...</div>
            ) : (
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className={`grid w-full ${isEditing ? 'grid-cols-5' : 'grid-cols-4'}`}>
                                <TabsTrigger value="basic">{t('suppliers.form.tabs.basic')}</TabsTrigger>
                                <TabsTrigger value="contact">{t('suppliers.form.tabs.contact')}</TabsTrigger>
                                <TabsTrigger value="business">{t('suppliers.form.tabs.business')}</TabsTrigger>
                                <TabsTrigger value="operation">{t('suppliers.form.tabs.operation')}</TabsTrigger>
                                {isEditing && <TabsTrigger value="contracts">{t('suppliers.form.tabs.contracts', '合同列表')}</TabsTrigger>}
                            </TabsList>

                            <div className="mt-6">
                                {/* --- Basic Info Tab --- */}
                                <TabsContent value="basic">
                                    <Card>
                                        <CardContent className="space-y-4 pt-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem className="relative">
                                                            <FormLabel>{t('suppliers.fields.name')} <span className="text-destructive">*</span></FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={t('suppliers.form.placeholders.supplier_name')}
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        field.onChange(e);
                                                                        setSupplierSearchText(e.target.value);
                                                                        setIsSuggestionsOpen(true);
                                                                    }}
                                                                    onFocus={() => {
                                                                        if (field.value) {
                                                                            setSupplierSearchText(field.value);
                                                                            setIsSuggestionsOpen(true);
                                                                        }
                                                                    }}
                                                                    onBlur={() => {
                                                                        field.onBlur();
                                                                        setTimeout(() => setIsSuggestionsOpen(false), 200);
                                                                    }}
                                                                    autoComplete="off"
                                                                />
                                                            </FormControl>
                                                            {isSuggestionsOpen && supplierSearchText.length > 0 && (
                                                                <div className="absolute top-[full] left-0 z-[100] mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                                                                    <div className="max-h-60 overflow-y-auto p-1">
                                                                        {isLoadingSuggestions ? (
                                                                            <div className="p-2 text-sm text-muted-foreground">{t('common.actions.loading', 'Loading')}...</div>
                                                                        ) : suggestions.length > 0 ? (
                                                                            suggestions.map((s: any) => (
                                                                                <div
                                                                                    key={s.id}
                                                                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                                                                    onClick={() => {
                                                                                        form.setValue("name", s.name);
                                                                                        if (s.registrationNumber) {
                                                                                            form.setValue("registrationNumber", s.registrationNumber);
                                                                                        }
                                                                                        setIsSuggestionsOpen(false);
                                                                                    }}
                                                                                >
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-medium text-[15px]">{s.name}</span>
                                                                                        {s.registrationNumber && (
                                                                                            <span className="text-xs text-muted-foreground">代码: {s.registrationNumber}</span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        ) : (
                                                                            <div className="p-2 text-sm text-muted-foreground">
                                                                                未找到在库供应商，可作为新供应商创建。
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="registrationNumber"
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('suppliers.fields.registration_number', '统一社会信用代码/注册号')} <span className="text-destructive">*</span></FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={t('suppliers.form.placeholders.registration_number', '请输入统一社会信用代码/注册号')}
                                                                    {...field}
                                                                    value={field.value || ""}
                                                                />
                                                            </FormControl>
                                                            {isRegDuplicate ? (
                                                                <p className="text-sm font-medium text-destructive">
                                                                    {t('suppliers.errors.registration_number_exists')}
                                                                </p>
                                                            ) : (
                                                                <FormMessage />
                                                            )}
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="status"
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('suppliers.fields.status')}</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder={t('projects.placeholders.status')} />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="Draft">{t('common.status.Draft')}</SelectItem>
                                                                    <SelectItem value="Active">{t('common.status.Active')}</SelectItem>
                                                                    <SelectItem value="Suspended">{t('common.status.Suspended')}</SelectItem>
                                                                    <SelectItem value="Blacklisted">{t('common.status.Blacklisted')}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="isInLibrary"
                                                    render={(props: any) => {
                                                        const field = props.field;
                                                        return (
                                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm mt-8">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel>
                                                                        {t('suppliers.form.fields.is_in_library')}
                                                                    </FormLabel>
                                                                </div>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="address"
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('suppliers.fields.address', '公司地址')}</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ""} placeholder={t('suppliers.form.placeholders.address', '公司地址')} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="website"
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('suppliers.fields.website', '公司网址')}</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ""} placeholder={t('suppliers.form.placeholders.website', '公司网址(含http)')} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* --- Contact Details Tab --- */}
                                <TabsContent value="contact">
                                    <ContactTab />
                                </TabsContent>

                                {/* --- Business & Qualifications Tab --- */}
                                <TabsContent value="business">
                                    <Card className="mb-4">
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <FormField
                                                    control={form.control}
                                                    name="businessType"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <div className="mb-4">
                                                                <FormLabel className="text-base">{t('suppliers.fields.business_type')} <span className="text-destructive">*</span></FormLabel>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {/* Dynamic Options */}
                                                                {configData?.filter((c: any) => c.key === 'BusinessType').map((c: any) => (
                                                                    <div key={c.id} className="flex flex-row items-center space-x-2 space-y-0">
                                                                        <Checkbox
                                                                            checked={field.value?.includes(c.value)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                    ? field.onChange([...(field.value || []), c.value])
                                                                                    : field.onChange(field.value?.filter((val) => val !== c.value))
                                                                            }}
                                                                        />
                                                                        <FormLabel className="font-normal">{c.value}</FormLabel>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="industry"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <div className="mb-4">
                                                                <FormLabel className="text-base">{t('suppliers.form.fields.industry')}</FormLabel>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {/* Dynamic Options */}
                                                                {configData?.filter((c: any) => c.key === 'Industry').map((c: any) => (
                                                                    <div key={c.id} className="flex flex-row items-center space-x-2 space-y-0">
                                                                        <Checkbox
                                                                            checked={field.value?.includes(c.value)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                    ? field.onChange([...(field.value || []), c.value])
                                                                                    : field.onChange(field.value?.filter((val) => val !== c.value))
                                                                            }}
                                                                        />
                                                                        <FormLabel className="font-normal">{c.value}</FormLabel>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <QualificationTab />
                                </TabsContent>

                                {/* --- Operation Tab --- */}
                                <TabsContent value="operation">
                                    <Card>
                                        <CardContent className="space-y-4 pt-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="serviceRegion"
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('suppliers.form.fields.service_country')}</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder={t('suppliers.form.placeholders.service_country')} {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="cooperationYears"
                                                    render={({ field }: { field: any }) => (
                                                        <FormItem>
                                                            <FormLabel>{t('suppliers.form.fields.cooperation_years')}</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" min="0" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="problemRecord"
                                                render={({ field }: { field: any }) => (
                                                    <FormItem>
                                                        <FormLabel>{t('suppliers.form.fields.problem_record')}</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder={t('suppliers.form.placeholders.problem_record')}
                                                                className="min-h-[100px]"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                {isEditing && (
                                    <TabsContent value="contracts">
                                        <ContractTab />
                                    </TabsContent>
                                )}
                            </div>

                            <div className="flex gap-4 mt-8 justify-end">
                                <Button type="button" variant="outline" onClick={() => navigate("/suppliers")}>
                                    {t('common.actions.cancel', '取消')}
                                </Button>
                                <Button type="submit" disabled={isPending || isLoadingSupplier}>
                                    {isPending ? t('common.actions.saving', '保存中...') : (isEditing ? t('common.actions.save', '保存') : t('suppliers.form.create_btn', '创建供应商'))}
                                </Button>
                            </div>
                        </Tabs>
                    </form>
                </FormProvider>
            )}
        </div>
    )
}
