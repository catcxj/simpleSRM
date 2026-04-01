import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";


export function ChangePasswordDialog({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const passwordSchema = z.object({
        oldPassword: z.string().min(1, t("auth.change_password.old_required")),
        newPassword: z.string().min(6, t("auth.change_password.min_length")),
        confirmPassword: z.string().min(1, t("auth.change_password.confirm_required")),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: t("auth.change_password.mismatch"),
        path: ["confirmPassword"],
    });

    type PasswordFormValues = z.infer<typeof passwordSchema>;

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const mutation = useMutation({
        mutationFn: (data: PasswordFormValues) => api.post("/auth/change-password", data),
        onSuccess: () => {
            toast({
                title: t("auth.change_password.success"),
            });
            setOpen(false);
            form.reset();
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: t("auth.change_password.error"),
                description: t(error.detailedMessage),
            });
        },
    });

    function onSubmit(data: PasswordFormValues) {
        mutation.mutate(data);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("auth.change_password.title")}</DialogTitle>
                    <DialogDescription>
                        {t("settings.security.description")}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="oldPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.change_password.old_password")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.change_password.new_password")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("auth.change_password.confirm_password")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? t("common.actions.saving") : t("common.actions.save")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
