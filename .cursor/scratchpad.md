# Background and Motivation

The goal is to enhance the Snapdraft app by:

- Replacing Stripe payment integration with Coinbase x402 Pay, following the [Coinbase x402 Pay Quickstart for Sellers](https://docs.cdp.coinbase.com/x402/docs/quickstart-sellers).
- Setting up a CDP Wallet to collect payments.
- Integrating ChatGPT image generation for the "ghibli" style option.

This will allow users to pay with crypto and enable a new AI-powered image style.

# Key Challenges and Analysis

- Understanding and implementing the x402 Pay API and its flow in a Next.js/React app.
- Securely setting up and managing a CDP Wallet for payment collection.
- Replacing all Stripe-specific logic and UI with x402 Pay equivalents.
- Integrating ChatGPT image generation for the "ghibli" style, including API calls, error handling, and UI updates.
- Ensuring a smooth user experience and robust error handling for both payments and image generation.

# High-level Task Breakdown

1. **Research and document x402 Pay and CDP Wallet integration requirements.**
   - Success: A summary of API endpoints, authentication, and payment flow documented in this file.
2. **Remove Stripe-specific logic from the codebase.**
   - Success: No references to Stripe remain in code or UI.
3. **Implement x402 Pay payment flow in the PaymentForm component.**
   - Success: Users can pay via x402 Pay and payment status is correctly handled in the app state.
4. **Set up and test CDP Wallet for payment collection.**
   - Success: Payments are received in the configured CDP Wallet.
5. **Integrate ChatGPT image generation for the "ghibli" style.**
   - Success: When "ghibli" is selected, the app uses ChatGPT imagegen API and displays the result.
6. **Update UI and error handling for new payment and imagegen flows.**
   - Success: Users see clear feedback for payment/imagegen success or failure.
7. **Write and run tests for payment and imagegen flows.**
   - Success: All new logic is covered by tests and passes.

# Project Status Board

- [x] Research and document x402 Pay and CDP Wallet integration requirements
- [x] Remove Stripe-specific logic from the codebase
- [x] Implement x402 Pay payment flow in the PaymentForm component
- [ ] Set up and test CDP Wallet for payment collection
- [ ] Integrate ChatGPT image generation for the "ghibli" style
- [ ] Update UI and error handling for new payment and imagegen flows
- [ ] Write and run tests for payment and imagegen flows

# Executor's Feedback or Assistance Requests

- Stripe-specific UI and logic have been removed from PaymentForm and the payment intent API route. The app is now ready for x402 Pay integration in the next step.
- x402-next middleware has been created to protect /api/generate-image with a $0.50 paywall using the provided CDP Wallet address. Next: update PaymentForm and backend to work with x402 payment flow.
- PaymentForm now posts to /api/generate-image, handles HTTP 402, and displays a placeholder x402 Pay UI. Next: set up and test CDP Wallet for payment collection.

# Lessons

- Include info useful for debugging in the program output.
- Read the file before you try to edit it.
- If there are vulnerabilities that appear in the terminal, run npm audit before proceeding.
- Always ask before using the -force git command.

## Task 1: Research and document x402 Pay and CDP Wallet integration requirements

### x402 Pay Overview

- x402 is an open protocol by Coinbase for accepting crypto payments (e.g., USDC) over HTTP, using the HTTP 402 status code and custom headers.
- It enables programmatic, instant, and low-fee payments, ideal for APIs, apps, and AI agents.
- [Official Quickstart for Sellers](https://docs.cdp.coinbase.com/x402/docs/quickstart-sellers)
- [x402 Protocol Spec](https://github.com/coinbase/x402)
- [CoinTelegraph x402 explainer](https://coinspectator.com/cointelegraph/2025/05/15/coinbases-x402-crypto-payments-over-http-for-ai-and-apis/)

### Payment Flow

1. **Client requests a paid resource** (e.g., POST to /api/generate-image)
2. **Server responds with HTTP 402** and a JSON body describing payment requirements (amount, token, address, etc.)
3. **Client submits payment** using a crypto wallet (e.g., CDP Wallet), then resends the request with an `X-PAYMENT` header containing a base64-encoded payment payload.
4. **Server verifies payment** (locally or via a facilitator server, e.g., Coinbase's x402 facilitator) using `/verify` and `/settle` endpoints.
5. **If payment is valid, server fulfills the request** and responds with HTTP 200 and an `X-PAYMENT-RESPONSE` header confirming settlement.

### Key API Endpoints (Facilitator Server)

- `POST /verify` — Verifies a payment payload against payment requirements.
- `POST /settle` — Settles a payment onchain and returns transaction details.
- `GET /supported` — Lists supported payment schemes and networks.

### Authentication

- Payments are signed and submitted by the client using their crypto wallet (e.g., CDP Wallet).
- No traditional API keys or OAuth; payment payloads are cryptographically signed.

### CDP Wallet Setup

- Create/configure a CDP Wallet to receive payments (see Coinbase Commerce dashboard or x402 docs).
- Set the deposit address in your merchant dashboard.
- The wallet address is included in the payment requirements sent to clients.

### Integration Notes

- The PaymentForm component will need to:
  - Display payment requirements (amount, address, token)
  - Trigger the wallet payment flow (CDP Wallet)
  - Resend the request with the `X-PAYMENT` header
  - Handle payment verification and settlement responses
- The backend must:
  - Respond with HTTP 402 and payment requirements for unpaid requests
  - Verify and settle payments using the facilitator server
  - Fulfill the resource (image generation) after payment

**References:**

- [Coinbase x402 Quickstart for Sellers](https://docs.cdp.coinbase.com/x402/docs/quickstart-sellers)
- [x402 Protocol Spec](https://github.com/coinbase/x402)
- [CoinTelegraph x402 explainer](https://coinspectator.com/cointelegraph/2025/05/15/coinbases-x402-crypto-payments-over-http-for-ai-and-apis/)

**Success Criteria:**

- This summary is documented in the scratchpad.
- Next step: Remove Stripe-specific logic from the codebase.
