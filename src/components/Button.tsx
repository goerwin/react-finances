import { ButtonHTMLAttributes, ReactNode } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import cn from '../utils/cn';

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const buttonVariants = cva(
  'flex items-center justify-center p-0 rounded-lg text-white bg-[#444]',
  {
    variants: {
      variant: {
        success: 'bg-green-600',
        danger: 'bg-red-800',
      },
      size: {
        icon: 'text-lg h-10 aspect-square',
        text: 'py-2 px-4',
      },
    },
    defaultVariants: {
      size: 'text',
    },
  }
);

export default function Button({
  className,
  variant,
  size,
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </button>
  );
}
