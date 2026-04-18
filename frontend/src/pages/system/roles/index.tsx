import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: { resource: string; action: string }[];
    businessTypes?: string; // stringified JSON array
}

export default function RolesPage() {
    const { t } = useTranslation();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[], businessTypes: [] as string[] });
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editRole, setEditRole] = useState({ id: '', name: '', description: '', permissions: [] as string[], businessTypes: [] as string[] });
    const { token } = useAuthStore();

    const AVAILABLE_PERMISSIONS = [
        { label: t('system.roles.permissions.read_suppliers'), value: 'read:suppliers' },
        { label: t('system.roles.permissions.write_suppliers'), value: 'write:suppliers' },
        { label: t('system.roles.permissions.read_projects'), value: 'read:projects' },
        { label: t('system.roles.permissions.write_projects'), value: 'write:projects' },
        { label: t('system.roles.permissions.read_contracts'), value: 'read:contracts' },
        { label: t('system.roles.permissions.write_contracts'), value: 'write:contracts' },
        { label: t('system.roles.permissions.read_evaluations'), value: 'read:evaluations' },
        { label: t('system.roles.permissions.write_evaluations'), value: 'write:evaluations' },
        { label: t('system.roles.permissions.read_suppliers_evaluation'), value: 'read:suppliers-evaluation' },
        { label: t('system.roles.permissions.write_suppliers_evaluation'), value: 'write:suppliers-evaluation' },
        { label: t('system.roles.permissions.read_users'), value: 'read:users' },
        { label: t('system.roles.permissions.write_users'), value: 'write:users' },
        { label: t('system.roles.permissions.read_roles'), value: 'read:roles' },
        { label: t('system.roles.permissions.write_roles'), value: 'write:roles' },
    ];

    const { data: configData } = useQuery({
        queryKey: ['system-config', 'SupplierAttribute'],
        queryFn: async () => {
            const res = await fetch('/api/system-config?category=SupplierAttribute', {
                headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
            });
            const json = await res.json();
            return Array.isArray(json) ? json : (json?.data || []);
        }
    });

    const AVAILABLE_BUSINESS_TYPES: { label: string, value: string }[] = configData
        ?.filter((c: any) => c.key === 'BusinessType')
        ?.map((c: any) => ({ label: c.value, value: c.value })) || [];

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/roles', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const result = await res.json();
                setRoles(result.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch roles', error);
        }
    };

    const handleCreateRole = async () => {
        try {
            const res = await fetch('/api/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newRole,
                    businessTypes: JSON.stringify(newRole.businessTypes)
                }),
            });
            if (res.ok) {
                setIsCreateOpen(false);
                fetchRoles();
                setNewRole({ name: '', description: '', permissions: [] as string[], businessTypes: [] as string[] });
            } else {
                alert(t('common.error'));
            }
        } catch (error) {
            console.error('Failed to create role', error);
        }
    };

    const handleEditRole = async () => {
        try {
            const res = await fetch(`/api/roles/${editRole.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: editRole.name,
                    description: editRole.description,
                    permissions: editRole.permissions,
                    businessTypes: JSON.stringify(editRole.businessTypes)
                }),
            });
            if (res.ok) {
                setIsEditOpen(false);
                fetchRoles();
            } else {
                alert(t('common.error'));
            }
        } catch (error) {
            console.error('Failed to update role', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('system.roles.confirm_delete'))) return;
        try {
            const res = await fetch(`/api/roles/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchRoles();
            }
        } catch (error) {
            console.error('Failed to delete role', error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">{t('system.roles.title')}</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => {
                            setNewRole({ name: '', description: '', permissions: [] as string[], businessTypes: [] as string[] });
                            setIsCreateOpen(true);
                        }}>
                            <Plus className="mr-2 h-4 w-4" /> {t('system.roles.add')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('system.roles.add')}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    {t('system.roles.fields.name')}
                                </Label>
                                <Input
                                    id="name"
                                    value={newRole.name}
                                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    {t('system.roles.fields.description')}
                                </Label>
                                <Input
                                    id="description"
                                    value={newRole.description}
                                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right mt-2">{t('system.roles.permissions.title')}</Label>
                                <div className="col-span-3 grid grid-cols-2 gap-2">
                                    {AVAILABLE_PERMISSIONS.map(perm => (
                                        <div key={perm.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`new-perm-${perm.value}`}
                                                checked={newRole.permissions.includes(perm.value)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setNewRole({ ...newRole, permissions: [...newRole.permissions, perm.value] });
                                                    } else {
                                                        setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== perm.value) });
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`new-perm-${perm.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {perm.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <div className="text-right mt-2 flex flex-col items-end">
                                    <Label>{t('system.roles.fields.business_types', '适用业务类型')}</Label>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox
                                            id="create-select-all-bt"
                                            checked={AVAILABLE_BUSINESS_TYPES.length > 0 && newRole.businessTypes.length === AVAILABLE_BUSINESS_TYPES.length}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setNewRole({ ...newRole, businessTypes: AVAILABLE_BUSINESS_TYPES.map(t => t.value) });
                                                } else {
                                                    setNewRole({ ...newRole, businessTypes: [] });
                                                }
                                            }}
                                        />
                                        <label htmlFor="create-select-all-bt" className="text-sm text-muted-foreground cursor-pointer">
                                            {t('common.actions.select_all', '全选')}
                                        </label>
                                    </div>
                                </div>
                                <div className="col-span-3 grid grid-cols-2 gap-2">
                                    {AVAILABLE_BUSINESS_TYPES.map(type => (
                                        <div key={type.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`new-bt-${type.value}`}
                                                checked={newRole.businessTypes.includes(type.value)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setNewRole({ ...newRole, businessTypes: [...newRole.businessTypes, type.value] });
                                                    } else {
                                                        setNewRole({ ...newRole, businessTypes: newRole.businessTypes.filter((t: string) => t !== type.value) });
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`new-bt-${type.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {type.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreateRole}>{t('common.actions.save')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('system.roles.fields.name')}</TableHead>
                            <TableHead>{t('system.roles.fields.description')}</TableHead>
                            <TableHead className="text-right">{t('system.roles.fields.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium">{role.name}</TableCell>
                                <TableCell>{role.description}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        let parsedBusinessTypes: string[] = [];
                                        try {
                                            if (role.businessTypes) parsedBusinessTypes = JSON.parse(role.businessTypes);
                                        } catch (e) { }

                                        setEditRole({
                                            id: role.id,
                                            name: role.name,
                                            description: role.description,
                                            permissions: role.permissions?.map(p => `${p.action}:${p.resource}`) || [],
                                            businessTypes: parsedBusinessTypes
                                        });
                                        setIsEditOpen(true);
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(role.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {roles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    {t('common.actions.no_data')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('common.actions.edit')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                                {t('system.roles.fields.name')}
                            </Label>
                            <Input
                                id="edit-name"
                                value={editRole.name}
                                onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-description" className="text-right">
                                {t('system.roles.fields.description')}
                            </Label>
                            <Input
                                id="edit-description"
                                value={editRole.description}
                                onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right mt-2">{t('system.roles.permissions.title')}</Label>
                            <div className="col-span-3 grid grid-cols-2 gap-2">
                                {AVAILABLE_PERMISSIONS.map(perm => (
                                    <div key={perm.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-perm-${perm.value}`}
                                            checked={editRole.permissions.includes(perm.value)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setEditRole({ ...editRole, permissions: [...editRole.permissions, perm.value] });
                                                } else {
                                                    setEditRole({ ...editRole, permissions: editRole.permissions.filter(p => p !== perm.value) });
                                                }
                                            }}
                                        />
                                        <label htmlFor={`edit-perm-${perm.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {perm.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="text-right mt-2 flex flex-col items-end">
                                <Label>{t('system.roles.fields.business_types', '适用业务类型')}</Label>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Checkbox
                                        id="edit-select-all-bt"
                                        checked={AVAILABLE_BUSINESS_TYPES.length > 0 && editRole.businessTypes.length === AVAILABLE_BUSINESS_TYPES.length}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setEditRole({ ...editRole, businessTypes: AVAILABLE_BUSINESS_TYPES.map(t => t.value) });
                                            } else {
                                                setEditRole({ ...editRole, businessTypes: [] });
                                            }
                                        }}
                                    />
                                    <label htmlFor="edit-select-all-bt" className="text-sm text-muted-foreground cursor-pointer">
                                        {t('common.actions.select_all', '全选')}
                                    </label>
                                </div>
                            </div>
                            <div className="col-span-3 grid grid-cols-2 gap-2">
                                {AVAILABLE_BUSINESS_TYPES.map(type => (
                                    <div key={type.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`edit-bt-${type.value}`}
                                            checked={editRole.businessTypes.includes(type.value)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setEditRole({ ...editRole, businessTypes: [...editRole.businessTypes, type.value] });
                                                } else {
                                                    setEditRole({ ...editRole, businessTypes: editRole.businessTypes.filter((t: string) => t !== type.value) });
                                                }
                                            }}
                                        />
                                        <label htmlFor={`edit-bt-${type.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {type.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleEditRole}>{t('common.actions.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
