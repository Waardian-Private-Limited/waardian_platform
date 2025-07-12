'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { ReactNode } from 'react';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = ({
  children,
  side = 'right',
  ...props
}: {
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) => (
  <TooltipPrimitive.Content
    side={side}
    className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg shadow-md z-50"
    {...props}
  >
    {children}
    <TooltipPrimitive.Arrow className="fill-gray-800" />
  </TooltipPrimitive.Content>
);