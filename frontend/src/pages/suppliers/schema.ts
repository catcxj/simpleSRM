import { z } from "zod"

export const contactSchema = z.object({
    name: z.string().min(1, "请输入联系人姓名"),
    position: z.string().nullish(),
    phone: z.string().min(1, "请输入联系电话"),
    email: z.string().email("请输入有效的电子邮箱").or(z.literal('')).nullish(),
    isPrimary: z.boolean().default(false),
});

export const qualificationSchema = z.object({
    name: z.string().min(1, "请输入资质证书名称"),
    issuingAuthority: z.string().nullish(),
    certificateNo: z.string().nullish(),
    effectiveDate: z.string().nullish(), // Date string YYYY-MM-DD
    expiryDate: z.string().nullish(),
    attachmentUrl: z.string().nullish(),
});

export const bankInfoSchema = z.object({
    bankName: z.string().min(1, "请输入开户行名称"),
    accountNumber: z.string().min(1, "请输入银行账号"),
    taxpayerType: z.string().nullish(),
});

export const supplierSchema = z.object({
    name: z.string().min(2, { message: "供应商名称至少需要2个字符" }),
    businessType: z.array(z.string()).min(1, { message: "请至少选择一个业务类型" }),
    industry: z.array(z.string()).nullish(),
    status: z.enum(["Draft", "Active", "Suspended", "Blacklisted"]).default("Draft"),

    // Basic Info
    registrationNumber: z.string().min(1, "统一社会信用代码/注册号必填").nullish(),
    legalRepresentative: z.string().nullish(),
    registeredCapital: z.coerce.number().nullish(),
    establishDate: z.string().nullish(),
    companyType: z.string().nullish(),
    address: z.string().nullish(),
    website: z.string().nullish(),

    // Operation Info
    serviceRegion: z.string().nullish(),
    isInLibrary: z.boolean().default(true),
    cooperationYears: z.coerce.number().min(0).default(0).nullish(),
    problemRecord: z.string().nullish(),

    // Nested Arrays
    contacts: z.array(contactSchema).optional(),
    qualifications: z.array(qualificationSchema).optional(),
    bankInfos: z.array(bankInfoSchema).optional(),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>
export type ContactFormValues = z.infer<typeof contactSchema>
export type QualificationFormValues = z.infer<typeof qualificationSchema>
export type BankInfoFormValues = z.infer<typeof bankInfoSchema>
