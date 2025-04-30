import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";

export default function CulturesPage() {
  // Use hard-coded user ID 1 for now. In a real app, this would come from authentication
  const userId = 1;
  
  const { data: regions, isLoading } = useQuery({
    queryKey: ['/api/regions', { userId }],
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading cultures...</div>;
  }

  if (!regions) {
    return <div className="min-h-screen flex items-center justify-center">Failed to load cultures</div>;
  }

  // Group regions by completion status
  const activeRegions = regions.filter((r: any) => r.isActive);
  const unlockedRegions = regions.filter((r: any) => !r.isLocked && !r.isActive);
  const lockedRegions = regions.filter((r: any) => r.isLocked);

  return (
    <div className="py-12 bg-light min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="font-bold text-2xl md:text-3xl mb-4">Cultural Map</h1>
          <p className="text-gray-600 mb-6">Explore cultures around the world and track your progress on this interactive map.</p>
        </div>
        
        <div className="relative bg-white rounded-xl shadow-md p-4 h-[400px] overflow-hidden mb-8">
          <div className="absolute inset-0 p-4">
            <img 
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
              alt="World Map" 
              className="w-full h-full object-cover rounded-lg opacity-25"
            />
            
            {/* Map markers */}
            {regions.map((region: any) => (
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
                    w-6 h-6 rounded-full flex items-center justify-center cursor-pointer z-10 relative
                    bg-${region.color}
                    ${region.color === 'lightgray' ? 'text-gray-700' : 'text-white'}
                  `}
                >
                  <span className="text-xs font-medium">
                    {region.completionPercentage > 0 ? Math.floor(region.completionPercentage / 10) : 0}
                  </span>
                </div>
              </div>
            ))}
            
            {/* Active region popup */}
            {activeRegions.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs border border-lightgray">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{activeRegions[0].name}</h3>
                  <span className="bg-primary text-white text-xs px-2 py-1 rounded">Active</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{activeRegions[0].description}</p>
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="text-primary font-medium">{activeRegions[0].completionPercentage}%</span>
                </div>
                <Progress 
                  value={activeRegions[0].completionPercentage} 
                  className="h-2 mt-2 mb-3" 
                />
                <Button className="w-full" asChild>
                  <Link href="/puzzles">
                    Continue Exploring
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
            <TabsTrigger value="all">All Regions</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="locked">Locked</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regions.map((region: any) => (
                <RegionCard key={region.id} region={region} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeRegions.map((region: any) => (
                <RegionCard key={region.id} region={region} />
              ))}
              {activeRegions.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-500">No active region found. Start exploring a new region!</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="locked" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedRegions.map((region: any) => (
                <RegionCard key={region.id} region={region} />
              ))}
              {lockedRegions.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-500">You've unlocked all regions! Congratulations!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Journey Statistics</CardTitle>
            <CardDescription>Your exploration progress across different cultural regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regions.map((region: any) => (
                <div key={region.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full bg-${region.color} flex items-center justify-center mr-3`}>
                    <span className={`text-xs font-bold ${region.color === 'lightgray' ? 'text-gray-700' : 'text-white'}`}>
                      {region.name.substring(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 mr-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{region.name}</span>
                      <span className="text-sm">{region.completionPercentage}%</span>
                    </div>
                    <Progress value={region.completionPercentage} className="h-2" />
                  </div>
                  {region.isLocked ? (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Locked</span>
                  ) : region.isActive ? (
                    <span className="text-xs bg-primary text-white px-2 py-1 rounded">Active</span>
                  ) : (
                    <span className="text-xs bg-success text-white px-2 py-1 rounded">
                      {region.completionPercentage === 100 ? 'Completed' : 'In Progress'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RegionCard({ region }: { region: any }) {
  return (
    <Card className={`overflow-hidden ${region.isLocked ? 'opacity-60' : ''}`}>
      <div className="h-32 bg-gradient-to-r from-primary/40 to-secondary/40 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-full bg-${region.color} flex items-center justify-center`}>
            <span className={`text-2xl font-bold ${region.color === 'lightgray' ? 'text-gray-700' : 'text-white'}`}>
              {region.name.substring(0, 2)}
            </span>
          </div>
        </div>
        {region.isActive && (
          <span className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
            Active
          </span>
        )}
        {region.isLocked && (
          <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">
            Locked
          </span>
        )}
      </div>
      <CardHeader>
        <CardTitle>{region.name}</CardTitle>
        <CardDescription>{region.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm">Completion</span>
            <span className="text-sm font-medium">{region.completionPercentage}%</span>
          </div>
          <Progress value={region.completionPercentage} className="h-2" />
        </div>
        
        {region.isLocked ? (
          <Button className="w-full" variant="outline" disabled>
            Unlock by completing previous regions
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href="/puzzles">
              {region.isActive ? 'Continue Exploring' : 'Start Exploring'}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
