"use client"

import { useState } from "react"
import { ImageUpload } from "@/components/image-upload"
import { StyleSelection } from "@/components/style-selection"
import { PaymentForm } from "@/components/payment-form"
import { ResultDisplay } from "@/components/result-display"
import { StylePreview } from "@/components/style-preview"

export type StyleType =
  | "ghibli"
  | "anime"
  | "cyberpunk"
  | "watercolor"
  | "neobrutalism"
  | "material-design"
  | "minimalist"
  | "art-deco"
  | "vaporwave"
  | "sketch"
  | "oil-painting"
  | "pixel-art"

export interface AppState {
  step: "upload" | "style" | "preview" | "payment" | "result"
  originalImage: string | null
  selectedStyle: StyleType | null
  previewImage: string | null
  styledImage: string | null
  paymentCompleted: boolean
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    step: "upload",
    originalImage: null,
    selectedStyle: null,
    previewImage: null,
    styledImage: null,
    paymentCompleted: false,
  })

  const handleImageUpload = (imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      originalImage: imageUrl,
      step: "style",
    }))
  }

  const handleStyleSelect = (style: StyleType) => {
    setState((prev) => ({
      ...prev,
      selectedStyle: style,
      step: "preview",
    }))
  }

  const handlePreviewGenerated = (previewUrl: string) => {
    setState((prev) => ({
      ...prev,
      previewImage: previewUrl,
    }))
  }

  const handleProceedToPayment = () => {
    setState((prev) => ({
      ...prev,
      step: "payment",
    }))
  }

  const handlePaymentSuccess = () => {
    setState((prev) => ({
      ...prev,
      paymentCompleted: true,
      step: "result",
    }))
  }

  const handleStyledImageGenerated = (imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      styledImage: imageUrl,
    }))
  }

  const resetApp = () => {
    setState({
      step: "upload",
      originalImage: null,
      selectedStyle: null,
      previewImage: null,
      styledImage: null,
      paymentCompleted: false,
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Neobrutalist Header */}
      <div className="bg-black text-white border-b-8 border-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tight mb-4">STYLECRAFT</h1>
            <div className="bg-lime-400 text-black px-6 py-3 inline-block border-4 border-black font-black text-xl uppercase tracking-wide">
              AI IMAGE TRANSFORMER
            </div>
            <div className="mt-6 bg-red-500 text-white px-4 py-2 inline-block border-4 border-black font-bold text-lg uppercase">
              $0.50 PER IMAGE
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-center space-x-4">
            {["UPLOAD", "STYLE", "PREVIEW", "PAY", "RESULT"].map((step, index) => {
              const currentStepIndex = ["upload", "style", "preview", "payment", "result"].indexOf(state.step)
              const isActive = index <= currentStepIndex
              const isCurrent = index === currentStepIndex

              return (
                <div
                  key={step}
                  className={`px-4 py-2 border-4 border-black font-black text-sm uppercase ${
                    isCurrent
                      ? "bg-yellow-400 text-black"
                      : isActive
                        ? "bg-green-400 text-black"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border-8 border-black shadow-[12px_12px_0px_0px_#000000]">
            <div className="bg-black text-white p-6 border-b-8 border-black">
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-center">
                {state.step === "upload" && "UPLOAD YOUR IMAGE"}
                {state.step === "style" && "CHOOSE YOUR STYLE"}
                {state.step === "preview" && "PREVIEW YOUR STYLE"}
                {state.step === "payment" && "COMPLETE PAYMENT"}
                {state.step === "result" && "YOUR STYLED IMAGE"}
              </h2>
              <p className="text-center mt-2 text-lg font-bold uppercase tracking-wide">
                {state.step === "upload" && "DROP IT LIKE IT'S HOT"}
                {state.step === "style" && "PICK YOUR POISON"}
                {state.step === "preview" && "SEE BEFORE YOU BUY"}
                {state.step === "payment" && "SECURE & FAST"}
                {state.step === "result" && "DOWNLOAD & SHARE"}
              </p>
            </div>

            <div className="p-8">
              {state.step === "upload" && <ImageUpload onImageUpload={handleImageUpload} />}

              {state.step === "style" && state.originalImage && (
                <StyleSelection originalImage={state.originalImage} onStyleSelect={handleStyleSelect} />
              )}

              {state.step === "preview" && state.originalImage && state.selectedStyle && (
                <StylePreview
                  originalImage={state.originalImage}
                  selectedStyle={state.selectedStyle}
                  onPreviewGenerated={handlePreviewGenerated}
                  onProceedToPayment={handleProceedToPayment}
                  onBackToStyles={() => setState((prev) => ({ ...prev, step: "style" }))}
                />
              )}

              {state.step === "payment" && state.originalImage && state.selectedStyle && (
                <PaymentForm
                  originalImage={state.originalImage}
                  selectedStyle={state.selectedStyle}
                  onPaymentSuccess={handlePaymentSuccess}
                  onStyledImageGenerated={handleStyledImageGenerated}
                />
              )}

              {state.step === "result" && state.styledImage && (
                <ResultDisplay
                  originalImage={state.originalImage!}
                  styledImage={state.styledImage}
                  selectedStyle={state.selectedStyle!}
                  onReset={resetApp}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Neobrutalist Footer */}
      <div className="bg-black text-white border-t-8 border-black mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-cyan-400 text-black px-6 py-3 inline-block border-4 border-white font-black text-xl uppercase mb-4">
              MADE WITH BRUTAL LOVE
            </div>
            <p className="font-bold uppercase tracking-wide">© 2024 STYLECRAFT AI</p>
          </div>
        </div>
      </div>
    </div>
  )
}
