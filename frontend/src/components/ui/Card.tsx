/**
 * Card component - shadcn/ui style.
 *
 * A flexible container component for grouping content.
 */
import * as React from 'react'

/**
 * Card root component props.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Card root component.
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className || ''}`}
      {...props}
    />
  )
)
Card.displayName = 'Card'

/**
 * Card header component props.
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Card header component.
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

/**
 * Card title component props.
 */
export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * Card title component.
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

/**
 * Card description component props.
 */
export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Card description component.
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-600 ${className || ''}`}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

/**
 * Card content component props.
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Card content component.
 */
const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className || ''}`} {...props} />
  )
)
CardContent.displayName = 'CardContent'

/**
 * Card footer component props.
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Card footer component.
 */
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center p-6 pt-0 ${className || ''}`}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
