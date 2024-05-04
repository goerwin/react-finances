import { ButtonHTMLAttributes } from 'react';
import { VariantProps, cva } from 'class-variance-authority';
import cn from '../utils/cn';
import LoadingElement from './LoadingElement';

interface Props
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  showLoading?: boolean;
}

const buttonVariants = cva(
  'flex items-center justify-center p-0 rounded-lg text-white bg-[#444]',
  {
    variants: {
      variant: {
        success: 'bg-green-600',
        danger: 'bg-red-800',
      },
      size: {
        text: 'py-2 px-4',
        icon: 'text-lg h-10 aspect-square',
        iconSmall: 'text-sm h-6 aspect-square',
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
  showLoading,
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        props.disabled && 'opacity-50'
      )}
      {...props}
    >
      {children}
      {showLoading ? <LoadingElement className="inline w-4 h-4 ml-1" /> : null}
    </button>
  );
}
