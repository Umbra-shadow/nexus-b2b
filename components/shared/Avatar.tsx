import { getInitials, cn } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name)

  if (src) {
    return (
      <div className={cn('rounded-full overflow-hidden shrink-0 relative', SIZE[size], className)}>
        <Image src={src} alt={name} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-brown text-white flex items-center justify-center font-semibold shrink-0 select-none',
        SIZE[size],
        className
      )}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
