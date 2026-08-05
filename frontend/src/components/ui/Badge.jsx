export function Badge({ variant = "neutral", children, className = "" }) {
  return <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>;
}
export function PaymentBadge({ status }) {
  const map = {
    paid: "success",
    pending: "warning",
    failed: "danger",
    refunded: "info"
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}
export function CertBadge({ status }) {
  return <Badge variant={status === "generated" ? "success" : "neutral"}>{status}</Badge>;
}
export function EventStatusBadge({ status }) {
  const map = {
    upcoming: "info",
    ongoing: "success",
    completed: "neutral"
  };
  return <Badge variant={map[status] ?? "neutral"}>{status}</Badge>;
}
export function RoleBadge({ role }) {
  const map = {
    super_admin: "danger",
    admin: "primary",
    event_manager: "info",
    volunteer: "success",
    viewer: "neutral",
    user: "neutral"
  };
  const labels = {
    super_admin: "Super Admin",
    event_manager: "Event Manager"
  };
  return <Badge variant={map[role] ?? "neutral"}>{labels[role] ?? role}</Badge>;
}
export function AttendanceBadge({ attended }) {
  return <Badge variant={attended ? "success" : "warning"}>{attended ? "Present" : "Absent"}</Badge>;
}
