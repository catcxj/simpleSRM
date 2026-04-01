import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

export default function LoginPage() {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const loginResult: any = await api.post('/auth/login', { username, password });
            const token = loginResult.data?.access_token;
            
            if (!token) {
                throw new Error('Access token missing in response');
            }

            const profileResult: any = await api.get('/auth/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const user = profileResult.data;

            login(token, user);
            navigate('/');
        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t('common.error', '错误'),
                description: t(error.detailedMessage) || t('login.failed_message'),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center">{t('login.title')}</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <Label htmlFor="username">{t('login.username')}</Label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">{t('login.password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t('login.logging_in') : t('login.submit')}
                    </Button>
                </form>
            </div>
        </div>
    );
}
