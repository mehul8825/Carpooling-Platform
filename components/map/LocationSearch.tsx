"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { MapPin, Loader2, MapPinHouse } from "lucide-react";
import { toast } from "sonner";

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
  const justSelected = useRef(false);

  useEffect(() => {
    if (defaultValue && defaultValue !== query) {
      justSelected.current = true;
      setQuery(defaultValue);
    }
  }, [defaultValue]);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    // Don't search if we just selected a result
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }

    if (!debouncedQuery || debouncedQuery.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();

    const fetchLocations = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error fetching locations:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            justSelected.current = true;
            setQuery(data.display_name);
            onSelect(latitude, longitude, data.display_name);
            toast.success("Location found!");
          } else {
            toast.error("Could not determine address from location");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error("Failed to get address");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to retrieve your location");
        setLoading(false);
      }
    );
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 200);
          }}
          placeholder={placeholder}
          className="w-full pr-10"
        />
        <div className="absolute right-2 top-0 flex h-full items-center gap-1">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {!loading && (
            <button
              type="button"
              onClick={handleCurrentLocation}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-muted"
              title="Use current location"
            >
              <MapPinHouse className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-[9999] mt-1 w-full rounded-md border bg-popover shadow-lg outline-none animate-in fade-in-0 zoom-in-95">
          <ul className="max-h-60 overflow-auto rounded-md p-1">
            {results.map((result) => (
              <li
                key={result.place_id}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                onClick={() => {
                  justSelected.current = true;
                  setQuery(result.display_name);
                  setOpen(false);
                  setResults([]);
                  onSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
                }}
              >
                <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{result.display_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
