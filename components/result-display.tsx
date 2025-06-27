"use client"

import { useState } from "react"
import type { StyleType } from "@/app/page"
import { Download, Twitter, RefreshCw, Share2 } from "lucide-react"
import Image from "next/image"

interface ResultDisplayProps {
  originalImage: string
  styledImage: string
  selectedStyle: StyleType
  onReset: () => void
}

const styleNames = {
  ghibli: "GHIBLI",
  anime: "ANIME",
  cyberpunk: "CYBERPUNK",
  watercolor: "WATERCOLOR",
  neobrutalism: "BRUTAL",
  "material-design": "MATERIAL",
  minimalist: "MINIMAL",
  "art-deco": "ART DECO",
  vaporwave: "VAPORWAVE",
  sketch: "SKETCH",
  "oil-painting": "OIL PAINT",
  "pixel-art": "PIXEL ART",
}

export function ResultDisplay({ originalImage, styledImage, selectedStyle, onReset }: ResultDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const link = document.createElement("a")
      link.href = styledImage
      link.download = `styled-image-${selectedStyle}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed:", error)
    }

    setIsDownloading(false)
  }

  const handleTwitterShare = () => {
    const text = `Check out my AI-styled image created with SNAPDRAFT AI! 🎨✨ #AIArt #SNAPDRAFT #Neobrutalism`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AI Styled Image",
          text: "Check out this amazing AI-styled image!",
          url: window.location.href,
        })
      } catch (error) {
        console.error("Share failed:", error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="bg-green-400 text-black px-8 py-4 border-4 border-black font-black text-3xl uppercase inline-block shadow-[8px_8px_0px_0px_#000000] mb-4">
          ✨ GENERATION COMPLETE! ✨
        </div>
        <div className="bg-black text-white px-6 py-3 border-4 border-white font-black text-xl uppercase inline-block">
          {styleNames[selectedStyle]} STYLE
        </div>
      </div>

      {/* Image Comparison */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="text-center">
          <div className="bg-gray-400 text-black px-4 py-3 border-4 border-black font-black text-xl uppercase mb-4">
            ORIGINAL
          </div>
          <div className="relative w-full aspect-square border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
            <Image src={originalImage || "/placeholder.svg"} alt="Original" fill className="object-cover" />
          </div>
        </div>

        <div className="text-center">
          <div className="bg-red-500 text-white px-4 py-3 border-4 border-black font-black text-xl uppercase mb-4">
            {styleNames[selectedStyle]} STYLED
          </div>
          <div className="relative w-full aspect-square border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
            <Image src={styledImage || "/placeholder.svg"} alt="Styled" fill className="object-cover" />
            <div className="absolute top-4 right-4 bg-yellow-400 text-black px-3 py-2 border-2 border-black font-black text-sm uppercase">
              HIGH QUALITY
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-green-500 text-white px-8 py-4 border-4 border-black font-black text-lg uppercase hover:bg-green-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
          ) : (
            <Download className="w-5 h-5 mr-2 inline" />
          )}
          DOWNLOAD
        </button>

        <button
          onClick={handleTwitterShare}
          className="bg-blue-500 text-white px-8 py-4 border-4 border-black font-black text-lg uppercase hover:bg-blue-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
        >
          <Twitter className="w-5 h-5 mr-2 inline" />
          TWITTER
        </button>

        <button
          onClick={handleShare}
          className="bg-purple-500 text-white px-8 py-4 border-4 border-black font-black text-lg uppercase hover:bg-purple-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
        >
          <Share2 className="w-5 h-5 mr-2 inline" />
          SHARE
        </button>

        <button
          onClick={onReset}
          className="bg-gray-500 text-white px-8 py-4 border-4 border-black font-black text-lg uppercase hover:bg-gray-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all"
        >
          <RefreshCw className="w-5 h-5 mr-2 inline" />
          CREATE ANOTHER
        </button>
      </div>

      {/* Social CTA */}
      <div className="bg-cyan-400 border-8 border-black shadow-[12px_12px_0px_0px_#000000]">
        <div className="p-8 text-center">
          <div className="bg-black text-white px-6 py-3 border-4 border-white font-black text-2xl uppercase mb-4">
            🔥 SHARE YOUR CREATION! 🔥
          </div>
          <p className="font-bold text-xl uppercase mb-4">TAG US @STYLECRAFTAI ON SOCIAL MEDIA</p>
          <div className="flex justify-center gap-4">
            <div className="bg-white text-black px-4 py-2 border-4 border-black font-black text-lg uppercase">
              #AIART
            </div>
            <div className="bg-white text-black px-4 py-2 border-4 border-black font-black text-lg uppercase">
              #SNAPDRAFT
            </div>
            <div className="bg-white text-black px-4 py-2 border-4 border-black font-black text-lg uppercase">
              #NEOBRUTALISM
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
