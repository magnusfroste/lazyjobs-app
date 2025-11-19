import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ============= PAGE LAYOUTS =============

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "full";
}

/**
 * Standard page container with responsive padding
 * Used for: All main pages (Swipe, Matches, Profile, Settings, etc.)
 */
export const PageContainer = ({ 
  children, 
  className,
  maxWidth = "4xl" 
}: PageContainerProps) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    full: "max-w-full",
  };

  return (
    <div className={cn(
      "container mx-auto px-3 md:px-4",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Section spacing wrapper
 * Used for: Spacing between cards/sections within a page
 */
export const PageSection = ({ 
  children, 
  className 
}: { children: ReactNode; className?: string }) => {
  return (
    <div className={cn("space-y-4 md:space-y-6", className)}>
      {children}
    </div>
  );
};

/**
 * Page header with responsive padding
 * Used for: Page titles and descriptions
 */
export const PageHeader = ({ 
  children, 
  className 
}: { children: ReactNode; className?: string }) => {
  return (
    <div className={cn("py-4 md:py-6", className)}>
      {children}
    </div>
  );
};

// ============= MODAL LAYOUTS =============

/**
 * Modal content wrapper with responsive padding
 * Used for: Modal content areas
 */
export const ModalContent = ({ 
  children, 
  className 
}: { children: ReactNode; className?: string }) => {
  return (
    <div className={cn("p-4 md:p-6", className)}>
      {children}
    </div>
  );
};

/**
 * Modal card wrapper (for nested cards in modals)
 * Used for: Info cards, content displays within modals
 */
export const ModalCard = ({ 
  children, 
  className 
}: { children: ReactNode; className?: string }) => {
  return (
    <div className={cn("p-3 md:p-4", className)}>
      {children}
    </div>
  );
};

// ============= MOBILE HEADERS =============

/**
 * Mobile-specific page header
 * Used for: Simple centered titles on mobile
 */
export const MobilePageHeader = ({ 
  title,
  className 
}: { title: string; className?: string }) => {
  return (
    <div className={cn("md:hidden pt-4 pb-2", className)}>
      <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
        {title}
      </h1>
    </div>
  );
};

/**
 * Desktop-specific page header
 * Used for: Full headers with title and description on desktop
 */
export const DesktopPageHeader = ({ 
  title,
  description,
  className 
}: { title: string; description?: string; className?: string }) => {
  return (
    <div className={cn("hidden md:block", className)}>
      <PageContainer>
        <PageHeader>
          <div className="mb-4 md:mb-6">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
        </PageHeader>
      </PageContainer>
    </div>
  );
};
