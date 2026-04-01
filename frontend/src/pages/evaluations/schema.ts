import { z } from "zod"

export interface EvaluationTask {
    id: string
    year: number
    deadline: string
    status: 'Pending' | 'Completed'
    supplierName: string
    supplierId: string
    score?: number
    grade?: string
}

export const evaluationSubmissionSchema = z.object({
    recordId: z.string(),
    grade: z.string().optional(),
    details: z.array(z.object({
        indicatorKey: z.string(),
        score: z.number().min(0).max(100),
    })).optional(),
    problem: z.string().optional(),
    suggestion: z.string().optional(),
})

export type EvaluationSubmission = z.infer<typeof evaluationSubmissionSchema>
