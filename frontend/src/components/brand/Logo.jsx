import logoImage from "../../assets/images/carpedium-logo.svg";

export function Logo({ compact = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={logoImage}
        alt="Carpediem logo"
        className="h-9 w-9 bg-transparent object-contain"
      />
      {!compact && <span className="font-display text-xl font-black tracking-tight">Carpediem</span>}
    </span>
  );
}
