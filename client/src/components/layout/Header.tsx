import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetClose, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Globe, 
  Menu, 
  Truck, 
  PackageOpen, 
  User
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Use hard-coded user ID 1 for now. In a real app, this would come from authentication
  const { data: dashboard } = useQuery({
    queryKey: ['/api/users/1/dashboard'],
  });

  // Original navigation items from CultureQuest
  const cultureQuestNavItems = [
    { name: "Home", path: "/" },
    { name: "Puzzles", path: "/puzzles" },
    { name: "Cultures", path: "/cultures" },
    { name: "Achievements", path: "/achievements" }
  ];
  
  // Furniture Delivery navigation items
  const furnitureDeliveryNavItems = [
    { name: "Dashboard", path: "/delivery/dashboard", icon: <PackageOpen className="h-5 w-5 mr-2" /> },
    // Add more Furniture Delivery routes as they're created
  ];

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl w-10 h-10 flex items-center justify-center mr-3 shadow-md">
                <Truck className="text-white h-5 w-5" />
              </div>
              <h1 className="font-heading font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                WeMove
              </h1>
            </a>
          </Link>
        </div>
        
        <div className="hidden md:flex space-x-6 items-center">
          <nav>
            <ul className="flex space-x-6">
              {furnitureDeliveryNavItems.map(item => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a className={`font-medium transition-colors flex items-center ${location === item.path ? 'text-primary' : 'hover:text-primary'}`}>
                      {item.icon}
                      {item.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User Profile Link */}
          <Link href="/user/profile">
            <a className="inline-flex items-center">
              <div className="relative">
                <div className="w-9 h-9 rounded-full border-2 border-primary bg-gray-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border border-white"></div>
              </div>
              <span className="ml-2 font-medium">Jane Customer</span>
            </a>
          </Link>
        </div>
        
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center">
                  <div className="rounded-full bg-primary w-8 h-8 flex items-center justify-center mr-2">
                    <Truck className="text-white h-4 w-4" />
                  </div>
                  <span className="font-heading text-lg text-primary">FurnitureDelivery</span>
                </div>
              </SheetTitle>
            </SheetHeader>
            
            {/* User info section */}
            <div className="flex items-center mt-6 mb-6 pb-6 border-b">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-primary bg-gray-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border border-white"></div>
              </div>
              <div className="ml-3">
                <span className="font-medium block">Jane Customer</span>
                <span className="text-sm text-gray-500">Customer</span>
              </div>
            </div>
            
            {/* Navigation items */}
            <nav className="flex flex-col space-y-4">
              <h3 className="font-medium text-sm uppercase text-gray-500 px-4 pt-1">Furniture Delivery</h3>
              {furnitureDeliveryNavItems.map(item => (
                <SheetClose asChild key={item.path}>
                  <Link href={item.path}>
                    <a className={`py-2 px-4 rounded-md flex items-center ${location === item.path ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}>
                      {item.icon}
                      {item.name}
                    </a>
                  </Link>
                </SheetClose>
              ))}
              
              <div className="border-t my-2"></div>
              
              {/* Original navigation links */}
              <h3 className="font-medium text-sm uppercase text-gray-500 px-4 pt-1">CultureQuest</h3>
              {cultureQuestNavItems.map(item => (
                <SheetClose asChild key={item.path}>
                  <Link href={item.path}>
                    <a className={`py-2 px-4 rounded-md ${location === item.path ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'}`}>
                      {item.name}
                    </a>
                  </Link>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
