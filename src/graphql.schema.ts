
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export class NewMake {
    makeId: string;
    makeName: string;
}

export class UpdateMake {
    id: string;
    makeId?: Nullable<string>;
    makeName?: Nullable<string>;
}

export class NewVehicleType {
    vehicleTypeId: string;
    vehicleTypeName: string;
    makeId: string;
}

export class UpdateVehicleType {
    id: string;
    vehicleTypeId?: Nullable<string>;
    vehicleTypeName?: Nullable<string>;
    makeId?: Nullable<string>;
}

export class Make {
    id: string;
    makeId: string;
    makeName: string;
    vehicleTypes: VehicleType[];
}

export abstract class IQuery {
    abstract makes(): Make[] | Promise<Make[]>;

    abstract make(id: string): Nullable<Make> | Promise<Nullable<Make>>;

    abstract vehicleTypes(): VehicleType[] | Promise<VehicleType[]>;

    abstract vehicleType(id: string): Nullable<VehicleType> | Promise<Nullable<VehicleType>>;

    abstract vehicleTypesByMakeId(makeId: string): VehicleType[] | Promise<VehicleType[]>;
}

export abstract class IMutation {
    abstract createMake(input: NewMake): Make | Promise<Make>;

    abstract updateMake(input: UpdateMake): Nullable<Make> | Promise<Nullable<Make>>;

    abstract deleteMake(id: string): Nullable<Make> | Promise<Nullable<Make>>;

    abstract createVehicleType(input: NewVehicleType): VehicleType | Promise<VehicleType>;

    abstract updateVehicleType(input: UpdateVehicleType): Nullable<VehicleType> | Promise<Nullable<VehicleType>>;

    abstract deleteVehicleType(id: string): Nullable<VehicleType> | Promise<Nullable<VehicleType>>;
}

export abstract class ISubscription {
    abstract makeCreated(): Nullable<Make> | Promise<Nullable<Make>>;

    abstract vehicleTypeCreated(): Nullable<VehicleType> | Promise<Nullable<VehicleType>>;
}

export class VehicleType {
    id: string;
    vehicleTypeId: string;
    vehicleTypeName: string;
    makeId: string;
    make: Make;
}

type Nullable<T> = T | null;
