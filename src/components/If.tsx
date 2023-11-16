import React, { ReactNode } from 'react';

export interface Props {
  condition: boolean;
  children: ReactNode;
}

export default function If(props: Props) {
  return Boolean(props.condition) ? props.children : null;
}
