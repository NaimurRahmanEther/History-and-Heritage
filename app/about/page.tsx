import Image from "next/image";
import Link from "next/link";
import { Heart, Users, Globe, Leaf, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const values = [
  {
    icon: Heart,
    title: "Supporting Artisans",
    description: "We provide fair trade opportunities that ensure artisans receive fair compensation for their work, enabling them to support their families and communities.",
  },
  {
    icon: Globe,
    title: "Preserving Heritage",
    description: "Our mission is to keep traditional Bangladeshi crafts alive by connecting artisans with global markets and raising awareness about these precious art forms.",
  },
  {
    icon: Users,
    title: "Community Impact",
    description: "Every purchase directly impacts rural communities, creating sustainable livelihoods and preserving cultural traditions for future generations.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description: "Most traditional crafts use natural, sustainable materials. We promote eco-friendly practices throughout our supply chain.",
  },
];

const stats = [
  { value: "500+", label: "Artisan Families Supported" },
  { value: "64", label: "Districts Covered" },
  { value: "15,000+", label: "Products Delivered" },
  { value: "98%", label: "Customer Satisfaction" },
];

const team = [
  {
    name: "Ayesha Rahman",
    role: "Founder & CEO",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    bio: "Passionate about preserving Bangladeshi heritage and empowering rural artisans.",
  },
  {
    name: "Karim Ahmed",
    role: "Head of Artisan Relations",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    bio: "Works directly with artisan communities across all 64 districts.",
  },
  {
    name: "Fatima Begum",
    role: "Creative Director",
    image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=80",
    bio: "Curates our collection and works with artisans on product development.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border py-16 lg:py-24">
          <div className="absolute inset-0 -z-10">
            <Image
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80"
              alt="Bangladeshi crafts"
              fill
              className="object-cover opacity-10"
            />
          </div>
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Award className="h-4 w-4" />
                Our Story
              </span>
              <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight text-foreground lg:text-5xl text-balance">
                Connecting Heritage to the World
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed text-pretty">
                Bangladesh Heritage Crafts was founded with a simple mission: to bring the 
                incredible artistry of Bangladeshi craftspeople to a global audience while 
                ensuring fair compensation and sustainable livelihoods for artisan communities.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                  Our Mission
                </h2>
                <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                  For centuries, the artisans of Bangladesh have created some of the world's 
                  most beautiful handcrafted products. From the legendary Jamdani weavers of 
                  Dhaka to the Nakshi Kantha embroiderers of rural Bengal, these craftspeople 
                  carry forward traditions that are part of humanity's cultural heritage.
                </p>
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  Yet many of these artisans struggle to find markets for their work. Traditional 
                  crafts face the threat of extinction as younger generations seek other opportunities. 
                  We exist to change this narrative.
                </p>
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  By connecting artisans directly with conscious consumers worldwide, we ensure 
                  that these crafts not only survive but thrive, providing dignified livelihoods 
                  for artisan families while preserving Bangladesh's rich cultural heritage.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80"
                      alt="Artisan weaving"
                      width={300}
                      height={400}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80"
                      alt="Traditional pottery"
                      width={300}
                      height={200}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="overflow-hidden rounded-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80"
                      alt="Bamboo weaving"
                      width={300}
                      height={200}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden rounded-lg">
                    <Image
                      src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80"
                      alt="Jamdani fabric"
                      width={300}
                      height={400}
                      className="h-64 w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="border-y border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                Our Values
              </h2>
              <p className="mt-4 text-muted-foreground">
                The principles that guide everything we do
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value) => (
                <div key={value.title} className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-serif text-5xl font-bold text-primary-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-primary-foreground/80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                Our Team
              </h2>
              <p className="mt-4 text-muted-foreground">
                Dedicated to connecting artisans with the world
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-full">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-primary">{member.role}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border bg-card py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground lg:text-4xl">
                Join Our Mission
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Whether you're looking for authentic handcrafted products, want to support 
                artisan communities, or are an artisan yourself looking for fair trade 
                opportunities, we'd love to connect with you.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/products">
                    Shop Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/artisans">
                    Meet Our Artisans
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
