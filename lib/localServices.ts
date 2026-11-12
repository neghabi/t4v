export function localServicesEnabled() {
  return process.env.NODE_ENV === "development" && process.env.T4V_LOCAL_SERVICES === "true";
}
