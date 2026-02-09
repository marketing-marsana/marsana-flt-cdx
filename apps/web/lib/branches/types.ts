export type BranchStatus = "ACTIVE" | "INACTIVE";
export type BranchType = "HQ" | "B2B" | "B2C";

export type BranchFormValues = {
  name: string;
  code: string;
  type: BranchType;
  address: string;
  contactNumber: string;
  status: BranchStatus;
};

export type BranchRecord = {
  id: string;
  name: string;
  code: string;
  type: BranchType;
  address: string | null;
  contact_number: string | null;
  status: BranchStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BranchFieldErrors = Partial<Record<keyof BranchFormValues, string>>;
