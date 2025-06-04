'use client';

import React from 'react';

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = ({ orientation = 'horizontal' }: SeparatorProps) => {
  return orientation === 'horizontal' ? (
    <div className="h-[1px] w-full bg-stone-200 my-2" />
  ) : (
    <div className="w-[1px] h-full bg-stone-200 mx-2" />
  );
};
