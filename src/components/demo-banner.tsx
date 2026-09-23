import { FlaskConicalIcon } from 'lucide-react'

export function DemoBanner() {
  return (
    <div
      role="note"
      aria-label="Демонстрационная версия"
      className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-200"
    >
      <FlaskConicalIcon className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden />
      <strong className="font-semibold">Демонстрационная версия.</strong> Вход, деньги, активы и сделки ненастоящие;
      данные хранятся только в этом браузере.
    </div>
  )
}
