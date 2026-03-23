"use client";

import { Switch } from "@/components/ui/switch";

interface LibraryOptionProps {
  label: string;
  subLabel: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  color: "blue" | "purple";
}

export default function LibraryOption({
  label,
  subLabel,
  checked,
  onChange,
  color,
}: LibraryOptionProps) {
  const isBlue = color === "blue";
  const badgeClasses = isBlue
    ? checked
      ? "bg-blue-600 text-white"
      : "bg-blue-100 text-blue-600"
    : checked
      ? "bg-purple-600 text-white"
      : "bg-purple-100 text-purple-600";
  const switchClasses = isBlue
    ? "data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200 h-7 w-12"
    : "data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-slate-200 h-7 w-12";

  return (
    <label
      className={`flex cursor-pointer items-center justify-between rounded-[2rem] border-2 p-5 transition-colors ${
        isBlue
          ? checked
            ? "border-blue-500 bg-blue-50/30"
            : "border-slate-100 hover:border-blue-100"
          : checked
            ? "border-purple-500 bg-purple-50/30"
            : "border-slate-100 hover:border-purple-100"
      }`}
    >
      <div className="flex items-center gap-5">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black transition-colors ${badgeClasses}`}
        >
          {label[0]}
        </div>
        <div>
          <p className="text-sm font-[900] text-slate-800 tracking-tight">
            {label}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {subLabel}
          </p>
        </div>
      </div>

      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className={switchClasses}
      />
    </label>
  );
}
