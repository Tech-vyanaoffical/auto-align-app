import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Calendar, 
  TrendingUp,
  Settings,
  ArrowLeft,
  BarChart3,
  DollarSign
} from 'lucide-react';
import CarCard from '@/components/CarCard';

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
  fuel_type: string;
  transmission: string;
  seating_capacity: number;
  rating: number;
  total_reviews: number;
  location: string;
}

interface Booking {
  id: string;
  user_id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  created_at: string;
  cars: {
    name: string;
    brand: string;
    model: string;
  };
  profiles: {
    full_name: string;
  } | null;
}

const Admin: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [carFormOpen, setCarFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  
  // Car form state
  const [carForm, setCarForm] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'Sedan',
    price_per_day: 1000,
    features: '',
    image_url: '',
    fuel_type: 'Petrol',
    transmission: 'Manual',
    seating_capacity: 5,
    location: 'Main Office'
  });

  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!adminLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate('/cars');
      return;
    }

    if (isAdmin) {
      fetchAdminData();
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const fetchAdminData = async () => {
    try {
      // Fetch all cars
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .order('name');

      if (carsError) throw carsError;
      setCars(carsData || []);

      // Fetch all bookings with car and user info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (name, brand, model),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      
      // Type-safe handling of booking data
      const typedBookings = (bookingsData || []).map(booking => {        
        // Check if profiles exists and has the expected structure
        let profiles: { full_name: string } | null = null;
        
        if (booking.profiles && typeof booking.profiles === 'object') {
          // Check if it's not an error object and has full_name
          const profilesObj = booking.profiles as any;
          if (!('error' in profilesObj) && 'full_name' in profilesObj) {
            profiles = profilesObj as { full_name: string };
          }
        }
        
        return {
          ...booking,
          profiles
        } as Booking;
      });
      
      setBookings(typedBookings);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const carData = {
        ...carForm,
        features: carForm.features.split(',').map(f => f.trim()).filter(f => f)
      };

      if (editingCar) {
        const { error } = await supabase
          .from('cars')
          .update(carData)
          .eq('id', editingCar.id);

        if (error) throw error;

        toast({
          title: "Car Updated",
          description: "Car has been successfully updated",
        });
      } else {
        const { error } = await supabase
          .from('cars')
          .insert(carData);

        if (error) throw error;

        toast({
          title: "Car Added",
          description: "New car has been successfully added",
        });
      }

      setCarFormOpen(false);
      setEditingCar(null);
      resetCarForm();
      fetchAdminData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCarEdit = (car: Car) => {
    setEditingCar(car);
    setCarForm({
      name: car.name,
      brand: car.brand,
      model: car.model,
      year: car.year,
      category: car.category,
      price_per_day: car.price_per_day,
      features: car.features.join(', '),
      image_url: car.image_url,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      seating_capacity: car.seating_capacity,
      location: car.location
    });
    setCarFormOpen(true);
  };

  const handleCarDelete = async (carId: string) => {
    if (!confirm('Are you sure you want to delete this car?')) return;

    try {
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) throw error;

      toast({
        title: "Car Deleted",
        description: "Car has been successfully deleted",
      });

      fetchAdminData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Booking status has been updated",
      });

      fetchAdminData();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetCarForm = () => {
    setCarForm({
      name: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      category: 'Sedan',
      price_per_day: 1000,
      features: '',
      image_url: '',
      fuel_type: 'Petrol',
      transmission: 'Manual',
      seating_capacity: 5,
      location: 'Main Office'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  const monthlyRevenue = bookings
    .filter(b => {
      const bookingDate = new Date(b.created_at);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return bookingDate.getMonth() === currentMonth && 
             bookingDate.getFullYear() === currentYear &&
             b.status === 'completed';
    })
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin panel...</p>
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
              <Button
                variant="ghost"
                onClick={() => navigate('/cars')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Cars</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Settings className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Admin Panel</h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center space-x-2"
            >
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Car className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-2xl font-bold">{cars.length}</p>
                <p className="text-sm text-muted-foreground">Total Cars</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Calendar className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-2xl font-bold">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-2xl font-bold">₹{monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cars" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cars">Cars Management</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          {/* Cars Management Tab */}
          <TabsContent value="cars" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Cars Inventory</h2>
              <Dialog open={carFormOpen} onOpenChange={setCarFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetCarForm(); setEditingCar(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Car
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingCar ? 'Edit Car' : 'Add New Car'}</DialogTitle>
                    <DialogDescription>
                      {editingCar ? 'Update car information' : 'Add a new car to your fleet'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCarSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Car Name</Label>
                        <Input
                          id="name"
                          value={carForm.name}
                          onChange={(e) => setCarForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={carForm.brand}
                          onChange={(e) => setCarForm(prev => ({ ...prev, brand: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          value={carForm.model}
                          onChange={(e) => setCarForm(prev => ({ ...prev, model: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={carForm.year}
                          onChange={(e) => setCarForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={carForm.category} onValueChange={(value) => setCarForm(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sedan">Sedan</SelectItem>
                            <SelectItem value="SUV">SUV</SelectItem>
                            <SelectItem value="Hatchback">Hatchback</SelectItem>
                            <SelectItem value="Luxury">Luxury</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fuel_type">Fuel Type</Label>
                        <Select value={carForm.fuel_type} onValueChange={(value) => setCarForm(prev => ({ ...prev, fuel_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Petrol">Petrol</SelectItem>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Electric">Electric</SelectItem>
                            <SelectItem value="Hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transmission">Transmission</Label>
                        <Select value={carForm.transmission} onValueChange={(value) => setCarForm(prev => ({ ...prev, transmission: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Manual">Manual</SelectItem>
                            <SelectItem value="Automatic">Automatic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price_per_day">Price per Day (₹)</Label>
                        <Input
                          id="price_per_day"
                          type="number"
                          value={carForm.price_per_day}
                          onChange={(e) => setCarForm(prev => ({ ...prev, price_per_day: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seating_capacity">Seating Capacity</Label>
                        <Input
                          id="seating_capacity"
                          type="number"
                          value={carForm.seating_capacity}
                          onChange={(e) => setCarForm(prev => ({ ...prev, seating_capacity: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={carForm.image_url}
                        onChange={(e) => setCarForm(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://example.com/car-image.jpg"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="features">Features (comma separated)</Label>
                      <Textarea
                        id="features"
                        value={carForm.features}
                        onChange={(e) => setCarForm(prev => ({ ...prev, features: e.target.value }))}
                        placeholder="AC, GPS, Bluetooth, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={carForm.location}
                        onChange={(e) => setCarForm(prev => ({ ...prev, location: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setCarFormOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCar ? 'Update Car' : 'Add Car'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map(car => (
                <CarCard
                  key={car.id}
                  car={car}
                  onSelect={() => {}}
                  showActions={true}
                  onEdit={handleCarEdit}
                  onDelete={handleCarDelete}
                />
              ))}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <h2 className="text-xl font-semibold">Booking Management</h2>
            
            <div className="space-y-4">
              {bookings.map(booking => (
                <Card key={booking.id} className="animate-fade-in">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{booking.cars.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {booking.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold">₹{booking.total_amount}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(booking.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <Select 
                          value={booking.status} 
                          onValueChange={(value) => updateBookingStatus(booking.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;