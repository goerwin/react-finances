import React, { ReactNode } from 'react';

export interface Props {
  bottomArea?: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  autoHeight?: boolean;
}

export default function Popup(props: Props) {
  return (
    <div className="flex fixed inset-0 bg-black justify-center items-center bg-opacity-80 p-4">
      <div className="bg-gray-800 py-4 px-5 rounded-lg text-center w-full">
        <h2 className="text-3xl mt-4 mb-4 font-bold">
          {props.title}
          {props.subtitle ? (
            <span className="text-lg font-normal block">{props.subtitle}</span>
          ) : null}
        </h2>

        <div
          className={`overflow-auto ${props.autoHeight ? 'max-h-80' : 'h-80'}`}
        >
          {props.children}
        </div>

        {props.autoHeight ? null : (
          <div className="relative before:content-[''] before:absolute before:bottom-full before:left-0 before:w-full before:h-5 before:shadow-[inset_0_-8px_6px_-5px_rgba(0,0,0,0.4)]" />
        )}

        {props.bottomArea ? (
          <div className="pt-4">{props.bottomArea}</div>
        ) : null}
      </div>
    </div>
  );
}
