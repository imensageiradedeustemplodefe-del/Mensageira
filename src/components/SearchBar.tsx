"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export const SearchBar = ({ placeholder = "Buscar...", className = "", onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    onSearch?.(query);
  }, [query, onSearch]);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 min-h-0 min-w-0 p-0 z-10"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
