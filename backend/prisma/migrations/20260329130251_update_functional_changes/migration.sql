/*
  Warnings:

  - You are about to drop the `indicator_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `created_at` on the `system_configs` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `system_configs` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `system_configs` table. All the data in the column will be lost.
  - You are about to drop the column `contact_name` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `credit_code` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `is_in_library` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `qualifications` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `service_country` on the `suppliers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "indicator_configs_year_key_key";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "end_date" DATETIME;
ALTER TABLE "projects" ADD COLUMN "start_date" DATETIME;
ALTER TABLE "projects" ADD COLUMN "type" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN "business_types" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "indicator_configs";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "supplier_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "supplier_contacts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "supplier_qualifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuing_authority" TEXT,
    "certificate_no" TEXT,
    "effective_date" DATETIME,
    "expiry_date" DATETIME,
    "attachment_url" TEXT,
    CONSTRAINT "supplier_qualifications_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "supplier_bank_infos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplier_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "taxpayer_type" TEXT,
    CONSTRAINT "supplier_bank_infos_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evaluation_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "indicators" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "attribute_definitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "target_entity" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "attribute_values" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_id" TEXT NOT NULL,
    "attribute_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_definitions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attribute_values_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_dictionaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "parent_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "system_dictionaries_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "system_dictionaries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "code" TEXT,
    CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_evaluation_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'Yearly',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "deadline" DATETIME NOT NULL,
    "template_id" TEXT,
    "project_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "evaluation_tasks_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "evaluation_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evaluation_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_evaluation_tasks" ("created_at", "deadline", "id", "period", "status", "updated_at", "year") SELECT "created_at", "deadline", "id", "period", "status", "updated_at", "year" FROM "evaluation_tasks";
DROP TABLE "evaluation_tasks";
ALTER TABLE "new_evaluation_tasks" RENAME TO "evaluation_tasks";
CREATE TABLE "new_evaluation_details" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "record_id" TEXT NOT NULL,
    "indicator_key" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "comment" TEXT,
    CONSTRAINT "evaluation_details_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "evaluation_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_evaluation_details" ("id", "indicator_key", "record_id", "score", "weight") SELECT "id", "indicator_key", "record_id", "score", "weight" FROM "evaluation_details";
DROP TABLE "evaluation_details";
ALTER TABLE "new_evaluation_details" RENAME TO "evaluation_details";
CREATE INDEX "evaluation_details_record_id_idx" ON "evaluation_details"("record_id");
CREATE TABLE "new_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "amount" REAL,
    "signed_at" DATETIME,
    "settlement_method" TEXT,
    "payment_ratio" TEXT,
    "duration_days" INTEGER,
    "warranty_months" INTEGER,
    "project_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "contracts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_contracts" ("amount", "code", "created_at", "deleted_at", "id", "name", "project_id", "signed_at", "supplier_id", "updated_at") SELECT "amount", "code", "created_at", "deleted_at", "id", "name", "project_id", "signed_at", "supplier_id", "updated_at" FROM "contracts";
DROP TABLE "contracts";
ALTER TABLE "new_contracts" RENAME TO "contracts";
CREATE UNIQUE INDEX "contracts_code_key" ON "contracts"("code");
CREATE INDEX "contracts_project_id_idx" ON "contracts"("project_id");
CREATE INDEX "contracts_supplier_id_idx" ON "contracts"("supplier_id");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employee_id" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "last_login" DATETIME,
    "unit" TEXT,
    "department_id" TEXT,
    "role_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("created_at", "email", "id", "name", "password", "phone", "role_id", "status", "unit", "updated_at", "username") SELECT "created_at", "email", "id", "name", "password", "phone", "role_id", "status", "unit", "updated_at", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");
CREATE TABLE "new_system_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_system_configs" ("category", "description", "id", "is_active", "key", "value") SELECT "category", "description", "id", "is_active", "key", "value" FROM "system_configs";
DROP TABLE "system_configs";
ALTER TABLE "new_system_configs" RENAME TO "system_configs";
CREATE INDEX "system_configs_category_idx" ON "system_configs"("category");
CREATE UNIQUE INDEX "system_configs_category_key_value_key" ON "system_configs"("category", "key", "value");
CREATE TABLE "new_suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "registration_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "legal_representative" TEXT,
    "registered_capital" REAL,
    "establish_date" DATETIME,
    "company_type" TEXT,
    "business_type" TEXT NOT NULL,
    "industry" TEXT,
    "service_region" TEXT,
    "address" TEXT,
    "website" TEXT,
    "contact_info" TEXT,
    "cooperation_years" INTEGER NOT NULL DEFAULT 0,
    "problem_record" TEXT,
    "created_by_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "suppliers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_suppliers" ("address", "business_type", "contact_info", "cooperation_years", "created_at", "deleted_at", "id", "industry", "name", "problem_record", "status", "updated_at", "website") SELECT "address", "business_type", "contact_info", "cooperation_years", "created_at", "deleted_at", "id", "industry", "name", "problem_record", "status", "updated_at", "website" FROM "suppliers";
DROP TABLE "suppliers";
ALTER TABLE "new_suppliers" RENAME TO "suppliers";
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");
CREATE UNIQUE INDEX "suppliers_registration_number_key" ON "suppliers"("registration_number");
CREATE INDEX "suppliers_business_type_idx" ON "suppliers"("business_type");
CREATE INDEX "suppliers_status_idx" ON "suppliers"("status");
CREATE TABLE "new_evaluation_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "total_score" REAL NOT NULL DEFAULT 0,
    "grade" TEXT,
    "problem" TEXT,
    "suggestion" TEXT,
    "evaluator_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "evaluation_records_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "evaluation_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evaluation_records_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evaluation_records_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_evaluation_records" ("created_at", "evaluator_id", "id", "problem", "supplier_id", "task_id", "total_score", "updated_at") SELECT "created_at", "evaluator_id", "id", "problem", "supplier_id", "task_id", "total_score", "updated_at" FROM "evaluation_records";
DROP TABLE "evaluation_records";
ALTER TABLE "new_evaluation_records" RENAME TO "evaluation_records";
CREATE INDEX "evaluation_records_task_id_idx" ON "evaluation_records"("task_id");
CREATE INDEX "evaluation_records_supplier_id_idx" ON "evaluation_records"("supplier_id");
CREATE INDEX "evaluation_records_total_score_idx" ON "evaluation_records"("total_score");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_templates_name_key" ON "evaluation_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definitions_target_entity_key_key" ON "attribute_definitions"("target_entity", "key");

-- CreateIndex
CREATE INDEX "attribute_values_entity_id_idx" ON "attribute_values"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_values_entity_id_attribute_id_key" ON "attribute_values"("entity_id", "attribute_id");

-- CreateIndex
CREATE INDEX "system_dictionaries_category_idx" ON "system_dictionaries"("category");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
