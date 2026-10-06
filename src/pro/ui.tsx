import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'solid' | 'outline' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-sun text-petrol-950 hover:bg-sun-deep',
  solid: 'bg-petrol-900 text-cream hover:bg-petrol-950',
  outline: 'border-2 border-petrol-900 text-petrol-900 hover:bg-petrol-900 hover:text-cream',
  danger: 'border-2 border-danger text-danger hover:bg-danger hover:text-white',
  ghost: 'text-petrol-900 hover:bg-petrol-900/10',
}

export function Button({
  variant = 'solid',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "L'action n'a pas abouti. Réessayez."
