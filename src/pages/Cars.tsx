import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useRealtimeUpdates } from '@/hooks/useRealtime';
import { Car, LogOut, User, Settings, Bell, Search, Filter } from 'lucide-react';
import CarCard from '@/components/CarCard';
import SearchFilters from '@/components/SearchFilters';
import NotificationCenter from '@/components/NotificationCenter';

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

const Cars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFuelType, setSelectedFuelType] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [selectedSeating, setSelectedSeating] = useState('All');
  const [priceRange, setPriceRange] = useState([500, 10000]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Initialize real-time updates
  useRealtimeUpdates();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCars();
  }, [user, navigate]);

  useEffect(() => {
    filterCars();
  }, [cars, searchQuery, selectedCategory, selectedFuelType, selectedTransmission, selectedSeating, priceRange]);

  useEffect(() => {
    // Listen for real-time car updates
    const handleCarsUpdate = () => {
      fetchCars();
    };

    window.addEventListener('cars-updated', handleCarsUpdate);
    return () => window.removeEventListener('cars-updated', handleCarsUpdate);
  }, []);

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('available', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setCars(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCars = () => {
    let filtered = cars;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(car =>
        car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (car.fuel_type && car.fuel_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (car.transmission && car.transmission.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(car => car.category === selectedCategory);
    }

    // Filter by fuel type
    if (selectedFuelType !== 'All') {
      filtered = filtered.filter(car => car.fuel_type === selectedFuelType);
    }

    // Filter by transmission
    if (selectedTransmission !== 'All') {
      filtered = filtered.filter(car => car.transmission === selectedTransmission);
    }

    // Filter by seating capacity
    if (selectedSeating !== 'All') {
      const targetSeats = Number(selectedSeating);
      if (targetSeats === 7) {
        filtered = filtered.filter(car => car.seating_capacity && car.seating_capacity >= 7);
      } else {
        filtered = filtered.filter(car => car.seating_capacity === targetSeats);
      }
    }

    // Filter by price range
    filtered = filtered.filter(car => 
      car.price_per_day >= priceRange[0] && car.price_per_day <= priceRange[1]
    );

    setFilteredCars(filtered);
  };

  const getSuggestedCars = (unavailableCar: string) => {
    // If user searches for a car that's not available, suggest similar cars
    const suggestions = cars.filter(car => 
      car.category === getCarCategory(unavailableCar) && car.available
    ).slice(0, 3);
    return suggestions;
  };

  const getCarCategory = (carName: string) => {
    const name = carName.toLowerCase();
    if (name.includes('fortuner') || name.includes('xuv') || name.includes('creta')) return 'SUV';
    if (name.includes('city') || name.includes('verna')) return 'Sedan';
    if (name.includes('swift') || name.includes('baleno')) return 'Hatchback';
    return 'SUV'; // default
  };

  const categories = ['All', ...Array.from(new Set(cars.map(car => car.category)))];

  const handleCarSelect = (car: Car) => {
    navigate(`/car-details/${car.id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading cars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Car className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Car Rental</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search for cars (e.g., Fortuner, City, Swift...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="flex items-center space-x-1"
                >
                  <Filter className="h-3 w-3" />
                  <span>{category}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* No results message with suggestions */}
        {filteredCars.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">
              Sorry, "{searchQuery}" is not available
            </h2>
            <p className="text-muted-foreground mb-8">
              But we have similar cars you might like:
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {getSuggestedCars(searchQuery).map(car => (
                <Card key={car.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="p-0">
                    <img
                      src={car.image_url}
                      alt={car.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </CardHeader>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{car.name}</h3>
                    <p className="text-2xl font-bold text-primary mb-4">
                      ₹{car.price_per_day}/day
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => handleCarSelect(car)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cars Grid */}
        {filteredCars.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCars.map(car => (
              <Card key={car.id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                <CardHeader className="p-0">
                  <img
                    src={car.image_url}
                    alt={car.name}
                    className="w-full h-56 object-cover rounded-t-lg"
                  />
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary">{car.category}</Badge>
                    <span className="text-sm text-muted-foreground">{car.year}</span>
                  </div>
                  
                  <CardTitle className="text-xl mb-2">{car.name}</CardTitle>
                  <CardDescription className="mb-4">
                    {car.brand} {car.model}
                  </CardDescription>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {car.features.slice(0, 3).map(feature => (
                      <Badge key={feature} variant="outline" className="text-xs">
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
                    <Button 
                      onClick={() => handleCarSelect(car)}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    >
                      Select Car
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cars;