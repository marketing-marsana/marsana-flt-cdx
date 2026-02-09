export function getPostLoginRedirect(params: {
  isSuperAdmin?: boolean | null;
  designation?: string | null;
}): string {
  if (params.isSuperAdmin) {
    return "/dashboard/hq";
  }

  const designation = (params.designation ?? "").trim().toLowerCase();

  if (designation === "driver") {
    return "/driver";
  }

  if (designation === "corporate_admin" || designation === "corporate admin") {
    return "/corporates";
  }

  return "/dashboard/branch";
}
