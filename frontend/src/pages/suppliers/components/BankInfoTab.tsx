import { useFieldArray, useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import { useTranslation } from 'react-i18next';

export function BankInfoTab() {
    const { t } = useTranslation();
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: "bankInfos",
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t('suppliers.tab.bank_info')}</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ bankName: "", accountNumber: "" })}>
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
                                name={`bankInfos.${index}.bankName`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.bank_name')} <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Bank Name" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`bankInfos.${index}.accountNumber`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.account_number')} <span className="text-destructive">*</span></FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Account #" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`bankInfos.${index}.taxpayerType`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('suppliers.fields.taxpayer_type')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Taxpayer Type" />
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
