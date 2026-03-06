import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
]

function getColor(name: string) {
  return COLORS[name.charCodeAt(0) % COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Avatar({ src, name, size = 'md', className, ...props }: AvatarProps) {
  const sizeClass = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' }[size]

  if (src) {
    return (
      <div className={cn('rounded-full overflow-hidden flex-shrink-0', sizeClass, className)} {...props}>
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0', sizeClass, getColor(name), className)}
      {...props}
    >
      {getInitials(name)}
    </div>
  )
}
