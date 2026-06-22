export function isSuperAdmin(email?: string | null): boolean {
  return email?.toLowerCase() === "hrixofficial@gmail.com";
}
