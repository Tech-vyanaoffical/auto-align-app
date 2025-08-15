import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Car, Fuel, Users, Settings } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedFuelType: string;
  onFuelTypeChange: (fuelType: string) => void;
  selectedTransmission: string;
  onTransmissionChange: (transmission: string) => void;
  priceRange: number[];
  onPriceRangeChange: (range: number[]) => void;
  selectedSeating: string;
  onSeatingChange: (seating: string) => void;
  categories: string[];
  clearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedFuelType,
  onFuelTypeChange,
  selectedTransmission,
  onTransmissionChange,
  priceRange,
  onPriceRangeChange,
  selectedSeating,
  onSeatingChange,
  categories,
  clearFilters
}) => {
  return (
    <div className="space-y-6 bg-card p-6 rounded-lg shadow-sm animate-fade-in">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search for cars by name, brand, or model..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center space-x-1">
            <Car className="h-4 w-4" />
            <span>Category</span>
          </label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.filter(cat => cat !== 'All').map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fuel Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center space-x-1">
            <Fuel className="h-4 w-4" />
            <span>Fuel Type</span>
          </label>
          <Select value={selectedFuelType} onValueChange={onFuelTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Fuel Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Fuel Types</SelectItem>
              <SelectItem value="Petrol">Petrol</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Electric">Electric</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transmission Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center space-x-1">
            <Settings className="h-4 w-4" />
            <span>Transmission</span>
          </label>
          <Select value={selectedTransmission} onValueChange={onTransmissionChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="Automatic">Automatic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seating Capacity Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>Seating</span>
          </label>
          <Select value={selectedSeating} onValueChange={onSeatingChange}>
            <SelectTrigger>
              <SelectValue placeholder="Any Seats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Any Seats</SelectItem>
              <SelectItem value="4">4 Seats</SelectItem>
              <SelectItem value="5">5 Seats</SelectItem>
              <SelectItem value="7">7+ Seats</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          Price Range: ₹{priceRange[0]} - ₹{priceRange[1]} per day
        </label>
        <Slider
          value={priceRange}
          onValueChange={onPriceRangeChange}
          max={10000}
          min={500}
          step={500}
          className="w-full"
        />
      </div>

      {/* Clear Filters */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={clearFilters}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Clear Filters</span>
        </Button>
      </div>
    </div>
  );
};

export default SearchFilters;