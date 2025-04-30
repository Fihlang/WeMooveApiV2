import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RegionWithProgress } from "@shared/schema";
import { Link } from "wouter";

interface CulturalMapProps {
  regions: RegionWithProgress[];
}

export default function CulturalMap({ regions }: CulturalMapProps) {
  // Find active region (if any)
  const activeRegion = regions.find(region => region.isActive);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">Your Cultural Map</h2>
          <p className="text-gray-600">Explore cultures around the world and track your progress on this interactive map.</p>
        </div>
        
        <div className="relative bg-light rounded-xl shadow-md p-4 h-[400px] overflow-hidden">
          <div className="absolute inset-0 p-4">
            <img 
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
              alt="World Map" 
              className="w-full h-full object-cover rounded-lg opacity-25"
            />
            
            {/* Map markers */}
            {regions.map(region => (
              <div 
                key={region.id}
                className={`absolute ${region.isLocked ? '' : 'map-marker-pulse'}`}
                style={{ 
                  top: region.mapPosition.top, 
                  left: region.mapPosition.left 
                }}
              >
                <div 
                  className={`
                    w-6 h-6 bg-${region.color} rounded-full flex items-center justify-center cursor-pointer z-10 relative
                    ${region.color === 'lightgray' ? 'text-dark' : 'text-white'}
                  `}
                >
                  <span className="text-xs font-medium">
                    {region.completionPercentage > 0 ? Math.floor(region.completionPercentage / 10) : 0}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Region info popup */}
            {activeRegion && (
              <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs border border-lightgray">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-heading font-semibold">{activeRegion.name}</h3>
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded">Active</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{activeRegion.description}</p>
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-primary font-medium">{activeRegion.completionPercentage}% Complete</span>
                </div>
                <Progress value={activeRegion.completionPercentage} className="w-full h-2 mt-2 mb-3" />
                <Button asChild>
                  <Link href="/puzzles">
                    Continue Exploring
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {regions.map(region => (
            <div 
              key={region.id}
              className={`
                bg-white p-3 rounded-lg border border-lightgray text-center hover:shadow-md transition-shadow
                ${region.isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <h4 className="font-heading font-medium text-sm mb-1">{region.name}</h4>
              {region.isLocked ? (
                <div className="text-xs text-gray-500 font-medium">Locked</div>
              ) : (
                <div className="text-xs text-success font-medium">{region.completionPercentage}% Complete</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
