import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Car, 
  Fuel, 
  Users, 
  Settings, 
  Shield,
  MapPin,
  Clock
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

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
}

const CarDetails = () => {
  const { id } = useParams();
  const [car, setCar] = useState<Car | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchCarDetails(id);
    }
  }, [id, user, navigate]);

  const fetchCarDetails = async (carId: string) => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();

      if (error) throw error;
      setCar(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch car details",
        variant: "destructive",
      });
      navigate('/cars');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!startDate || !endDate || !car) return 0;
    const days = differenceInDays(endDate, startDate) + 1;
    return days * car.price_per_day;
  };

  const handleBookNow = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Please select dates",
        description: "Please select both start and end dates for your rental",
        variant: "destructive",
      });
      return;
    }

    if (startDate < new Date()) {
      toast({
        title: "Invalid date",
        description: "Start date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: "Invalid date range",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    // Navigate to payment page with booking details
    navigate('/payment', {
      state: {
        car,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalAmount: calculateTotalAmount(),
        days: differenceInDays(endDate, startDate) + 1
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading car details...</p>
        </div>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Car not found</h2>
          <Button onClick={() => navigate('/cars')}>
            Back to Cars
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/cars')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Cars</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Car Details */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="p-0">
                <img
                  src={car.image_url}
                  alt={car.name}
                  className="w-full h-80 object-cover"
                />
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="text-sm">{car.category}</Badge>
                  <span className="text-muted-foreground">{car.year}</span>
                </div>
                
                <CardTitle className="text-3xl mb-2">{car.name}</CardTitle>
                <CardDescription className="text-lg mb-4">
                  {car.brand} {car.model}
                </CardDescription>

                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{car.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Fully Insured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">Free Delivery</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Features & Specifications</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {car.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold text-primary">
                        ₹{car.price_per_day}
                      </span>
                      <span className="text-muted-foreground ml-2">per day</span>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Available
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>Book Your Rental</span>
                </CardTitle>
                <CardDescription>
                  Select your rental dates and proceed to payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < (startDate || new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {startDate && endDate && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold">
                        {differenceInDays(endDate, startDate) + 1} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate per day:</span>
                      <span>₹{car.price_per_day}</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-bold text-primary">
                        ₹{calculateTotalAmount()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Free cancellation up to 24 hours before pickup</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Comprehensive insurance included</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Free delivery within city limits</span>
                  </div>
                </div>

                <Button
                  onClick={handleBookNow}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg py-6"
                  disabled={!startDate || !endDate || bookingLoading}
                >
                  {bookingLoading ? 'Processing...' : 'Book Now'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;