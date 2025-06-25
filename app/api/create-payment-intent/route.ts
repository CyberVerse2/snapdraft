import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { amount = 50 } = await request.json() // $0.50 in cents

    // In a real implementation, you would use Stripe here
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    //
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount,
    //   currency: 'usd',
    //   metadata: {
    //     service: 'image-styling'
    //   }
    // })

    // For demo purposes, return a mock response
    return NextResponse.json({
      success: true,
      clientSecret: "pi_mock_client_secret",
      paymentIntentId: "pi_mock_payment_intent",
    })
  } catch (error) {
    console.error("Payment intent creation failed:", error)
    return NextResponse.json({ success: false, error: "Payment setup failed" }, { status: 500 })
  }
}
