import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";

interface HearingDatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (val: string) => void;
  id?: string;
  "data-ocid"?: string;
}

export function HearingDatePicker({
  value,
  onChange,
  id,
  "data-ocid": dataOcid,
}: HearingDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          data-ocid={dataOcid}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1">
            {selected ? format(selected, "PPP") : "Pick a date"}
          </span>
          {value && (
            <X
              className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
