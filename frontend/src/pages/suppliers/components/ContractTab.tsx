import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getSupplierContracts } from "../service";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export function ContractTab() {
    const { t } = useTranslation();
    const { id } = useParams();

    const { data: contracts, isLoading } = useQuery({
        queryKey: ["supplier-contracts", id],
        queryFn: () => getSupplierContracts(id!),
        enabled: !!id,
    });

    if (isLoading) {
        return <div className="p-4 text-center">{t("common.actions.loading")}</div>;
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("contracts.fields.code", "合同编号")}</TableHead>
                                <TableHead>{t("contracts.fields.name", "合同名称")}</TableHead>
                                <TableHead>{t("contracts.fields.project", "关联项目")}</TableHead>
                                <TableHead>{t("contracts.fields.amount", "合同金额")} (万元)</TableHead>
                                <TableHead>{t("contracts.fields.signed_at", "签订时间")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contracts && contracts.length > 0 ? (
                                contracts.map((contract: any) => (
                                    <TableRow key={contract.id}>
                                        <TableCell className="font-medium">{contract.code}</TableCell>
                                        <TableCell>{contract.name}</TableCell>
                                        <TableCell>{contract.project?.name || "-"}</TableCell>
                                        <TableCell>{Number(contract.amount).toFixed(2)} 万元</TableCell>
                                        <TableCell>{new Date(contract.signedAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        {t("common.actions.no_data")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
