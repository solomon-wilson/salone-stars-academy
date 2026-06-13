import { Plus, Users } from "lucide-react"
import { GlassCard } from "../../shared/ui/glass-card"
import { CLASS_LEVELS, MAX_PARENT_CHILDREN } from "../../constants/parent"
import type { FirestorePupil } from "../../firebaseDb"

type ChildProfileLinkerProps = {
  children: FirestorePupil[]
  selectedChildId: string | null
  canLinkMore: boolean
  childName: string
  childClass: string
  linking: boolean
  onChildNameChange: (value: string) => void
  onChildClassChange: (value: string) => void
  onSelectChild: (childId: string) => void
  onLinkChild: () => void
}

export const ChildProfileLinker = ({
  children,
  selectedChildId,
  canLinkMore,
  childName,
  childClass,
  linking,
  onChildNameChange,
  onChildClassChange,
  onSelectChild,
  onLinkChild,
}: ChildProfileLinkerProps) => (
  <GlassCard className="p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-indigo-400" />
        <h3 className="text-sm font-black uppercase text-white tracking-wide">Linked Children</h3>
      </div>
      <span className="text-[10px] text-indigo-400 font-bold uppercase">
        {children.length}/{MAX_PARENT_CHILDREN}
      </span>
    </div>

    {children.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {children.map(child => (
          <button
            key={child.id}
            type="button"
            onClick={() => onSelectChild(child.id)}
            aria-label={`Select ${child.name}`}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              selectedChildId === child.id
                ? "bg-brand-primary border-blue-400 text-white"
                : "bg-[#05060f] border-indigo-900/50 text-indigo-300 hover:border-indigo-500"
            }`}
          >
            {child.name} · {child.class_level}
          </button>
        ))}
      </div>
    )}

    {canLinkMore && (
      <div className="space-y-3 pt-2 border-t border-indigo-900/40">
        <p className="text-[11px] text-indigo-300">Add a child profile for home practice.</p>
        <input
          type="text"
          value={childName}
          onChange={(e) => onChildNameChange(e.target.value)}
          placeholder="Child's name"
          aria-label="Child name"
          className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-indigo-900/50 focus:border-indigo-500 transition outline-none"
        />
        <select
          value={childClass}
          onChange={(e) => onChildClassChange(e.target.value)}
          aria-label="Child class level"
          className="w-full bg-[#05060f] border border-indigo-900/50 rounded-xl px-4 py-3 text-xs text-slate-100 cursor-pointer focus:border-indigo-500 transition outline-none"
        >
          {CLASS_LEVELS.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onLinkChild}
          disabled={linking}
          className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl cursor-pointer transition"
        >
          <Plus className="h-4 w-4" />
          <span>{linking ? "Linking..." : "Link Child Profile"}</span>
        </button>
      </div>
    )}
  </GlassCard>
)
