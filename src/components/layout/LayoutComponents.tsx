import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useDenseMode } from "@/contexts/DenseModeContext";

/**
 * CENTRALIZED LAYOUT COMPONENTS
 * 
 * These components provide a single source of truth for spacing across the app.
 * 
 * Usage Examples:
 * 
 * // Normal spacing (most pages)
 * <PageContainer>
 *   <PageSection>
 *     <Card>...</Card>
 *     <Card>...</Card>
 *   </PageSection>
 * </PageContainer>
 * 
 * // Compact spacing (dense content like card stacks)
 * <PageContainer spacing="compact" maxWidth="2xl">
 *   <CardStack>...</CardStack>
 * </PageContainer>
 * 
 * // Loose spacing (content that needs breathing room)
 * <PageContainer spacing="loose">
 *   <PageSection spacing="loose">
 *     <HeroSection>...</HeroSection>
 *   </PageSection>
 * </PageContainer>
 * 
 * // Modal with compact cards
 * <ModalContent>
 *   <ModalCard className="bg-muted">...</ModalCard>
 * </ModalContent>
 */

// ============= PAGE LAYOUTS =============

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "full";
  spacing?: "compact" | "normal" | "loose" | "auto";
}

/**
 * Standard page container with responsive padding
 * Used for: All main pages (Swipe, Matches, Profile, Settings, etc.)
 * 
 * Spacing variants:
 * - auto: Uses global dense mode setting (default)
 * - compact: px-2 md:px-3 (for dense content like card stacks)
 * - normal: px-3 md:px-4 (default for most pages)
 * - loose: px-4 md:px-6 (for content that needs breathing room)
 */
export const PageContainer = ({ 
  children, 
  className,
  maxWidth = "4xl",
  spacing = "auto"
}: PageContainerProps) => {
  const { denseMode } = useDenseMode();
  
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    full: "max-w-full",
  };

  const spacingClasses = {
    compact: "px-2 md:px-3",
    normal: "px-3 md:px-4",
    loose: "px-4 md:px-6",
  };

  // Use global dense mode if spacing is "auto"
  const effectiveSpacing = spacing === "auto" ? denseMode : spacing;

  return (
    <div className={cn(
      "container mx-auto",
      spacingClasses[effectiveSpacing],
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
};

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  spacing?: "compact" | "normal" | "loose" | "auto";
}

/**
 * Section spacing wrapper
 * Used for: Spacing between cards/sections within a page
 * 
 * Spacing variants:
 * - auto: Uses global dense mode setting (default)
 * - compact: space-y-3 md:space-y-4 (for dense lists/cards)
 * - normal: space-y-4 md:space-y-6 (default spacing)
 * - loose: space-y-6 md:space-y-8 (for separated content)
 */
export const PageSection = ({ 
  children, 
  className,
  spacing = "auto"
}: PageSectionProps) => {
  const { denseMode } = useDenseMode();
  
  const spacingClasses = {
    compact: "space-y-3 md:space-y-4",
    normal: "space-y-4 md:space-y-6",
    loose: "space-y-6 md:space-y-8",
  };

  // Use global dense mode if spacing is "auto"
  const effectiveSpacing = spacing === "auto" ? denseMode : spacing;

  return (
    <div className={cn(spacingClasses[effectiveSpacing], className)}>
      {children}
    </div>
  );
};

interface PageHeaderProps {
  children: ReactNode;
  className?: string;
  spacing?: "compact" | "normal" | "loose" | "auto";
}

/**
 * Page header with responsive padding
 * Used for: Page titles and descriptions
 * 
 * Spacing variants:
 * - auto: Uses global dense mode setting (default)
 * - compact: py-3 md:py-4 (minimal header spacing)
 * - normal: py-4 md:py-6 (default header spacing)
 * - loose: py-6 md:py-8 (generous header spacing)
 */
export const PageHeader = ({ 
  children, 
  className,
  spacing = "auto"
}: PageHeaderProps) => {
  const { denseMode } = useDenseMode();
  
  const spacingClasses = {
    compact: "py-3 md:py-4",
    normal: "py-4 md:py-6",
    loose: "py-6 md:py-8",
  };

  // Use global dense mode if spacing is "auto"
  const effectiveSpacing = spacing === "auto" ? denseMode : spacing;

  return (
    <div className={cn(spacingClasses[effectiveSpacing], className)}>
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
