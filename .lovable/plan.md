## السياق

الـ ZIP اللي رفعته مشروع كامل بـ FastAPI + MongoDB + CRA (~5000 سطر باك-إند Python + فرونت كامل). مشروعنا الحالي شغال على Vite + React + Lovable Cloud (Supabase) — مش هينفع ننسخه فوقنا، لكن ينفع ننقل كل **الـ specs والفيتشرز** عليه.

عملت تحليل سريع: الموجود فعلًا عندنا (jobs CRUD، scoring، scrape-jobs، XP/streak، embeddings، profile) يغطي حوالي 30-40% من الـ PRD. الباقي محتاج ينتقل بالتدريج.

## خطة من 5 مراحل

### المرحلة 1 — Design System (Swiss Dark)
- تطبيق `design_guidelines.json` على `index.css` + `tailwind.config.ts`:
  - ألوان Obsidian Black (`#0A0A0B`)، surface `#141415`، gamification (orange/amber/emerald/azure) كـ HSL tokens
  - خطوط: Cabinet Grotesk (headings) + Manrope (body) + JetBrains Mono (XP/scores) من Google Fonts
  - tokens للـ floating panel (glassmorphism) + dashboard card
- تثبيت `@phosphor-icons/react`
- تحديث الـ Hero / Navbar / Cards الموجودة للستايل الجديد

### المرحلة 2 — مصادر وظائف متعددة + Daily Digest
- توسيع `scrape-jobs` Edge Function لتشمل **Adzuna** و **Jooble** بجانب Remotive (parallel via `Promise.all`)
- Content-hash dedupe (SHA1 على title|company|location|source_url) → عمود جديد `content_hash` + unique index
- Edge Function جديد `daily-digest` يبعت أعلى 3 وظايف لكل user عبر Resend
- جدولة عبر pg_cron + secret `CRON_TOKEN`
- Profile toggle `digest_enabled` (موجود فعلًا) + UI زرار "Send test digest"
- Secrets جديدة: `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `JOOBLE_API_KEY`, `RESEND_API_KEY`, `SENDER_EMAIL`, `CRON_TOKEN`

### المرحلة 3 — AI Decision Engine + Career Map + Insights
- `score-job` يتطور ليرجع `decision` (apply/skip/maybe) + `reasoning` بجانب strengths/weaknesses الموجودة
- صفحة **Insights**: funnel chart (saved → applied → interview → offer) + rejection-pattern detection (LLM يلخص الأنماط من الـ rejected jobs)
- صفحة **Career Map**: kanban view لـ `job_applications` بالـ 7 statuses الموجودة (drag-drop عبر dnd-kit)
- Daily AI missions على صفحة Gamification (LLM يولّد 3 مهام يومية)

### المرحلة 4 — CV Intel + Interview Coach
- صفحة CV editor: رفع PDF → استخراج النص (pdfjs على الكلاينت) → تخزين في `profiles.cv_text` (موجود) → LLM يستخرج skills/seniority تلقائيًا
- AI Coach chat (floating panel glassmorphism) على Dashboard — chat مع LLM له سياق من الـ profile + recent jobs
- Interview prep: edge function يولّد أسئلة مخصصة بناءً على JD + CV

### المرحلة 5 — Billing + Gating + Chrome Extension (اختياري)
- Stripe checkout (Pro $19 / Team $49) عبر Lovable's Stripe integration
- Free-tier gating: 5 AI matches/شهر — جدول `match_usage(user_id, month, count)` + RLS
- UsageBanner component على Jobs/Insights
- نسخ مجلد `chrome-extension/` كما هو في الريبو (مش هيشتغل في الـ preview، بس يبقى موجود للنشر)

## ملاحظات تقنية

- كل الـ Python routes هتتحوّل لـ Supabase Edge Functions (Deno/TS). الـ MongoDB models هتترجم لجداول Postgres مع RLS.
- الـ Auth الموجود (Supabase Auth + Google) بيغطي مكان Emergent OAuth.
- LLM: هنستخدم Lovable AI Gateway (Gemini Flash للـ bulk، Gemini Pro للـ reasoning) بدل Claude — نفس النتيجة بدون API key منفصل.
- كل مرحلة هتطلب موافقتك قبل ما أبدأ — مش هنفّذ الـ 5 دفعة واحدة.

## ابدأ منين؟

أقترح نبدأ بـ **المرحلة 1 (Design System)** دلوقتي لأنها أسرع حاجة وهتغيّر شكل التطبيق فورًا، وبعدها نتحرك للمرحلة 2. وافقني على الخطة وأبدأ بمرحلة 1، أو قولي تحب نبدأ بمرحلة معيّنة.