"use client";

const PALETTE = [
  "#F5A623",
  "#4A9EFF",
  "#00C98D",
  "#7C6FE0",
  "#F25F5C",
  "#F5CE42",
  "#00D4A0",
  "#E07C6F",
  "#6FD4E0",
  "#B06FE0",
  "#8A95A3",
  "#F97316",
];

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export const CategoryColorPicker = ({ value, onChange }: Props) => (
  <div className="flex flex-wrap gap-2">
    {PALETTE.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        className="h-6 w-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
        style={{ backgroundColor: color, boxShadow: value === color ? `0 0 0 2px #0e1117, 0 0 0 4px ${color}` : undefined }}
        aria-label={color}
      />
    ))}
  </div>
);
