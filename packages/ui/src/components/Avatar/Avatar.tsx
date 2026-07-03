import { forwardRef, useCallback, useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../utils/cn'

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: {
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-14 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

type AvatarVariantProps = VariantProps<typeof avatarVariants>

export interface AvatarProps
  extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>,
    AvatarVariantProps {
  /** Image source URL. */
  src?: string
  /** Alt text for the image. */
  alt: string
  /** Fallback text (e.g. initials) shown when image is absent or fails to load. */
  fallback: string
}

/** User avatar with image and fallback initials. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  function Avatar({ className, size, src, alt, fallback, ...props }, ref) {
    const [imgError, setImgError] = useState(false)

    const handleError = useCallback(() => {
      setImgError(true)
    }, [])

    const showImage = src && !imgError

    return (
      <span
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            onError={handleError}
            className="size-full object-cover"
          />
        ) : (
          <span
            aria-label={alt}
            className="flex size-full items-center justify-center font-medium text-muted-foreground"
          >
            {fallback}
          </span>
        )}
      </span>
    )
  },
)
