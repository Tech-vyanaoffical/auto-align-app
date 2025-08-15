import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, Fuel, Settings, MapPin } from 'lucide-react';

interface Car {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  price_per_day: number;
  features: string[];
  image_url: string;
  available: boolean;
  fuel_type?: string;
  transmission?: string;
  seating_capacity?: number;
  rating?: number;
  total_reviews?: number;
  location?: string;
}

interface CarCardProps {
  car: Car;
  onSelect: (car: Car) => void;
  showActions?: boolean;
  onEdit?: (car: Car) => void;
  onDelete?: (carId: string) => void;
}

const CarCard: React.FC<CarCardProps> = ({ 
  car, 
  onSelect, 
  showActions = false, 
  onEdit, 
  onDelete 
}) => {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer animate-fade-in">
      <CardHeader className="p-0 relative">
        <img
          src={car.image_url}
          alt={car.name}
          className="w-full h-56 object-cover rounded-t-lg"
        />
        <div className="absolute top-3 right-3">
          <Badge 
            variant={car.available ? "default" : "destructive"}
            className="bg-background/90 backdrop-blur-sm"
          >
            {car.available ? 'Available' : 'Booked'}
          </Badge>
        </div>
        {car.rating && (
          <div className="absolute top-3 left-3 flex items-center space-x-1 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{car.rating.toFixed(1)}</span>
            {car.total_reviews && (
              <span className="text-xs text-muted-foreground">({car.total_reviews})</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary">{car.category}</Badge>
          <span className="text-sm text-muted-foreground">{car.year}</span>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{car.name}</h3>
        <p className="text-muted-foreground mb-4">{car.brand} {car.model}</p>

        {/* Car specifications */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          {car.fuel_type && (
            <div className="flex items-center space-x-1">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              <span>{car.fuel_type}</span>
            </div>
          )}
          {car.transmission && (
            <div className="flex items-center space-x-1">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>{car.transmission}</span>
            </div>
          )}
          {car.seating_capacity && (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{car.seating_capacity} seats</span>
            </div>
          )}
          {car.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{car.location}</span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {car.features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
          {car.features.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{car.features.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">
              ₹{car.price_per_day}
            </span>
            <span className="text-muted-foreground">/day</span>
          </div>
          
          {showActions ? (
            <div className="flex space-x-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(car);
                  }}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(car.id);
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          ) : (
            <Button 
              onClick={() => onSelect(car)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              disabled={!car.available}
            >
              {car.available ? 'Select Car' : 'Unavailable'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CarCard;