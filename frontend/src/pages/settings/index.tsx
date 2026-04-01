import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";
import { KeyRound } from "lucide-react";

export default function SettingsPage() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 container mx-auto py-6">
            <h2 className="text-3xl font-bold tracking-tight">{t('app.settings')}</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.notifications.title')}</CardTitle>
                        <CardDescription>{t('settings.notifications.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="email-notifications">{t('settings.notifications.email')}</Label>
                            <Switch id="email-notifications" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="system-notifications">{t('settings.notifications.system')}</Label>
                            <Switch id="system-notifications" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.security.title')}</CardTitle>
                        <CardDescription>{t('settings.security.description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label>{t('settings.security.change_password')}</Label>
                                <p className="text-sm text-muted-foreground">
                                    {t("settings.security.description")}
                                </p>
                            </div>
                            <ChangePasswordDialog>
                                <Button variant="outline" size="sm">
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    {t('settings.security.change_password')}
                                </Button>
                            </ChangePasswordDialog>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('settings.system.title')}</CardTitle>
                        <CardDescription>{t('settings.system.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Version 1.0.0
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
