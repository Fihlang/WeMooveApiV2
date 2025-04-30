import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/home/Hero";
import PlayerStats from "@/components/home/PlayerStats";
import ContinueJourney from "@/components/home/ContinueJourney";
import CulturalMap from "@/components/home/CulturalMap";
import HowItWorks from "@/components/home/HowItWorks";
import PuzzlePreview from "@/components/home/PuzzlePreview";
import { Dashboard } from "@/lib/types";
import AchievementCollection from "@/components/achievements/AchievementCollection";
import RecentAchievements from "@/components/achievements/RecentAchievements";
import NewAchievementPopup from "@/components/ui/NewAchievementPopup";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Truck, 
  PackageOpen, 
  MapPin, 
  Clock, 
  Phone, 
  Shield, 
  CreditCard, 
  PlayCircle, 
  CalendarPlus, 
  CheckCircle, 
  ArrowRight, 
  Star 
} from "lucide-react";

export default function HomePage() {
  // Use hard-coded user ID 1 for now. In a real app, this would come from authentication
  const userId = 1;
  
  const { data: dashboard, isLoading } = useQuery<Dashboard>({
    queryKey: ['/api/users/1/dashboard'],
  });

  const { data: puzzles } = useQuery({
    queryKey: ['/api/puzzles', { regionId: 1, userId }],
  });

  const { data: regions } = useQuery({
    queryKey: ['/api/regions', { userId }],
  });

  const { data: achievements } = useQuery({
    queryKey: ['/api/achievements', { userId }],
  });

  const { data: recentAchievements } = useQuery({
    queryKey: ['/api/achievements/recent', { userId }],
  });

  // Show achievement popup after 3 seconds
  const [showAchievement, setShowAchievement] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAchievement(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div>
      {/* WeMove Hero Section */}
      <section className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white py-28 px-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/20 animate-pulse" style={{animationDuration: '8s'}}></div>
          <div className="absolute bottom-40 right-40 w-40 h-40 rounded-full bg-white/10 animate-pulse" style={{animationDuration: '5s'}}></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
                Furniture Delivery, Reimagined 🚚✨
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Move Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400">Furniture</span> With Zero Hassle
              </h1>
              <p className="text-xl opacity-90 leading-relaxed">
                WeMove connects you with trusted local movers for quick, reliable, and affordable furniture delivery. Track in real-time and get your items delivered safely.
              </p>
              
              <div className="flex flex-wrap gap-5 pt-2">
                <Button
                  size="lg"
                  className="bg-white text-indigo-700 hover:bg-white/90 rounded-full px-8 font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 h-14"
                  asChild
                >
                  <Link href="/delivery/dashboard">
                    Get Started Now
                  </Link>
                </Button>
                
                <Button
                  size="lg" 
                  variant="outline"
                  className="border-white/30 hover:bg-white/10 rounded-full px-8 font-semibold text-base h-14"
                  asChild
                >
                  <Link href="#how-it-works">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    How It Works
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-700 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-bold">4.9/5</span> from over 2,400+ reviews
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-700/20 rounded-2xl transform rotate-3"></div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 relative shadow-2xl border border-white/10">
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-pink-500 text-white rounded-full px-4 py-1 font-bold text-sm shadow-lg">
                  Live Tracking
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h3 className="text-2xl font-bold flex items-center">
                      <Truck className="mr-3 h-6 w-6 text-pink-400" />
                      Delivery Status
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 font-medium text-sm">In Progress</span>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between text-sm opacity-70">
                      <span>Order ID</span>
                      <span>WM-2823-0914</span>
                    </div>
                    
                    <div className="flex justify-between text-sm opacity-70">
                      <span>Estimated arrival</span>
                      <span className="font-medium">4:30 PM (10 mins)</span>
                    </div>
                  </div>
                  
                  <div className="relative pt-2">
                    <div className="relative h-48 rounded-xl overflow-hidden bg-indigo-900/30 border border-white/10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <MapPin className="h-10 w-10 text-purple-500 animate-pulse" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-950 via-indigo-950/80 to-transparent p-3 pt-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500 h-10 w-10 rounded-full flex items-center justify-center text-white">
                            DM
                          </div>
                          <div>
                            <p className="font-semibold">Driver: David M.</p>
                            <p className="text-xs opacity-70">3 minutes away • Toyota Hilux</p>
                          </div>
                          <Button size="sm" variant="outline" className="ml-auto h-8 rounded-full px-3 text-xs border-white/30 hover:bg-white/10">
                            <Phone className="h-3 w-3 mr-1" /> Call
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/5">
                        <div className="text-center">
                          <PackageOpen className="h-5 w-5 mx-auto mb-1 text-pink-400" />
                          <div className="text-xs font-medium">2 Items</div>
                        </div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/5">
                        <div className="text-center">
                          <MapPin className="h-5 w-5 mx-auto mb-1 text-pink-400" />
                          <div className="text-xs font-medium">3.8 km</div>
                        </div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/5">
                        <div className="text-center">
                          <CreditCard className="h-5 w-5 mx-auto mb-1 text-pink-400" />
                          <div className="text-xs font-medium">$38.50</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg h-11 font-semibold" asChild>
                    <Link href="/delivery/tracking/1234">
                      Track Your Delivery
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Service Features */}
      <section className="py-20 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose WeMove</h2>
            <p className="text-lg text-gray-600">Our platform combines technology with reliable service to deliver the smoothest furniture moving experience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <PackageOpen className="h-8 w-8 text-purple-600" />,
                title: "Easy Booking",
                description: "Book in less than 2 minutes with our simple form. Just tell us what, when and where."
              },
              {
                icon: <MapPin className="h-8 w-8 text-purple-600" />,
                title: "Live Tracking",
                description: "Watch your furniture's journey in real-time on an interactive map."
              },
              {
                icon: <Shield className="h-8 w-8 text-purple-600" />,
                title: "Insured Delivery",
                description: "Every delivery includes basic coverage, with options for additional protection."
              },
              {
                icon: <CreditCard className="h-8 w-8 text-purple-600" />,
                title: "Transparent Pricing",
                description: "No hidden fees. Get an instant quote based on distance and item size."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="bg-purple-100 w-16 h-16 rounded-lg flex items-center justify-center mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How WeMove Works</h2>
            <p className="text-lg text-gray-600">Complete your delivery in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Book Your Move",
                description: "Enter your pickup and delivery locations, select the size of your items, and choose a time slot.",
                icon: <CalendarPlus className="h-8 w-8 text-purple-600" />
              },
              {
                step: "02",
                title: "Track in Real-Time",
                description: "Follow your delivery live on the map. Get notifications when driver is assigned and en route.",
                icon: <MapPin className="h-8 w-8 text-purple-600" />
              },
              {
                step: "03",
                title: "Receive Your Items",
                description: "Meet your driver at the delivery location. Inspect items and rate your experience.",
                icon: <CheckCircle className="h-8 w-8 text-purple-600" />
              }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-indigo-50 rounded-2xl p-8 h-full border border-indigo-100">
                  <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                  <div className="flex flex-col h-full">
                    <div className="bg-white w-16 h-16 rounded-xl shadow-md flex items-center justify-center mb-6">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 flex-grow">{step.description}</p>
                    {i < 2 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <ArrowRight className="h-6 w-6 text-purple-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-full px-8 font-semibold text-white shadow-lg"
              asChild
            >
              <Link href="/delivery/dashboard">
                Book Your First Delivery
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-indigo-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600">Join thousands of satisfied customers who trust WeMove</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                rating: 5,
                comment: "WeMove helped me move my new couch when no one else could. The driver was professional and careful with my furniture.",
                location: "Cape Town"
              },
              {
                name: "Michael Stevens",
                rating: 5,
                comment: "The live tracking feature is a game-changer! I knew exactly when my dining table would arrive. Will definitely use again.",
                location: "Johannesburg"
              },
              {
                name: "Thabo Mbeki",
                rating: 4,
                comment: "Reasonable prices and excellent service. The app is easy to use and the drivers are always on time. Highly recommend!",
                location: "Pretoria"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.comment}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                  <div className="bg-indigo-100 h-10 w-10 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Original CultureQuest content */}
      <Hero />
      
      {dashboard && (
        <PlayerStats 
          currentJourney={dashboard.stats.currentJourney} 
          achievements={dashboard.stats.achievementsUnlocked}
          puzzlesCompleted={dashboard.stats.puzzlesCompleted}
          culturesDiscovered={dashboard.stats.culturesDiscovered}
        />
      )}
      
      {puzzles && (
        <ContinueJourney puzzles={puzzles} />
      )}
      
      {regions && (
        <CulturalMap regions={regions} />
      )}
      
      <section className="py-12 bg-gradient-to-br from-secondary/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-bold text-2xl md:text-3xl mb-4">Your Achievements</h2>
            <p className="text-gray-600">Track your progress and unlock rewards as you explore different cultures.</p>
          </div>
          
          {achievements && (
            <AchievementCollection achievements={achievements} />
          )}
          
          {recentAchievements && (
            <RecentAchievements achievements={recentAchievements} />
          )}
        </div>
      </section>
      
      <HowItWorks />
      <PuzzlePreview />
      
      {showAchievement && (
        <NewAchievementPopup 
          title="Cultural Curious" 
          description="You've unlocked 'Cultural Curious' for viewing your first puzzle!"
          icon="fa-crown"
          color="secondary"
          onClose={() => setShowAchievement(false)}
        />
      )}
    </div>
  );
}
