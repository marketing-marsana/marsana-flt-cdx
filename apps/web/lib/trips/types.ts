export type TripStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type TripFormValues = {
  branchId: string;
  driverId: string;
  vehicleId: string;
  tripCode: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  actualStartAt: string;
  actualEndAt: string;
  distanceKm: string;
  fareAmount: string;
  status: TripStatus;
  notes: string;
};

export type TripRecord = {
  id: string;
  branch_id: string;
  driver_id: string;
  vehicle_id: string;
  trip_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  pickup_location: string;
  dropoff_location: string;
  scheduled_start_at: string;
  scheduled_end_at: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  distance_km: number | null;
  fare_amount: number | null;
  status: TripStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TripFieldErrors = Partial<Record<keyof TripFormValues, string>>;
