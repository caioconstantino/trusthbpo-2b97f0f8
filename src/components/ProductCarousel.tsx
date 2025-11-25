import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface Product {
  id: number;
  title: string;
  price: string;
  gradient: string;
  image?: string;
}

const products: Product[] = [
  {
    id: 1,
    title: "CERTIFICADO DIGITAL",
    price: "R$ 189,00",
    gradient: "from-purple-600 via-blue-600 to-cyan-500",
  },
  {
    id: 2,
    title: "SISTEMA COMPLETO",
    price: "R$ 299,00",
    gradient: "from-pink-500 via-rose-500 to-orange-500",
  },
  {
    id: 3,
    title: "SUPORTE PREMIUM",
    price: "R$ 149,00",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    id: 4,
    title: "TREINAMENTO ONLINE",
    price: "R$ 99,00",
    gradient: "from-indigo-500 via-purple-500 to-pink-500",
  },
];

export const ProductCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: "start",
      containScroll: "trimSnaps",
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] xl:flex-[0_0_25%]"
            >
              <div className={`relative h-64 rounded-lg bg-gradient-to-br ${product.gradient} p-6 flex flex-col justify-between overflow-hidden group/card hover:scale-[1.02] transition-transform duration-300`}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12" />
                
                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-2xl mb-2 drop-shadow-lg">
                    {product.title}
                  </h3>
                </div>

                {/* Price and Icon */}
                <div className="relative z-10 flex items-end justify-between">
                  <div className="text-white">
                    <p className="text-3xl font-bold drop-shadow-lg">{product.price}</p>
                  </div>
                  
                  {/* Lock Icon Placeholder */}
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover/card:scale-110 transition-transform duration-300">
                    <div className="w-16 h-16 bg-gradient-to-br from-white/40 to-white/20 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-white drop-shadow-lg"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/card:translate-x-[200%] transition-transform duration-1000" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        onClick={scrollNext}
        disabled={!canScrollNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};
