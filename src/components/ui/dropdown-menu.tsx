import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(null);

function useDropdown() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("useDropdown must be used within a DropdownMenu");
  }
  return context;
}

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
  render,
  className,
  ...props
}: {
  children?: React.ReactNode;
  asChild?: boolean;
  render?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { open, setOpen } = useDropdown();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  if (render && React.isValidElement(render)) {
    return React.cloneElement(render as React.ReactElement<any>, {
      onClick: handleClick,
      children: render.props.children || children,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("inline-flex items-center justify-center cursor-pointer", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  align = "end",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
  [key: string]: any;
}) {
  const { open } = useDropdown();

  if (!open) return null;

  const alignClass =
    align === "start"
      ? "left-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "right-0";

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] rounded-lg border border-slate-200 bg-white p-1.5 text-slate-950 shadow-md animate-in fade-in-80 zoom-in-95",
        alignClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: any;
}) {
  const { setOpen } = useDropdown();

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e);
    setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-hidden transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={cn("px-2.5 py-1.5 text-xs font-semibold text-slate-900", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className, ...props }: { className?: string; [key: string]: any }) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-slate-100", className)} {...props} />
  );
}

export function DropdownMenuGroup({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <div className={cn("space-y-0.5", className)} {...props}>
      {children}
    </div>
  );
}
