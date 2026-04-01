import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Search, MoreHorizontal, FileText, Check, ChevronsUpDown } from "lucide-react";

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
    DialogDescription,
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { getProjects, createProject, updateProject, deleteProject, getProjectContracts, Project } from "./service";
import { useTranslation } from "react-i18next";
import api from '@/lib/api';

const projectSchema = z.object({
    code: z.string().min(1, "项目编号必填"),
    name: z.string().min(2, "项目名称至少需要2个字符"),
    projectManager: z.string().optional(),
    status: z.enum(["Active", "Completed", "Suspended"]).default("Active"),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [search, setSearch] = useState("");
    const [viewContractsProjectId, setViewContractsProjectId] = useState<string | null>(null);
    const [managerPopoverOpen, setManagerPopoverOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: projectContracts, isLoading: isLoadingContracts } = useQuery({
        queryKey: ["project-contracts", viewContractsProjectId],
        queryFn: () => getProjectContracts(viewContractsProjectId!),
        enabled: !!viewContractsProjectId,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: getProjects,
    });

    const { data: usersRes } = useQuery({
        queryKey: ["users"],
        queryFn: () => api.get('/users').then(r => r.data)
    });
    const users = Array.isArray(usersRes) ? usersRes : (usersRes?.data || []);

    // Extract projects array from nested response structures
    const rawProjects = data?.data?.data || data?.data || data;
    const projects: Project[] = Array.isArray(rawProjects) ? rawProjects : [];

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
    );

    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema) as any,
        defaultValues: {
            code: "",
            name: "",
            projectManager: "",
            status: "Active",
        },
    });

    const createMutation = useMutation({
        mutationFn: createProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setIsOpen(false);
            form.reset();
            toast({ title: t("common.actions.success"), description: t("projects.actions.create_success") });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: t("common.error"), description: t(err.detailedMessage) });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setIsOpen(false);
            setEditingProject(null);
            form.reset();
            toast({ title: t("common.actions.success"), description: t("projects.actions.update_success") });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: t("common.error"), description: t(err.detailedMessage) });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            toast({ title: t("common.actions.success"), description: t("projects.actions.delete_success") });
        },
        onError: (err: any) => {
            toast({ variant: "destructive", title: t("common.error"), description: t(err.detailedMessage) });
        }
    });

    const onSubmit = (values: ProjectFormValues) => {
        const submitData = {
            ...values,
            projectManager: values.projectManager === "none" ? undefined : values.projectManager,
        };
        if (editingProject) {
            updateMutation.mutate({ id: editingProject.id, data: submitData });
        } else {
            createMutation.mutate(submitData);
        }
    };

    const handleEdit = (project: Project) => {
        setEditingProject(project);
        form.reset({
            code: project.code,
            name: project.name,
            projectManager: project.projectManager || "none",
            status: project.status as "Active" | "Completed" | "Suspended",
        });
        setIsOpen(true);
    };

    const handleAddNew = () => {
        setEditingProject(null);
        form.reset({
            code: "",
            name: "",
            projectManager: "none",
            status: "Active",
        });
        setIsOpen(true);
    };

    return (
        <div className="space-y-6 container mx-auto py-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">{t("projects.title")}</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" /> {t("projects.add")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingProject ? t("projects.edit_title") : t("projects.create_title")}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>{t("projects.fields.code")} <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="PRJ-001" {...field} />
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
                                            <FormLabel>{t("projects.fields.name")} <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Project Alpha" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="projectManager"
                                    render={({ field }: { field: any }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t("projects.fields.manager")}</FormLabel>
                                            <Popover open={managerPopoverOpen} onOpenChange={setManagerPopoverOpen}>
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
                                                            {field.value && field.value !== "none"
                                                                ? users.find(
                                                                    (user: any) => user.name === field.value
                                                                )?.name || field.value
                                                                : t("projects.placeholders.manager") || "选择项目负责人"}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                    <Command>
                                                        <CommandInput placeholder={t("common.actions.search")} />
                                                        <CommandList>
                                                            <CommandEmpty>{t("common.actions.no_results")}</CommandEmpty>
                                                            <CommandGroup>
                                                                <CommandItem
                                                                    value="none"
                                                                    onSelect={() => {
                                                                        form.setValue("projectManager", "none");
                                                                        setManagerPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === "none" ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    无
                                                                </CommandItem>
                                                                {users.map((user: any) => (
                                                                    <CommandItem
                                                                        value={user.name}
                                                                        key={user.id}
                                                                        onSelect={() => {
                                                                            form.setValue("projectManager", user.name);
                                                                            setManagerPopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                user.name === field.value ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {user.name}
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
                                    name="status"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>{t("projects.fields.status")}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t("projects.placeholders.status")} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Active">{t("common.status.Active")}</SelectItem>
                                                    <SelectItem value="Completed">{t("common.status.Completed")}</SelectItem>
                                                    <SelectItem value="Suspended">{t("common.status.Suspended")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                        {createMutation.isPending || updateMutation.isPending ? t("projects.actions.saving") : t("projects.actions.save")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t("projects.search_placeholder")}
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("projects.fields.code")}</TableHead>
                            <TableHead>{t("projects.fields.name")}</TableHead>
                            <TableHead>{t("projects.fields.manager")}</TableHead>
                            <TableHead>{t("projects.fields.status")}</TableHead>
                            <TableHead className="text-center">{t("projects.view_contracts", "查看合同")}</TableHead>
                            <TableHead className="w-[100px] text-right">{t("projects.fields.actions", "操作")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    {t("common.actions.loading")}
                                </TableCell>
                            </TableRow>
                        ) : filteredProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    {t("common.actions.no_data")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProjects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">{project.code}</TableCell>
                                    <TableCell>{project.name}</TableCell>
                                    <TableCell>{project.projectManager || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={project.status === "Active" ? "default" : "secondary"}>
                                            {t(`common.status.${project.status}`, project.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewContractsProjectId(project.id)}
                                            className="h-8 w-auto px-2 flex items-center gap-1.5 justify-center mx-auto"
                                            title={t("projects.view_contracts")}
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                                {project._count?.contracts || 0}
                                            </span>
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t("projects.fields.actions")}</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(project)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> {t("common.actions.edit")}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => {
                                                        if (confirm(t("common.actions.confirm_delete"))) {
                                                            deleteMutation.mutate(project.id);
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

            <Dialog open={!!viewContractsProjectId} onOpenChange={(open) => !open && setViewContractsProjectId(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{t("projects.contract_history", "合同历史记录")}</DialogTitle>
                        <DialogDescription></DialogDescription>
                    </DialogHeader>
                    {isLoadingContracts ? (
                        <div className="py-8 text-center">{t("common.actions.loading")}</div>
                    ) : (
                        <div className="rounded-md border mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("contracts.fields.name")}</TableHead>
                                        <TableHead>{t("contracts.fields.supplier")}</TableHead>
                                        <TableHead>{t("contracts.fields.amount")} (万元)</TableHead>
                                        <TableHead>{t("contracts.fields.signed_at")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(projectContracts?.data || projectContracts)?.map((contract: any) => (
                                        <TableRow key={contract.id}>
                                            <TableCell className="font-medium">{contract.name}</TableCell>
                                            <TableCell>{contract.supplier?.name || "-"}</TableCell>
                                            <TableCell>{Number(contract.amount).toFixed(2)}</TableCell>
                                            <TableCell>{new Date(contract.signedAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!(projectContracts?.data || projectContracts) || (projectContracts?.data || projectContracts).length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                {t("common.actions.no_data")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
