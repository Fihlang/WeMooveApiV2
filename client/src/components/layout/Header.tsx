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
import { Globe, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Use hard-coded user ID 1 for now. In a real app, this would come from authentication
  const { data: dashboard } = useQuery({
    queryKey: ['/api/users/1/dashboard'],
  });

  const navigationItems = [
    { name: "Home", path: "/" },
    { name: "Puzzles", path: "/puzzles" },
    { name: "Cultures", path: "/cultures" },
    { name: "Achievements", path: "/achievements" }
  ];

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              <div className="rounded-full bg-primary w-10 h-10 flex items-center justify-center mr-2">
                <Globe className="text-white h-5 w-5" />
              </div>
              <h1 className="font-heading font-bold text-xl md:text-2xl text-primary">CultureQuest</h1>
            </a>
          </Link>
        </div>
        
        <div className="hidden md:flex space-x-6 items-center">
          <nav>
            <ul className="flex space-x-6">
              {navigationItems.map(item => (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a className={`font-medium transition-colors ${location === item.path ? 'text-primary' : 'hover:text-primary'}`}>
                      {item.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {dashboard && (
            <Link href="/profile">
              <a className="inline-flex items-center">
                <div className="relative">
                  <img 
                    className="w-9 h-9 rounded-full border-2 border-primary" 
                    src={dashboard.user.avatarUrl || "https://via.placeholder.com/36"} 
                    alt={dashboard.user.displayName}
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border border-white"></div>
                </div>
                <span className="ml-2 font-medium">{dashboard.user.displayName}</span>
              </a>
            </Link>
          )}
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
                    <Globe className="text-white h-4 w-4" />
                  </div>
                  <span className="font-heading text-lg text-primary">CultureQuest</span>
                </div>
              </SheetTitle>
            </SheetHeader>
            
            {dashboard && (
              <div className="flex items-center mt-6 mb-6 pb-6 border-b">
                <div className="relative">
                  <img 
                    className="w-10 h-10 rounded-full border-2 border-primary" 
                    src={dashboard.user.avatarUrl || "https://via.placeholder.com/40"} 
                    alt={dashboard.user.displayName}
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border border-white"></div>
                </div>
                <div className="ml-3">
                  <span className="font-medium block">{dashboard.user.displayName}</span>
                  <span className="text-sm text-gray-500">Explorer</span>
                </div>
              </div>
            )}
            
            <nav className="flex flex-col space-y-4">
              {navigationItems.map(item => (
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
