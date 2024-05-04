import { ReactNode } from 'react';

export interface Props {
  condition: boolean;
  children: ReactNode;
}

export default function If(props: Props) {
  return props.condition ? props.children : null;
}
