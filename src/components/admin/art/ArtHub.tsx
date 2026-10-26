"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArtStudio } from "@/components/admin/ArtStudio";
import { CarouselStudio } from "@/components/admin/art/CarouselStudio";
import { PostCalendar } from "@/components/admin/art/PostCalendar";
import { BrandGuide } from "@/components/admin/art/BrandGuide";

/** Aba "Artes para redes": criar arte, carrossel, calendário de posts e guia da identidade. */
export function ArtHub() {
  return (
    <Tabs defaultValue="arte" className="space-y-4">
      <TabsList className="flex flex-wrap h-auto w-full justify-start sm:w-auto">
        <TabsTrigger value="arte">Criar arte</TabsTrigger>
        <TabsTrigger value="carrossel">Carrossel</TabsTrigger>
        <TabsTrigger value="calendario">Calendário de posts</TabsTrigger>
        <TabsTrigger value="guia">Guia da identidade</TabsTrigger>
      </TabsList>
      <TabsContent value="arte" className="mt-0">
        <ArtStudio />
      </TabsContent>
      <TabsContent value="carrossel" className="mt-0">
        <CarouselStudio />
      </TabsContent>
      <TabsContent value="calendario" className="mt-0">
        <PostCalendar />
      </TabsContent>
      <TabsContent value="guia" className="mt-0">
        <BrandGuide />
      </TabsContent>
    </Tabs>
  );
}
