import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Calendar, 
  CreditCard, 
  User, 
  MapPin, 
  Clock,
  Star,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import NotificationCenter from '@/components/NotificationCenter';

interface Booking {
  id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  payment_method: string;
  status: string;
  delivery_time: string;
  created_at: string;
  cars: {
    name: string;
    brand: string;
    model: string;
    image_url: string;
    category: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  phone: string;
}

const Dashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (
            name,
            brand,
            model,
            image_url,
            category
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setProfile(profileData);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
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

  const submitReview = async (bookingId: string, carId: string, rating: number, comment: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user?.id,
          car_id: carId,
          booking_id: bookingId,
          rating,
          comment
        });

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      fetchUserData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
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
                <Car className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <span className="text-sm text-muted-foreground">
                Welcome, {profile?.full_name || user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>My Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Bookings</h2>
              <Button onClick={() => navigate('/cars')}>
                <Car className="h-4 w-4 mr-2" />
                Book New Car
              </Button>
            </div>

            {bookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start your journey by booking your first car rental
                  </p>
                  <Button onClick={() => navigate('/cars')}>
                    Browse Cars
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden animate-fade-in">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        {/* Car Info */}
                        <div className="flex items-center space-x-4">
                          <img
                            src={booking.cars.image_url}
                            alt={booking.cars.name}
                            className="w-20 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-semibold text-lg">{booking.cars.name}</h3>
                            <p className="text-muted-foreground">
                              {booking.cars.brand} {booking.cars.model}
                            </p>
                            <Badge variant="secondary" className="mt-1">
                              {booking.cars.category}
                            </Badge>
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Dates</p>
                              <p className="text-muted-foreground">
                                {format(new Date(booking.start_date), 'MMM dd')} - {format(new Date(booking.end_date), 'MMM dd')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Amount</p>
                              <p className="text-muted-foreground">₹{booking.total_amount}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Delivery</p>
                              <p className="text-muted-foreground">{booking.delivery_time}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          {booking.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Simple review modal - in a real app, you'd use a proper modal
                                const rating = prompt('Rate your experience (1-5):');
                                const comment = prompt('Add a comment (optional):');
                                if (rating && Number(rating) >= 1 && Number(rating) <= 5) {
                                  submitReview(booking.id, booking.car_id, Number(rating), comment || '');
                                }
                              }}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/car-details/${booking.car_id}`)}
                          >
                            View Car
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-muted-foreground">{profile?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-muted-foreground">{profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-muted-foreground">
                      {format(new Date(user?.created_at || ''), 'MMMM yyyy')}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-4">Account Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{bookings.length}</p>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {bookings.filter(b => b.status === 'completed').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        ₹{bookings.reduce((sum, b) => sum + Number(b.total_amount), 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {new Set(bookings.map(b => b.car_id)).size}
                      </p>
                      <p className="text-sm text-muted-foreground">Cars Tried</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;