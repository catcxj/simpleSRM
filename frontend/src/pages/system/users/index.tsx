import { useState, useEffect } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    role?: { id?: string, name: string };
    unit?: string;
}

export default function UsersPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [availableRoles, setAvailableRoles] = useState<{ id: string, name: string }[]>([]);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', name: '', password: '', roleId: '', email: '', phone: '', unit: '' });
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editUser, setEditUser] = useState({ id: '', username: '', name: '', password: '', roleId: '', email: '', phone: '', unit: '' });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [search]); // simplified fetch on search change

    const fetchRoles = async () => {
        try {
            const res: any = await api.get('/roles');
            setAvailableRoles(res.data || []);
        } catch (error) {
            console.error('Failed to fetch roles', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const query = search ? `?search=${search}` : '';
            const res: any = await api.get(`/users${query}`);
            setUsers(res.data || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleCreateUser = async () => {
        try {
            const payload: any = {
                username: newUser.username,
                name: newUser.name,
                password: newUser.password,
                email: newUser.email,
                phone: newUser.phone,
                unit: newUser.unit,
            };
            if (newUser.roleId) {
                payload.role = { connect: { id: newUser.roleId } };
            }

            await api.post('/users', payload);
            setIsCreateOpen(false);
            fetchUsers();
            setNewUser({ username: '', name: '', password: '', roleId: '', email: '', phone: '', unit: '' });
        } catch (error: any) {
            console.error('Failed to create user', error);
            alert(error.response?.data?.msg || t('common.error'));
        }
    }

    const handleEditUser = async () => {
        try {
            const payload: any = {
                name: editUser.name,
                email: editUser.email,
                phone: editUser.phone,
                unit: editUser.unit,
            };
            if (editUser.password) {
                payload.password = editUser.password;
            }
            if (editUser.roleId) {
                payload.role = { connect: { id: editUser.roleId } };
            } else {
                payload.role = { disconnect: true };
            }

            await api.patch(`/users/${editUser.id}`, payload);
            setIsEditOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error('Failed to update user', error);
            alert(error.response?.data?.msg || t('common.error'));
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('system.users.confirm_delete'))) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error: any) {
            console.error('Failed to delete user', error);
            alert(error.response?.data?.msg || t('common.error'));
        }
    }

    const handleToggleStatus = async (user: User) => {
        const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
        try {
            await api.patch(`/users/${user.id}`, { status: newStatus });
            fetchUsers();
        } catch (error: any) {
            console.error('Failed to toggle user status', error);
            alert(error.response?.data?.msg || t('common.error'));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">{t('system.users.title')}</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => {
                            setNewUser({ username: '', name: '', password: '', roleId: '', email: '', phone: '', unit: '' });
                            setIsCreateOpen(true);
                        }}>
                            <Plus className="mr-2 h-4 w-4" /> {t('system.users.add')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('system.users.add')}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="text-right">
                                    {t('system.users.fields.username')} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="username"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    {t('system.users.fields.name')} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="password" className="text-right">
                                    {t('login.password')} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    {t('suppliers.fields.email')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">
                                    {t('suppliers.fields.phone')}
                                </Label>
                                <Input
                                    id="phone"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="unit" className="text-right">
                                    {t('system.users.fields.unit')}
                                </Label>
                                <Input
                                    id="unit"
                                    value={newUser.unit}
                                    onChange={(e) => setNewUser({ ...newUser, unit: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">
                                    {t('system.users.fields.role')}
                                </Label>
                                <Select onValueChange={(val) => setNewUser({ ...newUser, roleId: val })} value={newUser.roleId}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder={t('system.users.search_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRoles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleCreateUser}>{t('common.actions.save')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('system.users.search_placeholder')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('system.users.fields.username')}</TableHead>
                            <TableHead>{t('system.users.fields.name')}</TableHead>
                            <TableHead>{t('system.users.fields.unit')}</TableHead>
                            <TableHead>{t('system.users.fields.role')}</TableHead>
                            <TableHead>{t('system.users.fields.status')}</TableHead>
                            <TableHead className="text-right">{t('system.users.fields.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.username}</TableCell>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.unit || '-'}</TableCell>
                                <TableCell>{user.role?.name || '-'}</TableCell>
                                <TableCell>{t(`common.status.${user.status}`)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)} title={user.status === 'Active' ? '停用' : '启用'}>
                                        {user.status === 'Active' ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        setEditUser({
                                            id: user.id,
                                            username: user.username,
                                            name: user.name,
                                            password: '',
                                            roleId: user.role?.id || '',
                                            email: user.email || '',
                                            phone: user.phone || '',
                                            unit: user.unit || ''
                                        });
                                        setIsEditOpen(true);
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
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
                            <Label htmlFor="edit-username" className="text-right">
                                {t('system.users.fields.username')}
                            </Label>
                            <Input
                                id="edit-username"
                                value={editUser.username}
                                disabled
                                className="col-span-3 bg-muted"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                                {t('system.users.fields.name')} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                value={editUser.name}
                                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-password" className="text-right">
                                {t('login.password')}
                            </Label>
                            <Input
                                id="edit-password"
                                type="password"
                                placeholder="..."
                                value={editUser.password}
                                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right">
                                {t('suppliers.fields.email')}
                            </Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editUser.email}
                                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-phone" className="text-right">
                                {t('suppliers.fields.phone')}
                            </Label>
                            <Input
                                id="edit-phone"
                                value={editUser.phone}
                                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-unit" className="text-right">
                                {t('system.users.fields.unit')}
                            </Label>
                            <Input
                                id="edit-unit"
                                value={editUser.unit}
                                onChange={(e) => setEditUser({ ...editUser, unit: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right">
                                {t('system.users.fields.role')}
                            </Label>
                            <Select onValueChange={(val) => setEditUser({ ...editUser, roleId: val !== 'none' ? val : '' })} value={editUser.roleId || 'none'}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder={t('system.users.search_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">无</SelectItem>
                                    {availableRoles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleEditUser}>{t('common.actions.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
