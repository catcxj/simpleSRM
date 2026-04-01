import { useFieldArray, useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus } from "lucide-react"
import { useTranslation } from 'react-i18next';

export function ContactTab() {
    const { t } = useTranslation();
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "contacts",
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t('suppliers.form.tabs.contact')}</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", position: "", phone: "", email: "", isPrimary: false })}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('common.actions.add')}
                </Button>
            </div>

            {fields.map((field, index) => (
                <Card key={field.id}>
                    <CardContent className="pt-6 relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-destructive"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <FormField
                                control={control}
                                name={`contacts.${index}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.contact_person')} <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} placeholder="Name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`contacts.${index}.position`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.position', '职务')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} placeholder="Position" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`contacts.${index}.phone`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.phone')} <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} placeholder="Phone" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`contacts.${index}.email`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.email')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ""} placeholder="Email" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`contacts.${index}.isPrimary`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 mt-8">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            {t('suppliers.fields.primary_contact')}
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}

            {fields.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                    {t('common.no_data')}
                </div>
            )}
        </div>
    )
}
