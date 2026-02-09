export type FuelFormValues = {
  branchId: string;
  vehicleId: string;
  tripId: string;
  filledAt: string;
  quantityLiters: string;
  pricePerLiter: string;
  totalAmount: string;
  odometer: string;
  fuelStation: string;
  notes: string;
};

export type FuelRecord = {
  id: string;
  branch_id: string;
  vehicle_id: string;
  trip_id: string | null;
  filled_at: string;
  quantity_liters: number;
  price_per_liter: number;
  total_amount: number;
  odometer: number;
  fuel_station: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type FuelFieldErrors = Partial<Record<keyof FuelFormValues, string>>;
