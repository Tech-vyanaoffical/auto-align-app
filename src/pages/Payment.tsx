import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Banknote,
  Shield,
  CheckCircle
} from 'lucide-react';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const bookingData = location.state;

  if (!bookingData || !user) {
    navigate('/cars');
    return null;
  }

  const { car, startDate, endDate, totalAmount, days } = bookingData;

  const getDeliveryTime = (method: string) => {
    switch (method) {
      case 'upi':
        return '2-3 hours';
      case 'debit':
        return '4-6 hours';
      case 'cash':
        return 'Next day';
      default:
        return '2-3 hours';
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Validate payment method specific fields
      if (paymentMethod === 'upi' && !upiId) {
        throw new Error('Please enter your UPI ID');
      }
      
      if (paymentMethod === 'debit' && (!cardNumber || !cardExpiry || !cardCvv)) {
        throw new Error('Please fill all card details');
      }

      // Create booking in database
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          car_id: car.id,
          start_date: new Date(startDate).toISOString().split('T')[0],
          end_date: new Date(endDate).toISOString().split('T')[0],
          total_amount: totalAmount,
          payment_method: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'debit' ? 'Debit Card' : 'Cash',
          status: paymentMethod === 'cash' ? 'pending' : 'confirmed',
          delivery_time: getDeliveryTime(paymentMethod)
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Booking Confirmed!",
        description: "Your car rental has been successfully booked.",
      });

      // Navigate to confirmation page
      navigate('/confirmation', {
        state: {
          booking: data,
          car,
          paymentMethod
        }
      });
      
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
                <CardDescription>Review your rental details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={car.image_url}
                    alt={car.name}
                    className="w-20 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold">{car.name}</h3>
                    <p className="text-sm text-muted-foreground">{car.brand} {car.model}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Pickup Date:</span>
                    <span className="font-medium">
                      {new Date(startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Return Date:</span>
                    <span className="font-medium">
                      {new Date(endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate per day:</span>
                    <span>₹{car.price_per_day}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-primary">₹{totalAmount}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Secured by 256-bit SSL encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Payment Method</CardTitle>
                <CardDescription>
                  Select your preferred payment option
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {/* UPI Payment */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center space-x-2 cursor-pointer">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                        <span>UPI Payment</span>
                        <span className="text-sm text-green-600 font-medium">
                          (Delivery: 2-3 hours)
                        </span>
                      </Label>
                    </div>
                    {paymentMethod === 'upi' && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor="upi-id">UPI ID</Label>
                        <Input
                          id="upi-id"
                          placeholder="yourname@paytm"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter your UPI ID for instant payment
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Debit Card */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="debit" id="debit" />
                      <Label htmlFor="debit" className="flex items-center space-x-2 cursor-pointer">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                        <span>Debit Card</span>
                        <span className="text-sm text-blue-600 font-medium">
                          (Delivery: 4-6 hours)
                        </span>
                      </Label>
                    </div>
                    {paymentMethod === 'debit' && (
                      <div className="ml-6 space-y-4">
                        <div>
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input
                            id="card-number"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            maxLength={19}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="card-expiry">Expiry Date</Label>
                            <Input
                              id="card-expiry"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              maxLength={5}
                            />
                          </div>
                          <div>
                            <Label htmlFor="card-cvv">CVV</Label>
                            <Input
                              id="card-cvv"
                              placeholder="123"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              maxLength={3}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cash Payment */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center space-x-2 cursor-pointer">
                        <Banknote className="h-5 w-5 text-green-600" />
                        <span>Cash on Delivery</span>
                        <span className="text-sm text-orange-600 font-medium">
                          (Delivery: Next day)
                        </span>
                      </Label>
                    </div>
                    {paymentMethod === 'cash' && (
                      <div className="ml-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-700">
                          Pay ₹{totalAmount} in cash when the car is delivered to you.
                          A security deposit may be required.
                        </p>
                      </div>
                    )}
                  </div>
                </RadioGroup>

                <div className="pt-4 border-t">
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Estimated Delivery Time
                      </span>
                    </div>
                    <p className="text-blue-700">
                      Your car will be delivered in <strong>{getDeliveryTime(paymentMethod)}</strong> after 
                      {paymentMethod === 'cash' ? ' booking confirmation' : ' payment confirmation'}.
                    </p>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg py-6"
                  >
                    {loading ? 'Processing...' : 
                     paymentMethod === 'cash' ? 'Confirm Booking' : 
                     `Pay ₹${totalAmount}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;