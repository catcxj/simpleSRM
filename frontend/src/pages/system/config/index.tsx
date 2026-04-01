import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from 'react-i18next';
import { AttributeManager } from './components/AttributeManager';
import { SystemDictionaryManager } from './components/SystemDictionaryManager';
import { PeriodConfig } from './components/PeriodConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConfigPage() {
    const { t } = useTranslation();
    const [, setTab] = useState('supplier_attributes');

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('system.config.title')}</h1>
                    <p className="text-muted-foreground">{t('system.config.subtitle')}</p>
                </div>
            </div>

            <Tabs defaultValue="supplier_attributes" className="w-full" onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="supplier_attributes">{t('system.config.tabs.supplier_attribute')}</TabsTrigger>
                    <TabsTrigger value="system_settings">{t('system.config.tabs.other')}</TabsTrigger>
                </TabsList>

                <TabsContent value="supplier_attributes" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('system.config.supplier_data_dictionary', '字典配置 (Dictionary)')}</CardTitle>
                            <CardDescription>{t('system.config.supplier_data_dictionary_desc', '配置供应商相关的基础选项值。')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <SystemDictionaryManager
                                category="SupplierAttribute"
                                configKey="BusinessType"
                                title={t('suppliers.fields.business_type', '业务类别')}
                                placeholder="输入业务类别并回车..."
                            />
                            <SystemDictionaryManager
                                category="SupplierAttribute"
                                configKey="Industry"
                                title={t('suppliers.form.fields.industry', '行业领域')}
                                placeholder="输入行业领域并回车..."
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('system.config.supplier_fields_title')}</CardTitle>
                            <CardDescription>{t('system.config.supplier_fields_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AttributeManager targetEntity="Supplier" />
                        </CardContent>
                    </Card>

                    {/* <Card>
                        <CardHeader>
                            <CardTitle>{t('system.config.other_entities')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AttributeManager targetEntity="Project" />
                        </CardContent>
                    </Card> */}
                </TabsContent>



                <TabsContent value="system_settings" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('system.config.evaluation_settings')}</CardTitle>
                            <CardDescription>{t('system.config.evaluation_settings_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PeriodConfig />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
