export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type VehicleFormValues = {
  branchId: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
  vin: string;
  fuelType: string;
  odometer: string;
  status: VehicleStatus;
  notes: string;
};

export type VehicleRecord = {
  id: string;
  branch_id: string;
  registration_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  vin: string | null;
  fuel_type: string | null;
  odometer: number;
  status: VehicleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type VehicleFieldErrors = Partial<Record<keyof VehicleFormValues, string>>;
