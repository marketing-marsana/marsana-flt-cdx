export type DriverStatus = "ACTIVE" | "INACTIVE";

export type DriverFormValues = {
  branchId: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  status: DriverStatus;
  notes: string;
};

export type DriverRecord = {
  id: string;
  branch_id: string;
  full_name: string;
  phone: string;
  license_number: string;
  license_expiry_date: string | null;
  status: DriverStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type DriverFieldErrors = Partial<Record<keyof DriverFormValues, string>>;
