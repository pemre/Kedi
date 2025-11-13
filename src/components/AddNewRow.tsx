import { Plus } from "lucide-react";

interface AddNewRowProps {
  onAdd: () => void;
}

export function AddNewRow({ onAdd }: AddNewRowProps) {
  return (
    <div className="group/row relative px-6 md:px-12">
      <div className="flex gap-2 md:gap-3">
        <button
          onClick={onAdd}
          className="
            flex cursor-pointer w-[100px] md:w-[170px] h-[100px] md:h-[170px]
            flex-shrink-0 items-center justify-center rounded border-2 border-dashed border-white/30 bg-white/5
            transition-all hover:border-[#E50914] hover:bg-white/10"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8 md:h-12 md:w-12 text-white/70" />
            <span className="text-sm text-white/70">Add Row</span>
          </div>
        </button>
      </div>
    </div>
  );
}
