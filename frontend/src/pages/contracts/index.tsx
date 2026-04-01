import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, Import, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';

import { getContracts, createContract, updateContract, deleteContract, Contract } from "./service";
import { getProjects } from "../projects/service";
import { getSuppliers } from "../suppliers/service";

import { useTranslation } from "react-i18next";

const contractSchema = z.object({
    code: z.string().optional(),
    name: z.string().min(2, "合同名称至少需要2个字符"),
    amount: z.coerce.number().min(0, "金额必须为正数").optional().or(z.literal(0)).nullable(),
    signedAt: z.string().optional().or(z.literal("")).nullable(),
    projectId: z.string().min(1, "请选择所属项目"),
    supplierId: z.string().min(1, "请选择供应商"),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export default function ContractsPage() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [search, setSearch] = useState("");
    const [supplierOpen, setSupplierOpen] = useState(false);
    const [projectOpen, setProjectOpen] = useState(false);
    const queryClient = useQueryClient();
    const { hasPermission } = useAuthStore();

    const { data, isLoading } = useQuery({
        queryKey: ["contracts"],
        queryFn: getContracts,
    });

    // Fetch projects and suppliers for dropdowns
    const { data: projectsData } = useQuery({
        queryKey: ["projects", "all"],
        queryFn: () => getProjects({ limit: 1000 })
    });
    const { data: suppliersData } = useQuery({
        queryKey: ["suppliers", "all"],
        queryFn: () => getSuppliers({ limit: 1000 })
    });

    // Helper to safely extract array from potentially wrapped or paginated response
    const extractArray = (response: any) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        // Check for double wrapping: { code, data: { data: [...] } }
        if (Array.isArray(response.data?.data)) return response.data.data;
        // Check for single wrapping: { data: [...] } or { ...params, data: [...] }
        if (Array.isArray(response.data)) return response.data;
        return [];
    };

    const contracts: Contract[] = extractArray(data);
    const projects = extractArray(projectsData);
    const suppliers: any[] = extractArray(suppliersData);
    const activeSuppliers = suppliers.filter(s => s.status === 'Active');

    const filteredContracts = contracts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    const form = useForm<ContractFormValues>({
        resolver: zodResolver(contractSchema) as any,
        defaultValues: {
            code: "",
            name: "",
            amount: 0,
            signedAt: "",
            projectId: "",
            supplierId: "",
        },
    });

    const createMutation = useMutation({
        mutationFn: createContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
            setIsOpen(false);
            form.reset();
            toast({ title: t("common.actions.success"), description: t("contracts.actions.create_success") });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: t("common.error"), description: t(err.detailedMessage) });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
            setIsOpen(false);
            setEditingContract(null);
            form.reset();
            toast({ title: t("common.actions.success"), description: t("contracts.actions.update_success") });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: t("common.error"), description: t(err.detailedMessage) });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
            toast({ title: t("common.actions.success"), description: t("contracts.actions.delete_success") });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: t("common.error"), description: t(err.detailedMessage) });
        }
    });

    const onSubmit = (values: ContractFormValues) => {
        // Ensure date is ISO
        const payload = {
            ...values,
            signedAt: values.signedAt ? new Date(values.signedAt).toISOString() : null,
        };

        if (editingContract) {
            updateMutation.mutate({ id: editingContract.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleEdit = (contract: Contract) => {
        setEditingContract(contract);
        form.reset({
            code: contract.code,
            name: contract.name,
            amount: contract.amount || 0,
            signedAt: contract.signedAt ? new Date(contract.signedAt).toISOString().split('T')[0] : "",
            projectId: contract.projectId,
            supplierId: contract.supplierId,
        });
        setIsOpen(true);
    };

    const handleAddNew = () => {
        setEditingContract(null);
        form.reset({
            code: "",
            name: "",
            amount: 0,
            signedAt: "",
            projectId: "",
            supplierId: "",
        });
        setIsOpen(true);
    };

    return (
        <div className="space-y-6 container mx-auto py-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">{t("contracts.title")}</h2>
                <div className="flex gap-2">
                    {hasPermission('write', 'contracts') && (
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
                                        const res = await fetch('/api/contracts/import/file', {
                                            method: 'POST',
                                            headers: { Authorization: `Bearer ${token}` },
                                            body: formData,
                                        });
                                        if (res.ok) {
                                            const result = await res.json();
                                            const payload = result.data || result;
                                            if (payload.errors && payload.errors.length > 0) {
                                                alert(`⚠️ 导入已完成：\n成功导入 ${payload.success} 条，失败 ${payload.failed} 条。`);
                                            } else {
                                                alert(`✅ 全部导入成功！共录入 ${payload.success} 条合同记录。`);
                                            }
                                            queryClient.invalidateQueries({ queryKey: ['contracts'] });
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
                        </>
                    )}
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleAddNew}>
                                <Plus className="mr-2 h-4 w-4" /> {t("contracts.add")}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingContract ? t("contracts.edit_title") : t("contracts.create_title")}</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="code"
                                            render={({ field }: { field: any }) => (
                                                <FormItem>
                                                    <FormLabel>{t("contracts.fields.code")}</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder={t("contracts.placeholders.code_auto", "留空将按项目自动生成")} {...field} disabled={!!editingContract} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }: { field: any }) => (
                                                <FormItem>
                                                    <FormLabel>{t("contracts.fields.name")} <span className="text-destructive">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Agreement X" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }: { field: any }) => (
                                                <FormItem>
                                                    <FormLabel>{t("contracts.fields.amount")} (万元)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="signedAt"
                                            render={({ field }: { field: any }) => (
                                                <FormItem>
                                                    <FormLabel>{t("contracts.fields.signed_at")}</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="projectId"
                                        render={({ field }: { field: any }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>{t("contracts.fields.project")} <span className="text-destructive">*</span></FormLabel>
                                                <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? projects.find(
                                                                        (p: any) => p.id === field.value
                                                                    )?.name
                                                                    : t("contracts.placeholders.project", "选择所属项目")}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                                                        <Command>
                                                            <CommandInput placeholder={t("projects.search_placeholder", "搜索项目...")} />
                                                            <CommandList className="max-h-[200px]">
                                                                <CommandEmpty>{t("common.actions.no_data", "No results found.")}</CommandEmpty>
                                                                <CommandGroup>
                                                                    {projects.map((p: any) => (
                                                                        <CommandItem
                                                                            value={p.name + " " + p.code}
                                                                            key={p.id}
                                                                            onSelect={() => {
                                                                                form.setValue("projectId", p.id)
                                                                                setProjectOpen(false)
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    p.id === field.value
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {p.name} ({p.code})
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="supplierId"
                                        render={({ field }: { field: any }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>{t("contracts.fields.supplier")} <span className="text-destructive">*</span></FormLabel>
                                                <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    "w-full justify-between",
                                                                    !field.value && "text-muted-foreground"
                                                                )}
                                                            >
                                                                {field.value
                                                                    ? suppliers.find(
                                                                        (s: any) => s.id === field.value
                                                                    )?.name
                                                                    : t("contracts.placeholders.supplier", "选择供应商")}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                                                        <Command>
                                                            <CommandInput placeholder={t("suppliers.search_placeholder", "搜索供应商...")} />
                                                            <CommandList className="max-h-[200px]">
                                                                <CommandEmpty>{t("common.actions.no_data", "No results found.")}</CommandEmpty>
                                                                <CommandGroup>
                                                                    {activeSuppliers.map((s: any) => (
                                                                        <CommandItem
                                                                            value={s.name}
                                                                            key={s.id}
                                                                            onSelect={() => {
                                                                                form.setValue("supplierId", s.id)
                                                                                setSupplierOpen(false)
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    s.id === field.value
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {s.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter>
                                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                            {createMutation.isPending || updateMutation.isPending ? t("contracts.actions.saving") : t("contracts.actions.save")}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t("contracts.search_placeholder")}
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("contracts.fields.code")}</TableHead>
                            <TableHead>{t("contracts.fields.name")}</TableHead>
                            <TableHead>{t("contracts.fields.project")}</TableHead>
                            <TableHead>{t("contracts.fields.supplier")}</TableHead>
                            <TableHead>{t("contracts.fields.amount")} (万元)</TableHead>
                            <TableHead>{t("contracts.fields.signed_at")}</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    {t("common.actions.loading")}
                                </TableCell>
                            </TableRow>
                        ) : filteredContracts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    {t("common.actions.no_data")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredContracts.map((contract) => (
                                <TableRow key={contract.id}>
                                    <TableCell className="font-medium">{contract.code}</TableCell>
                                    <TableCell>{contract.name}</TableCell>
                                    <TableCell>{contract.project?.name || "-"}</TableCell>
                                    <TableCell>{contract.supplier?.name || "-"}</TableCell>
                                    <TableCell>{contract.amount != null ? Number(contract.amount).toFixed(2) + " 万元" : "-"}</TableCell>
                                    <TableCell>{contract.signedAt ? format(new Date(contract.signedAt), "yyyy-MM-dd") : "-"}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t("contracts.fields.actions")}</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(contract)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> {t("common.actions.edit")}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        if (confirm(t("common.actions.confirm_delete"))) {
                                                            deleteMutation.mutate(contract.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> {t("common.actions.delete")}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
