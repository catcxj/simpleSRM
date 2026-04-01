-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_evaluation_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'Yearly',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "deadline" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_evaluation_tasks" ("created_at", "deadline", "id", "status", "updated_at", "year") SELECT "created_at", "deadline", "id", "status", "updated_at", "year" FROM "evaluation_tasks";
DROP TABLE "evaluation_tasks";
ALTER TABLE "new_evaluation_tasks" RENAME TO "evaluation_tasks";
CREATE UNIQUE INDEX "evaluation_tasks_year_period_key" ON "evaluation_tasks"("year", "period");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
