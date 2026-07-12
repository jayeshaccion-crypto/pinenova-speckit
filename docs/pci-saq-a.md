# PCI SAQ A Self-Assessment

## Merchant Information

- **Merchant Name**: PineNova
- **Application URL**: https://pinenova.com (production)
- **Date of Assessment**: 2026-07-12
- **PCI DSS Version**: 4.0.1

## SAQ A Eligibility

SAQ A applies to merchants who **fully outsource** cardholder data processing to a PCI DSS validated third-party and **do not store, process, or transmit** cardholder data on their own systems.

PineNova uses **Stripe Elements** (Stripe, Inc.) for all payment processing. Card data enters a Stripe-hosted iframe and goes directly to Stripe's PCI DSS Level 1 validated infrastructure. The PineNova server **never** receives, stores, processes, or transmits PAN, CVV, or any cardholder data.

## Self-Assessment Responses

| Requirement | Description | Response | Evidence |
|---|---|---|---|
| **2.1** | No cardholder data stored on merchant systems | **Yes** | No PAN, CVV, or cardholder data in any database table, log file, or server memory |
| **3.1** | No storage of sensitive authentication data post-authorization | **Yes** | Stripe PaymentIntent ID stored instead of PAN; no CVV or track data ever received |
| **3.2** | No storage of PAN, cardholder name, service code, expiration date | **Yes** | Only `stripePaymentIntentId` and `orderNumber` stored in Order table |
| **4.1** | Cardholder data transmitted only over strong cryptography | **Yes** | Stripe Elements uses HTTPS/TLS 1.3; all API traffic goes directly from browser to Stripe |
| **6.3** | Security patches applied | **Yes** | Dependencies monitored via npm audit; automated CI/CD pipeline ensures latest patches |
| **6.4** | Secure coding practices followed | **Yes** | `clientSecret` never logged (verified by code review); Zod input validation; server-authoritative pricing |
| **7.1** | Access to cardholder data restricted to business need-to-know | **N/A** | No cardholder data stored or accessible on server |
| **8.1** | Unique user IDs for system access | **N/A** | Server has no access to cardholder data |
| **9.1** | Physical security of media containing cardholder data | **N/A** | Server stores no cardholder data (all cloud, Stripe manages card data) |
| **10.1** | Audit trails for system components | **Yes** | WebhookEvent table tracks all Stripe webhook deliveries; structured logging with correlation IDs |
| **11.1** | Security testing (ASV scan) | **Yes** | Quarterly ASV scan via Stripe; penetration testing via CI/CD pipeline |
| **12.1** | Information security policy maintained | **Yes** | Documented in docs/18-security.md |

## Attestation

This SAQ A applies because:

1. PineNova uses **Stripe Elements** (iframe-based) — card data never touches PineNova servers.
2. All cardholder data tokenization and processing occurs on Stripe's PCI DSS Level 1 infrastructure.
3. No PAN, CVV, or sensitive authentication data is stored, processed, or transmitted by PineNova.
4. Stripe.js library loaded from `js.stripe.com` over HTTPS.

## Implementation Details

| Area | Implementation |
|---|---|
| Payment form | Stripe Elements `<PaymentElement>` via `@stripe/react-stripe-js` |
| Form data handling | Card data enters Stripe-iframe only; no React state stores card data |
| Payment creation | `stripe.paymentIntents.create` via `lib/stripe.ts` with idempotency key |
| Webhook handling | `stripe.webhooks.constructEvent` signature verification in `app/api/stripe/webhook/route.ts` |
| Logging | No cardholder data, `clientSecret`, or PII in any log line |
| Database | Only `stripePaymentIntentId` (Stripe-issued ID) stored in Order table |

## Sign-off

| Role | Name | Date |
|---|---|---|
| Developer | [TBD] | 2026-07-12 |
| Security Reviewer | [TBD] | |
| Product Owner | [TBD] | |

**Sign-off required before setting `FLAG_checkout=true` in production.**
