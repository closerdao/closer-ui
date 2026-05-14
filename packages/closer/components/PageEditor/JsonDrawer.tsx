interface Props {
  open: boolean;
  onClose: () => void;
  payload: unknown;
}

const JsonDrawer = ({ open, onClose, payload }: Props) => {
  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-[min(420px,calc(100vw-2rem))] w-full max-h-60 overflow-auto rounded-lg bg-gray-900 text-gray-100 text-xs font-mono p-4 shadow-lg">
      <div className="flex justify-between items-center mb-2 text-gray-400 uppercase tracking-wider text-[10px]">
        <span>PUT /page/:id</span>
        <button
          type="button"
          className="text-gray-400 hover:text-white px-2 py-1 rounded"
          onClick={onClose}
        >
          close
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-words">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
};

export default JsonDrawer;
