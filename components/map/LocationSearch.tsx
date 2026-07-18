"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { MapPin } from "lucide-react";

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchProps {
  placeholder?: string;
  onSelect: (lat: number, lng: number, address: string) => void;
  defaultValue?: string;
}

export function LocationSearch({ placeholder = "Search location...", onSelect, defaultValue = "" }: LocationSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };

    // Prevent searching if we just selected something and the query matches it
    if (open) {
      fetchLocations();
    }
  }, [debouncedQuery]);

  return (
    <div className="relative w-full">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onBlur={() => {
          // Delay closing so click event on suggestions can fire
          setTimeout(() => setOpen(false), 200);
        }}
        placeholder={placeholder}
        className="w-full"
      />
      
      {loading && (
        <div className="absolute right-3 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}

      {open && results.length > 0 && (
        <div className="absolute z-[9999] mt-1 w-full rounded-md border bg-popover shadow-md outline-none animate-in fade-in-0 zoom-in-95">
          <ul className="max-h-60 overflow-auto rounded-md p-1">
            {results.map((result) => (
              <li
                key={result.place_id}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                onClick={() => {
                  setQuery(result.display_name);
                  setOpen(false);
                  onSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
                }}
              >
                <MapPin className="mr-2 h-4 w-4 opacity-50" />
                <span className="truncate">{result.display_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
