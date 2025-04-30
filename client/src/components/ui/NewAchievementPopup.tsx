import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

interface NewAchievementPopupProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClose: () => void;
}

export default function NewAchievementPopup({
  title,
  description,
  icon,
  color = "secondary",
  onClose
}: NewAchievementPopupProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Make popup visible with animation
    const timer = setTimeout(() => {
      setVisible(true);
    }, 300);
    
    // Auto close after 10 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 10000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, []);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  return (
    <div 
      className={`
        fixed bottom-4 right-4 bg-white rounded-xl shadow-lg p-6 border border-${color}
        transition-all duration-300 z-50
        ${visible ? 'opacity-100 transform translate-y-0 achievement-pop' : 'opacity-0 transform translate-y-8'}
      `}
      style={{ width: '18rem' }}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-6 w-6" 
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
      
      <div className="text-center">
        <div className={`w-16 h-16 rounded-full bg-${color} flex items-center justify-center mx-auto mb-3`}>
          <i className={`fas ${icon} ${color === 'secondary' ? 'text-dark' : 'text-white'} text-2xl`}></i>
        </div>
        <h4 className="font-heading font-semibold text-lg mb-1">New Achievement!</h4>
        <p className="text-gray-600 text-sm mb-3">{`You've unlocked "${title}" for ${description}`}</p>
        <Button asChild className="w-full">
          <Link href="/achievements">
            View Achievement
          </Link>
        </Button>
      </div>
    </div>
  );
}
