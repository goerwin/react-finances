import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface Props {
  bottomArea?: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  popupClassName?: string;
  containerClassName?: string;
  autoHeight?: boolean;
}

export default function Popup(props: Props) {
  return (
    <div
      className={twMerge(
        'flex fixed inset-0 bg-black justify-center items-center bg-opacity-80 p-3 z-10 overflow-auto',
        props.popupClassName
      )}
    >
      <div
        className={twMerge(
          'flex flex-col max-h-full w-full bg-neutral-900 py-4 px-3 rounded-lg text-center',
          props.autoHeight ? '' : 'h-full',
          props.containerClassName
        )}
      >
        <h2 className="text-2xl mt-0 mb-2 font-bold leading-none">
          {props.title}
          {props.subtitle ? (
            <span className="text-lg font-normal block">{props.subtitle}</span>
          ) : null}
        </h2>

        <div className="overflow-auto flex-grow">{props.children}</div>

        {props.autoHeight ? null : (
          <div className="relative before:content-[''] before:absolute before:bottom-full before:left-0 before:w-full before:h-5 before:shadow-[inset_0_-8px_6px_-5px_rgba(0,0,0,0.4)]" />
        )}

        {props.bottomArea ? (
          <div className="pt-2">{props.bottomArea}</div>
        ) : null}
      </div>
    </div>
  );
}
