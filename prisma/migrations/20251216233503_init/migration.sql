-- CreateTable
CREATE TABLE "Make" (
    "id" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    "makeName" TEXT NOT NULL,

    CONSTRAINT "Make_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleType" (
    "id" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "vehicleTypeName" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,

    CONSTRAINT "VehicleType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Make_makeId_key" ON "Make"("makeId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleType_makeId_vehicleTypeId_key" ON "VehicleType"("makeId", "vehicleTypeId");

-- AddForeignKey
ALTER TABLE "VehicleType" ADD CONSTRAINT "VehicleType_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "Make"("makeId") ON DELETE RESTRICT ON UPDATE CASCADE;
