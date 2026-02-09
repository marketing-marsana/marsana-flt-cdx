import { FuelFieldErrors, FuelFormValues } from "@/lib/fuel/types";

export function calculateTotalAmount(quantity: string, price: string): number {
  const qty = Number(quantity);
  const per = Number(price);
  if (!Number.isFinite(qty) || !Number.isFinite(per)) {
    return 0;
  }
  const total = qty * per;
  return Math.round(total * 100) / 100;
}

export function normalizeFuelInput(values: FuelFormValues): FuelFormValues {
  return {
    branchId: values.branchId.trim(),
    vehicleId: values.vehicleId.trim(),
    tripId: values.tripId.trim(),
    filledAt: values.filledAt,
    quantityLiters: values.quantityLiters.trim(),
    pricePerLiter: values.pricePerLiter.trim(),
    totalAmount: values.totalAmount.trim(),
    odometer: values.odometer.trim(),
    fuelStation: values.fuelStation.trim(),
    notes: values.notes.trim(),
  };
}

export function validateFuelInput(values: FuelFormValues): FuelFieldErrors {
  const errors: FuelFieldErrors = {};

  if (!values.branchId) {
    errors.branchId = "Branch assignment is required.";
  }

  if (!values.vehicleId) {
    errors.vehicleId = "Vehicle selection is required.";
  }

  if (!values.filledAt) {
    errors.filledAt = "Fill time is required.";
  }

  const quantity = Number(values.quantityLiters);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.quantityLiters = "Quantity must be a positive number.";
  }

  if (!values.pricePerLiter) {
    errors.pricePerLiter = "Price per liter is required.";
  }

  const price = Number(values.pricePerLiter);
  if (values.pricePerLiter && (!Number.isFinite(price) || price < 0)) {
    errors.pricePerLiter = "Price per liter must be zero or more.";
  }

  if (!values.totalAmount) {
    errors.totalAmount = "Total amount is required.";
  }

  const total = Number(values.totalAmount);
  if (values.totalAmount && (!Number.isFinite(total) || total < 0)) {
    errors.totalAmount = "Total amount must be zero or more.";
  }

  if (!values.odometer) {
    errors.odometer = "Odometer is required.";
  }

  const odometer = Number(values.odometer);
  if (values.odometer && (!Number.isFinite(odometer) || odometer < 0)) {
    errors.odometer = "Odometer must be zero or more.";
  }

  if (
    Number.isFinite(quantity) &&
    quantity > 0 &&
    Number.isFinite(price) &&
    price >= 0 &&
    Number.isFinite(total)
  ) {
    const expected = calculateTotalAmount(values.quantityLiters, values.pricePerLiter);
    if (Math.abs(expected - total) > 0.01) {
      errors.totalAmount = "Total amount must match quantity × price.";
    }
  }

  return errors;
}
