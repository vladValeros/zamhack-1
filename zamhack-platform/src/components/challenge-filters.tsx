"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"

export function ChallengeFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Local state
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [sort, setSort] = useState(searchParams.get("sort") || "newest")

  // Debounced URL updater for Search Text
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (query) {
        params.set("q", query)
      } else {
        params.delete("q")
      }
      replace(`${pathname}?${params.toString()}`)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [query, pathname, replace, searchParams])

  // Immediate URL updater for Dropdowns
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    replace(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    setQuery("")
    setCategory("all")
    setSort("newest")
    replace(pathname)
  }

  return (
    <div className="space-y-4 bg-card p-4 rounded-lg border shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filter Challenges
        </h3>
        {(query || category !== "all" || sort !== "newest") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClear}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or description..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Category Dropdown (Mapping to Industry in DB) */}
        <Select 
          value={category} 
          onValueChange={(val) => {
            setCategory(val)
            handleFilterChange("category", val)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Technology">Technology & Coding</SelectItem>
            <SelectItem value="Design">Design & Creative</SelectItem>
            <SelectItem value="Business">Business & Marketing</SelectItem>
            <SelectItem value="Social Impact">Social Impact</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Dropdown */}
        <Select 
          value={sort} 
          onValueChange={(val) => {
            setSort(val)
            handleFilterChange("sort", val)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="closing_soon">Closing Soon</SelectItem>
            <SelectItem value="participants_high">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}