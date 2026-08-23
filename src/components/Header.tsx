import { GaugeIcon } from "./icons";

export default function Header() {
  return (
    <header className="flex w-full justify-center py-6">
      <div className="flex items-center gap-2 text-purple-600">
        <GaugeIcon className="h-6 w-6" />
        <span className="text-lg font-bold tracking-tight">ExampleIQ</span>
      </div>
    </header>
  );
}
