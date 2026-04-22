import Image from "next/image";
import Link from "next/link";
import { MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Artisan } from "@/lib/data";
export function ArtisanCard({ artisan, className }) {
    const imageSrc = artisan.image || "/images/artisans/artisan.webp";
    return (<div className={cn("group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5", className)}>
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image src={imageSrc} alt={artisan.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"/>
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"/>
        
        {/* Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-serif text-xl font-bold text-foreground">
            {artisan.name}
          </h3>
          <p className="mt-1 text-sm text-primary font-medium">
            {artisan.specialty}
          </p>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4"/>
              {artisan.district}
            </span>
            <span className="flex items-center gap-1">
              <Award className="h-4 w-4"/>
              {artisan.yearsOfExperience}+ years
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {artisan.bio}
          </p>
          <Button variant="secondary" size="sm" className="mt-4 w-full" asChild>
            <Link href={`/artisans/${artisan.id}`}>
              Read Story
            </Link>
          </Button>
        </div>
      </div>
    </div>);
}
