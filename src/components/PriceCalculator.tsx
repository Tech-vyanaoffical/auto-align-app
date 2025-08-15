import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Calendar, Clock, MapPin } from 'lucide-react';

interface PriceCalculatorProps {
  basePrice: number;
  className?: string;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({ basePrice, className = "" }) => {
  const [duration, setDuration] = useState(1);
  const [durationType, setDurationType] = useState<'days' | 'weeks' | 'months'>('days');
  const [distance, setDistance] = useState(100);
  const [includeDriver, setIncludeDriver] = useState(false);
  const [extraFeatures, setExtraFeatures] = useState<string[]>([]);

  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const features = [
    { id: 'insurance', name: 'Full Insurance', price: 200 },
    { id: 'gps', name: 'GPS Navigation', price: 50 },
    { id: 'fuel', name: 'Full Tank', price: 2000 },
    { id: 'cleaning', name: 'Deep Cleaning', price: 500 },
    { id: 'pickup', name: 'Home Pickup/Drop', price: 300 },
  ];

  useEffect(() => {
    calculatePrice();
  }, [duration, durationType, distance, includeDriver, extraFeatures, basePrice]);

  const calculatePrice = () => {
    let totalDays = duration;
    
    // Convert to days
    if (durationType === 'weeks') {
      totalDays = duration * 7;
    } else if (durationType === 'months') {
      totalDays = duration * 30;
    }

    // Base price calculation
    let price = basePrice * totalDays;

    // Apply discounts for longer durations
    if (totalDays >= 30) {
      price *= 0.8; // 20% discount for monthly rentals
    } else if (totalDays >= 7) {
      price *= 0.9; // 10% discount for weekly rentals
    }

    // Distance charges (₹10 per km after 100km/day)
    const freeKmPerDay = 100;
    const totalFreeKm = freeKmPerDay * totalDays;
    if (distance > totalFreeKm) {
      price += (distance - totalFreeKm) * 10;
    }

    // Driver charges
    if (includeDriver) {
      price += totalDays * 800; // ₹800 per day for driver
    }

    // Extra features
    const featuresPrice = extraFeatures.reduce((sum, featureId) => {
      const feature = features.find(f => f.id === featureId);
      return sum + (feature ? feature.price : 0);
    }, 0);

    price += featuresPrice;

    setCalculatedPrice(Math.round(price));
  };

  const toggleFeature = (featureId: string) => {
    setExtraFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const getDiscountText = () => {
    let totalDays = duration;
    if (durationType === 'weeks') totalDays = duration * 7;
    else if (durationType === 'months') totalDays = duration * 30;

    if (totalDays >= 30) return "20% Monthly Discount Applied!";
    if (totalDays >= 7) return "10% Weekly Discount Applied!";
    return "";
  };

  return (
    <Card className={`${className} animate-fade-in`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Price Calculator</span>
        </CardTitle>
        <CardDescription>
          Calculate your rental cost with customizable options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Duration</span>
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration-type">Type</Label>
            <Select value={durationType} onValueChange={(value: 'days' | 'weeks' | 'months') => setDurationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Distance */}
        <div className="space-y-2">
          <Label htmlFor="distance" className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>Expected Distance (km)</span>
          </Label>
          <Input
            id="distance"
            type="number"
            min={0}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
          />
          <p className="text-sm text-muted-foreground">
            First {durationType === 'days' ? duration * 100 : durationType === 'weeks' ? duration * 700 : duration * 3000} km included
          </p>
        </div>

        {/* Driver Option */}
        <div className="flex items-center justify-between">
          <Label className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Include Driver</span>
          </Label>
          <Select value={includeDriver ? "yes" : "no"} onValueChange={(value) => setIncludeDriver(value === "yes")}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Extra Features */}
        <div className="space-y-3">
          <Label>Extra Features</Label>
          <div className="grid grid-cols-1 gap-2">
            {features.map((feature) => (
              <div 
                key={feature.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  extraFeatures.includes(feature.id) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggleFeature(feature.id)}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={extraFeatures.includes(feature.id)}
                    onChange={() => toggleFeature(feature.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{feature.name}</span>
                </div>
                <span className="text-sm font-medium">+₹{feature.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Base Price ({durationType === 'days' ? duration : durationType === 'weeks' ? duration * 7 : duration * 30} days)</span>
            <span>₹{basePrice * (durationType === 'days' ? duration : durationType === 'weeks' ? duration * 7 : duration * 30)}</span>
          </div>
          
          {getDiscountText() && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{getDiscountText()}</span>
              <span>-₹{Math.round((basePrice * (durationType === 'days' ? duration : durationType === 'weeks' ? duration * 7 : duration * 30)) * (getDiscountText().includes('20%') ? 0.2 : 0.1))}</span>
            </div>
          )}
          
          {includeDriver && (
            <div className="flex justify-between text-sm">
              <span>Driver ({durationType === 'days' ? duration : durationType === 'weeks' ? duration * 7 : duration * 30} days)</span>
              <span>₹{(durationType === 'days' ? duration : durationType === 'weeks' ? duration * 7 : duration * 30) * 800}</span>
            </div>
          )}
          
          {extraFeatures.length > 0 && (
            <div className="flex justify-between text-sm">
              <span>Extra Features</span>
              <span>₹{extraFeatures.reduce((sum, featureId) => {
                const feature = features.find(f => f.id === featureId);
                return sum + (feature ? feature.price : 0);
              }, 0)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total Amount</span>
            <span className="text-primary">₹{calculatedPrice.toLocaleString()}</span>
          </div>
          
          {getDiscountText() && (
            <Badge variant="secondary" className="w-full justify-center">
              {getDiscountText()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceCalculator;