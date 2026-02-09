export type MaintenanceType = "service" | "repair" | "parts" | "inspection" | "other";

export type MaintenanceFormValues = {
  branchId: string;
  vehicleId: string;
  tripId: string;
  serviceDate: string;
  maintenanceType: MaintenanceType;
  description: string;
  vendorOrWorkshop: string;
  costAmount: string;
  odometer: string;
  nextServiceOdometer: string;
  nextServiceDate: string;
  notes: string;
};

export type MaintenanceRecord = {
  id: string;
  branch_id: string;
  vehicle_id: string;
  trip_id: string | null;
  service_date: string;
  maintenance_type: MaintenanceType;
  description: string;
  vendor_or_workshop: string | null;
  cost_amount: number;
  odometer: number;
  next_service_odometer: number | null;
  next_service_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MaintenanceFieldErrors = Partial<Record<keyof MaintenanceFormValues, string>>;
