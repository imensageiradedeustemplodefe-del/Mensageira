"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      const fadeTimer = setTimeout(onComplete, 300);
      return () => clearTimeout(fadeTimer);
    }
  }, [isVisible, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center gap-8 px-6 animate-in zoom-in-50 duration-500">
        <Image
          src="/images/logo-icon.png"
          alt="Mensageira de Deus"
          width={128}
          height={128}
          className="w-32 h-32 object-contain drop-shadow-2xl"
          priority
        />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Mensageira de Deus</h1>
          <p className="text-lg text-white/90">Templo de Fé</p>
        </div>

        <div className="max-w-md text-center px-4">
          <p className="text-white/95 italic text-sm leading-relaxed">
            &quot;Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele
            crê não pereça, mas tenha a vida eterna.&quot;
          </p>
          <p className="text-white/80 text-xs mt-2 font-semibold">João 3:16</p>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
          <span className="text-white/90 text-sm">Carregando...</span>
        </div>
      </div>
    </div>
  );
};
