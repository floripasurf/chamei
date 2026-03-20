export function LogoIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="#2563EB" />
      {/* Chat bubble */}
      <path
        d="M16 8C11.58 8 8 11.13 8 15C8 17.08 9.2 18.93 11.1 20.17L10.4 23.2C10.33 23.49 10.64 23.73 10.9 23.57L14.5 21.43C14.98 21.48 15.48 21.5 16 21.5C20.42 21.5 24 18.37 24 14.75C24 11.13 20.42 8 16 8Z"
        fill="white"
        fillOpacity="0.95"
      />
      {/* Lightning bolt */}
      <path
        d="M17.5 11L14 15.5H16L15 19L19 14.5H16.5L17.5 11Z"
        fill="#2563EB"
      />
    </svg>
  );
}

export function LogoFull({ className = "" }: { className?: string }) {
  return (
    <a href="/" className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={30} />
      {/* Custom wordmark using Space Grotesk + accent on the "i" dot */}
      <span
        className="text-[1.2rem] font-bold tracking-[-0.03em] text-gray-900"
        style={{ fontFamily: "var(--font-brand), sans-serif" }}
      >
        chame
        <span className="relative">
          i
          {/* Lightning dot on the "i" */}
          <svg
            className="absolute -top-[2px] left-[1px] w-[5px] h-[5px]"
            viewBox="0 0 10 10"
            fill="none"
          >
            <circle cx="5" cy="5" r="5" fill="#2563EB" />
          </svg>
        </span>
      </span>
    </a>
  );
}

export function LogoFullWhite({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={30}
        height={30}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="9" fill="white" fillOpacity="0.15" />
        <path
          d="M16 8C11.58 8 8 11.13 8 15C8 17.08 9.2 18.93 11.1 20.17L10.4 23.2C10.33 23.49 10.64 23.73 10.9 23.57L14.5 21.43C14.98 21.48 15.48 21.5 16 21.5C20.42 21.5 24 18.37 24 14.75C24 11.13 20.42 8 16 8Z"
          fill="white"
          fillOpacity="0.95"
        />
        <path
          d="M17.5 11L14 15.5H16L15 19L19 14.5H16.5L17.5 11Z"
          fill="#2563EB"
        />
      </svg>
      <span
        className="text-[1.2rem] font-bold tracking-[-0.03em] text-white"
        style={{ fontFamily: "var(--font-brand), sans-serif" }}
      >
        chame
        <span className="relative">
          i
          <svg
            className="absolute -top-[2px] left-[1px] w-[5px] h-[5px]"
            viewBox="0 0 10 10"
            fill="none"
          >
            <circle cx="5" cy="5" r="5" fill="white" />
          </svg>
        </span>
      </span>
    </div>
  );
}
