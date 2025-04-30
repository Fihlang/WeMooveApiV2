import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-primary to-[#7A67DD] text-white">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">Discover the World Through Play</h2>
          <p className="text-lg md:text-xl opacity-90 mb-8">Solve puzzles, uncover cultural wonders, and collect achievements as you travel the globe virtually.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-secondary text-dark hover:bg-secondary/90">
              <Link href="#start-journey">
                Start Your Journey
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-white/40">
              <Link href="#how-it-works">
                How It Works
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-10">
        <div className="absolute transform rotate-12 right-0 top-0 w-96 h-96 bg-white rounded-full"></div>
        <div className="absolute transform -rotate-12 right-20 top-40 w-60 h-60 bg-white rounded-full"></div>
      </div>
    </section>
  );
}
