import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Car, 
  Calendar, 
  Clock, 
  Phone, 
  MapPin,
  Download,
  Star
} from 'lucide-react';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const bookingData = location.state;

  if (!bookingData) {
    navigate('/cars');
    return null;
  }

  const { booking, car, paymentMethod } = bookingData;

  const getStatusColor = (status: string) => {
    return status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getDeliveryMessage = () => {
    switch (paymentMethod) {
      case 'upi':
        return 'Your car will be delivered to your location within 2-3 hours.';
      case 'debit':
        return 'Your car will be delivered to your location within 4-6 hours.';
      case 'cash':
        return 'Your car will be delivered tomorrow. Please keep cash ready for payment.';
      default:
        return 'Your car will be delivered soon.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your car rental has been successfully booked
            </p>
          </div>

          {/* Booking Details */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Booking Details</CardTitle>
                  <CardDescription>Booking ID: {booking.id.slice(0, 8).toUpperCase()}</CardDescription>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Car Information */}
              <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                <img
                  src={car.image_url}
                  alt={car.name}
                  className="w-24 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{car.name}</h3>
                  <p className="text-muted-foreground">{car.brand} {car.model} ({car.year})</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">{car.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      ₹{car.price_per_day}/day
                    </span>
                  </div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Rental Period</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Delivery Time</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.delivery_time}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">Payment Summary</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-semibold">₹{booking.total_amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span>{booking.payment_method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="capitalize">{booking.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5" />
                <span>Delivery Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-blue-900 font-medium mb-2">
                  {getDeliveryMessage()}
                </p>
                <p className="text-blue-700 text-sm">
                  Our delivery partner will contact you 30 minutes before arrival.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">What to expect:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Vehicle inspection with our representative</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Document verification (License, ID)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Security deposit (if applicable)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <span>Handover of keys and documents</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Need help?</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>24/7 Support: +91 9876543210</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Track delivery in real-time</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/cars')}
              className="flex items-center space-x-2"
            >
              <Car className="h-4 w-4" />
              <span>Browse More Cars</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Receipt</span>
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Back to Home
            </Button>
          </div>

          {/* Rating Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center">How was your booking experience?</CardTitle>
              <CardDescription className="text-center">
                Your feedback helps us improve our service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className="h-8 w-8 text-yellow-400 fill-current" />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Thank you for choosing our car rental service!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;