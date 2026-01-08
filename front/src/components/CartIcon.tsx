type Props = {
  pendingCount?: number;
};

export default function CartIcon({ pendingCount }: Props) {
  // Keep this component minimal and ensure no accidental numeric text (like a stray "0") is rendered.
  // Only render badge when pendingCount > 0.
  return (
    <div className="relative inline-flex items-center" aria-hidden="false" role="button" aria-label="Abrir carrito">
      <span className="text-xl" aria-hidden="true">🛒</span>
      {typeof pendingCount === 'number' && pendingCount > 0 && (
        <span
          title={pendingCount + " artículo(s) pendientes: no están incluidos en el total mostrado"}
          className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-orange-500 rounded-full"
        >
          {pendingCount}
        </span>
      )}
    </div>
  );
}
