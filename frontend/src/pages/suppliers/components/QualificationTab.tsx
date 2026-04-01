import { useFieldArray, useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import { useTranslation } from 'react-i18next';

export function QualificationTab() {
    const { t } = useTranslation();
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "qualifications",
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t('suppliers.form.tabs.business')}</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "" })}>
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
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={`qualifications.${index}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.qualification_name')} <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="License Name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`qualifications.${index}.certificateNo`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.certificate_no')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Cert No." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`qualifications.${index}.effectiveDate`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.effective_date')}</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`qualifications.${index}.expiryDate`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.expiry_date')}</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
