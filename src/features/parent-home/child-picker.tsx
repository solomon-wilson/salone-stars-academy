import { Users } from "lucide-react"
import type { FirestorePupil } from "../../firebaseDb"

type ChildPickerProps = {
  children: FirestorePupil[]
  activeChildId: string | null
  onSelectChild: (child: FirestorePupil) => void
}

export const ChildPicker = ({ children, activeChildId, onSelectChild }: ChildPickerProps) => {
  if (children.length <= 1) return null

  return (
    <div className="col-span-1 lg:col-span-3 flex flex-wrap items-center gap-2 bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3">
      <Users className="h-4 w-4 text-indigo-400 shrink-0" aria-hidden="true" />
      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mr-1">
        Active child
      </span>
      {children.map(child => (
        <button
          key={child.id}
          type="button"
          onClick={() => onSelectChild(child)}
          aria-label={`Switch to ${child.name}`}
          aria-pressed={activeChildId === child.id}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
            activeChildId === child.id
              ? "bg-brand-primary border-blue-400 text-white"
              : "bg-[#05060f] border-indigo-900/50 text-indigo-300 hover:border-indigo-500"
          }`}
        >
          {child.name}
        </button>
      ))}
    </div>
  )
}
