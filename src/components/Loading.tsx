import LoadingElement from "./LoadingElement";

export default function Loading() {
  return (
    <div className="fixed bg-black/90 z-50 inset-0 flex items-center justify-center">
      <div role="status" className="scale-[2]">
        <LoadingElement />
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
