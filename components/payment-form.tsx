"use client"

import { useState } from "react"
import type { StyleType } from "@/app/page"
import { CreditCard, Shield, Zap } from "lucide-react"
import Image from "next/image"

interface PaymentFormProps {
  originalImage: string
  selectedStyle: StyleType
  onPaymentSuccess: () => void
  onStyledImageGenerated: (imageUrl: string) => void
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

export function PaymentForm({
  originalImage,
  selectedStyle,
  onPaymentSuccess,
  onStyledImageGenerated,
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsProcessing(false)
    onPaymentSuccess()

    // Start image generation
    setIsGenerating(true)

    // Simulate AI image generation
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const styledImageUrl = "/placeholder.svg?height=512&width=512"

    setIsGenerating(false)
    onStyledImageGenerated(styledImageUrl)
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
          <div className="bg-black text-white p-4 border-b-8 border-black">
            <h3 className="text-2xl font-black uppercase text-center">ORDER SUMMARY</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="relative w-full h-48 border-8 border-black shadow-[4px_4px_0px_0px_#000000]">
              <Image src={originalImage || "/placeholder.svg"} alt="Original" fill className="object-cover" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg uppercase">STYLE:</span>
                <div className="bg-yellow-400 text-black px-4 py-2 border-4 border-black font-black text-lg uppercase">
                  {styleNames[selectedStyle]}
                </div>
              </div>

              <div className="border-t-4 border-black pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-black text-2xl uppercase">TOTAL:</span>
                  <span className="bg-red-500 text-white px-6 py-3 border-4 border-black font-black text-2xl">
                    $0.50
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
          <div className="bg-black text-white p-4 border-b-8 border-black">
            <h3 className="text-2xl font-black uppercase text-center">
              <CreditCard className="h-6 w-6 mr-2 inline" />
              PAYMENT
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="bg-green-400 text-black p-4 border-4 border-black">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-black text-lg uppercase">SECURE PAYMENT</span>
                </div>
                <p className="font-bold uppercase text-sm">PROTECTED BY STRIPE • NO CARD DETAILS STORED</p>
              </div>

              <div className="bg-blue-400 text-black p-4 border-4 border-black">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-black text-lg uppercase">INSTANT GENERATION</span>
                </div>
                <p className="font-bold uppercase text-sm">HIGH-QUALITY IMAGE READY IN 60 SECONDS</p>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing || isGenerating}
              className="w-full bg-red-500 text-white py-6 border-4 border-black font-black text-xl uppercase hover:bg-red-600 shadow-[4px_4px_0px_0px_#000000] hover:shadow-[8px_8px_0px_0px_#000000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-4 border-white mr-3 inline-block"></div>
              )}
              {isGenerating && <div className="animate-pulse mr-3 inline">🎨</div>}
              {isProcessing ? "PROCESSING PAYMENT..." : isGenerating ? "GENERATING IMAGE..." : "PAY $0.50 & GENERATE"}
            </button>

            <p className="text-center font-bold uppercase text-sm">BY CLICKING YOU AGREE TO OUR TERMS</p>
          </div>
        </div>
      </div>

      {/* Generation Status */}
      {isGenerating && (
        <div className="bg-yellow-400 border-8 border-black shadow-[8px_8px_0px_0px_#000000]">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-8 border-black border-t-red-500"></div>
              <div>
                <div className="bg-black text-white px-4 py-2 border-4 border-white font-black text-xl uppercase mb-2">
                  🎨 CREATING MASTERPIECE...
                </div>
                <p className="font-bold text-lg uppercase">THIS USUALLY TAKES 30-60 SECONDS</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
