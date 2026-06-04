-- CreateTable
CREATE TABLE "_SalesOrderDepartments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalesOrderDepartments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SalesOrderActivities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SalesOrderActivities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SalesOrderDepartments_B_index" ON "_SalesOrderDepartments"("B");

-- CreateIndex
CREATE INDEX "_SalesOrderActivities_B_index" ON "_SalesOrderActivities"("B");

-- AddForeignKey
ALTER TABLE "_SalesOrderDepartments" ADD CONSTRAINT "_SalesOrderDepartments_A_fkey" FOREIGN KEY ("A") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalesOrderDepartments" ADD CONSTRAINT "_SalesOrderDepartments_B_fkey" FOREIGN KEY ("B") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalesOrderActivities" ADD CONSTRAINT "_SalesOrderActivities_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SalesOrderActivities" ADD CONSTRAINT "_SalesOrderActivities_B_fkey" FOREIGN KEY ("B") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
