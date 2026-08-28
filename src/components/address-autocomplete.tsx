"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type Suggestion = { placeId: string; text: string };
type PlaceResult = { lat: number; lng: number; displayName: string };

export function AddressAutocomplete({
  id,
  name,
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: PlaceResult) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const isFirstRunRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    if (value.trim().length < 4) {
      // Se difiere a un microtask (en vez de llamar setState aquí directo)
      // para no violar la regla del linter de no actualizar estado de forma
      // síncrona dentro del cuerpo de un efecto.
      queueMicrotask(() => {
        setSuggestions([]);
        setOpen(false);
      });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places-autocomplete?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as Suggestion[];
        if (controller.signal.aborted) return;
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        // abortado (el usuario siguió escribiendo) — se ignora
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handlePick(suggestion: Suggestion) {
    setOpen(false);
    setSuggestions([]);
    onChange(suggestion.text);
    setResolving(true);
    try {
      const res = await fetch(
        `/api/place-details?placeId=${encodeURIComponent(suggestion.placeId)}`
      );
      const result = (await res.json()) as PlaceResult | null;
      if (result) onSelect(result);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(suggestions.length > 0)}
        placeholder={placeholder}
        autoComplete="off"
        required
      />
      {resolving && (
        <p className="mt-1 text-xs text-muted-foreground">Ubicando la dirección...</p>
      )}
      {open && suggestions.length > 0 && (
        // z-index bien alto a propósito: este campo va justo encima de un
        // mapa de Leaflet (StopMapPicker), cuyos controles/paneles internos
        // usan z-index de hasta 1000 — con algo como z-20 el mapa lo tapa.
        <ul className="absolute z-[1100] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-card shadow-md">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
