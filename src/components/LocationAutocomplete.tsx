"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDownIcon, PinIcon, SpinnerIcon } from "./icons";
import FieldShell from "./FieldShell";
import { useDebouncedValue } from "@/utils/useDebouncedValue";
import { searchPlaces, resolvePlace, type PlaceSuggestion, type ResolvedPlace } from "@/utils/maps";

interface LocationAutocompleteProps {
  label: string;
  placeholder?: string;
  value: string;
  onTextChange: (text: string) => void;
  onSelect: (place: ResolvedPlace) => void;
  error?: string;
}

export default function LocationAutocomplete({
  label,
  placeholder,
  value,
  onTextChange,
  onSelect,
  error,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, startSearch] = useTransition();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedValue = useDebouncedValue(value, 350);
  const skipNextSearch = useRef(false);

  const isQueryTooShort = debouncedValue.trim().length < 3;

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (isQueryTooShort) return;

    let cancelled = false;
    startSearch(async () => {
      const results = await searchPlaces(debouncedValue);
      if (cancelled) return;
      setSuggestions(results);
      setIsOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedValue, isQueryTooShort]);

  const visibleSuggestions = isQueryTooShort ? [] : suggestions;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(suggestion: PlaceSuggestion) {
    skipNextSearch.current = true;
    onTextChange(suggestion.description);
    setIsOpen(false);
    setSuggestions([]);
    const resolved = await resolvePlace(suggestion);
    if (resolved) onSelect(resolved);
  }

  return (
    <div ref={containerRef} className="relative">
      <FieldShell
        label={label}
        error={error}
        icon={<PinIcon className="h-4 w-4 shrink-0 text-gold-500" />}
        trailing={
          isLoading ? (
            <SpinnerIcon className="h-4 w-4 shrink-0 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
          )
        }
      >
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onTextChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => visibleSuggestions.length > 0 && setIsOpen(true)}
          className="min-w-0 flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400"
          autoComplete="off"
        />
      </FieldShell>
      {isOpen && visibleSuggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {visibleSuggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gold-50"
              >
                <PinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span>{suggestion.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
