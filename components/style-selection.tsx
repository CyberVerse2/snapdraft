"use client"

import { useState } from "react"
import type { StyleType } from "@/app/page"
import { Palette, Sparkles, Zap } from "lucide-react"
import Image from "next/image"

interface StyleSelectionProps {
  originalImage: string
  onStyleSelect: (style: StyleType) => void
}

const styleCategories = {
  artistic: {
    name: "ARTISTIC",
    icon: Palette,
    styles: [
      {
        id: "ghibli" as StyleType,
        name: "GHIBLI",
        description: "DREAMY ANIMATION",
        color: "bg-green-400",
        popular: true,
      },
      {
        id: "anime" as StyleType,
        name: "ANIME",
        description: "JAPANESE STYLE",
        color: "bg-pink-400",
        popular: true,
      },
      {
        id: "watercolor" as StyleType,
        name: "WATERCOLOR",
        description: "SOFT PAINTING",
        color: "bg-blue-400",
      },
      {
        id: "oil-painting" as StyleType,
        name: "OIL PAINT",
        description: "CLASSIC ART",
        color: "bg-orange-400",
      },
      {
        id: "sketch" as StyleType,
        name: "SKETCH",
        description: "PENCIL DRAWN",
        color: "bg-gray-400",
      },
    ],
  },
  modern: {
    name: "MODERN",
    icon: Sparkles,
    styles: [
      {
        id: "neobrutalism" as StyleType,
        name: "BRUTAL",
        description: "RAW & BOLD",
        color: "bg-red-500",
        trending: true,
      },
      {
        id: "material-design" as StyleType,
        name: "MATERIAL",
        description: "GOOGLE STYLE",
        color: "bg-blue-500",
        trending: true,
      },
      {
        id: "minimalist" as StyleType,
        name: "MINIMAL",
        description: "CLEAN & SIMPLE",
        color: "bg-gray-300",
      },
      {
        id: "art-deco" as StyleType,
        name: "ART DECO",
        description: "LUXURY GLAM",
        color: "bg-yellow-400",
      },
    ],
  },
  digital: {
    name: "DIGITAL",
    icon: Zap,
    styles: [
      {
        id: "cyberpunk" as StyleType,
        name: "CYBERPUNK",
        description: "NEON FUTURE",
        color: "bg-cyan-400",
        popular: true,
      },
      {
        id: "vaporwave" as StyleType,
        name: "VAPORWAVE",
        description: "RETRO FUTURE",
        color: "bg-purple-400",
      },
      {
        id: "pixel-art" as StyleType,
        name: "PIXEL ART",
        description: "8-BIT RETRO",
        color: "bg-green-500",
      },
    ],
  },
}

export function StyleSelection({ originalImage, onStyleSelect }: StyleSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("artistic")

  return (
    <div className="space-y-8">
      {/* Original Image Display */}
      <div className="text-center">
        <div className="relative w-64 h-64 mx-auto border-8 border-black shadow-[8px_8px_0px_0px_#000000] mb-4">
          <Image src={originalImage || "/placeholder.svg"} alt="Original" fill className="object-cover" />
        </div>
        <div className="bg-black text-white px-4 py-2 border-4 border-black font-black text-lg uppercase inline-block">
          ORIGINAL IMAGE
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center space-x-4">
        {Object.entries(styleCategories).map(([key, category]) => {
          const IconComponent = category.icon
          const isActive = selectedCategory === key
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-6 py-4 border-4 border-black font-black text-lg uppercase transition-all ${
                isActive
                  ? "bg-yellow-400 text-black shadow-[4px_4px_0px_0px_#000000]"
                  : "bg-white text-black hover:bg-gray-200 hover:shadow-[4px_4px_0px_0px_#000000]"
              }`}
            >
              <IconComponent className="h-5 w-5 mr-2 inline" />
              {category.name}
            </button>
          )
        })}
      </div>

      {/* Style Grid */}
      {Object.entries(styleCategories).map(([key, category]) => {
        if (selectedCategory !== key) return null

        return (
          <div key={key} className="space-y-6">
            <div className="text-center">
              <div className="bg-black text-white px-8 py-4 border-4 border-black font-black text-2xl uppercase inline-block">
                {category.name} STYLES
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.styles.map((style) => (
                <div
                  key={style.id}
                  onClick={() => onStyleSelect(style.id)}
                  className="cursor-pointer transition-all hover:scale-105 group"
                >
                  <div className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000000] hover:shadow-[12px_12px_0px_0px_#000000] transition-all">
                    {/* Style Badge */}
                    {style.popular && (
                      <div className="bg-orange-500 text-white px-3 py-1 border-b-4 border-black font-black text-sm uppercase">
                        🔥 POPULAR
                      </div>
                    )}
                    {style.trending && (
                      <div className="bg-green-500 text-white px-3 py-1 border-b-4 border-black font-black text-sm uppercase">
                        ⚡ TRENDING
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      {/* Style Preview */}
                      <div className={`relative w-full h-40 border-4 border-black ${style.color}`}>
                        <Image
                          src="/placeholder.svg?height=160&width=200"
                          alt={style.name}
                          fill
                          className="object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black text-white px-4 py-2 border-2 border-white font-black text-lg uppercase">
                            {style.name}
                          </div>
                        </div>
                      </div>

                      {/* Style Info */}
                      <div className="text-center space-y-2">
                        <h4 className="font-black text-2xl uppercase">{style.name}</h4>
                        <p className="font-bold text-lg uppercase tracking-wide text-gray-600">{style.description}</p>
                      </div>

                      {/* Select Button */}
                      <button className="w-full bg-black text-white py-3 border-4 border-black font-black text-lg uppercase hover:bg-gray-800 transition-colors">
                        SELECT STYLE
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Bottom CTA */}
      <div className="text-center">
        <div className="bg-cyan-400 text-black px-8 py-4 border-4 border-black font-black text-xl uppercase inline-block">
          ⚡ FREE PREVIEW BEFORE PAYMENT ⚡
        </div>
      </div>
    </div>
  )
}
