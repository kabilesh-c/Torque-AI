import Image from "next/image";

// Torque AI logo mark (public/logo.png — dark rounded tile, yellow bolt)
export function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Torque AI"
      width={size}
      height={size}
      className={`rounded-md ${className}`}
      priority
    />
  );
}
