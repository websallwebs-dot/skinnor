# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Patients** — anyone in the world with a suspicious skin lesion, mole, or spot who wants to track its evolution from home without waiting months for a specialist.
- **Health professionals & clinics** — dermatologists and clinical teams who want remote monitoring, similar-case lookup, clinical reports, and datasets. The landing page is also selling Skinnor to clinics as a telemedicine + monitoring tool.

## Product Purpose

Skinnor is an App-Web platform for dermatological telemedicine: patients photograph suspicious skin lesions from home, and mathematical image-processing algorithms plus AI trained on validated datasets (HAM10000, Google Derm Foundation, 10,000+ images) estimate risk, detect changes over time using the ABCDE rule, and track evolution. It connects each patient to a professional through a shared access code, and reduces initial evaluation time from a median 255-day specialist wait to under 5 minutes.

## Positioning

The mechanism a competitor could not copy-paste: ABCDE-based computer vision (Gaussian noise reduction, segmentation, edge detection with Roberts/Prewitt/Sobel operators) combined with vector similarity search (Pinecone index of the HAM10000 dataset, embeddings from Google Derm Foundation) that finds the closest real dermoscopic cases to any patient photo, with >95% classification accuracy across 7 lesion types. A bridge to specialized care rather than a replacement for it.

## Operating Context

- Patients create an account from any location, upload periodic photos of a lesion, and the system registers evolution and alerts on changes.
- A doctor shares an access code; patient and professional link, giving the professional access to the full evolution timeline, and both can communicate (monitoring).
- Professionals get a clinical panel: similar-case search (top 12 vector neighbors + metadata), evolution monitoring, AI-assisted clinical report drafting (multimodal), and dataset creation for research.

## Capabilities and Constraints

- Capabilities (from paper): photo upload & periodic registration; change detection with alerts; ABCDE criteria measurement; classification of 7 lesion types (actinic keratosis, intraepithelial carcinoma, basal cell carcinoma, benign lesions, dermatofibroma, melanoma, melanocytic nevus) at >95% accuracy; similar-case vector search; clinical report generation; dataset creation; dual patient/professional interface; code-based linking.
- Constraints: product is at prototype/demo stage; clinical validation study is planned but not completed; it is a complement to professional care, not a diagnostic device. Do not fabricate prices, real doctors, real patient testimonials, or partner institutions.
- Technologies should be mentioned superficially (OpenCV, vector search, Google Derm Foundation, Gemini, HAM10000) — the page leads with outcomes, not stack details.

## Brand Commitments

- Name: **Skinnor** (from "skin"). Spanish-language origin (Colegio Santa Cruz de Unco, Chile), but the landing page is bilingual ES/EN.
- Voice: professional and serious — clinical credibility, not hype.

## Evidence on Hand

- `Paper _Skinnor_ Colegio Santa Cruz de Unco (1).pdf` — full technical paper (stats: 1 in 5 develop cancer; 1.4M deaths 2022; Chile +40% deaths in a decade; 255-day median wait; >95% accuracy; ABCDE; HAM10000/Pinecone/Google Derm).
- `Preguntas Los Creadores 2024.pdf` — not about Skinnor (unrelated ElektroNet project). Do not use.
- `Skinnor-Impacto Emprendedor 2026.pdf` — competition application with problem/solution framing and ODS 3.
- No real prices, testimonials, partner clinics, or launch dates exist — do not invent them.

## Product Principles

1. Lead with the problem and the human cost of late detection; earn trust with real statistics.
2. Prove the mechanism: show image analysis, change detection, and evolution at work.
3. Treat professionals and patients as equal audiences with a clear path for each.
4. Keep technology talk superficial; outcomes come first.
5. Stay clinically serious: the platform complements, never replaces, professional care.

## Accessibility & Inclusion

- Bilingual ES/EN, high contrast, legible type at clinical scale; the page must not rely on color alone for meaning.