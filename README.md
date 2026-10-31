# Dearly — An Intelligent Personal Digital Journal

> *"Your life, in your words. Your journey, remembered."*

**Dearly** is a private, AI-powered digital journaling application designed with the emotional warmth of a physical notebook, the visual sophistication of an Apple lifestyle application, the creative freedom of a digital scrapbook, and the grounded intelligence of an empathetic AI companion.

---

## ✨ Signature Features

### 1. Realistic Digital Diary Reader
- **Two-Page Book Spread**: Authentic two-page journal layout on desktop and tablet with centered spine depth; responsive single page on mobile.
- **Paper & Typography**: Warm ivory background (`#FAF8F4`), cream paper (`#FFFDF8`), Cormorant Garamond serif headings, Caveat/Patrick Hand handwritten body, and fine notebook ruled lines.
- **Dynamic Editorial Headers**: Formatted automatically with day of the week and date (e.g. `JUNE 19 · FRIDAY`), weather, and inspirational quote.
- **Tactile Scrapbook Elements**: Real polaroid frames, washi tape strips (sage, rose, butter, craft), and decorative stickers (botanical, gold stars, rose hearts, paperclips).
- **Smooth Page Turns**: Realistic page navigation with subtle sound feedback via Web Audio API.

### 2. Distraction-Free Journal Editor
- **Writing & Reading Modes**: Seamless toggle between comfortable writing and editorial diary reading.
- **Debounced Auto-Save**: Real-time status feedback (`Saving thoughts...`, `All changes saved`, `Unable to save`).
- **Formatting Toolbar**: Handwriting styles (`Caveat`, `Patrick Hand`, `Cormorant`, `Inter`), font size, notebook ruling toggle, paper theme selection.
- **Media & Scrapbooking**: Upload photographs from device or web, select polaroid/tape frames, adjust tilt rotation, add captions, and place decorative stickers.

### 3. Deeply Personalized AI Companion (RAG)
- **Calm, Thoughtful Presence**: Empathetic without sentimentality, practical without judgment, and never fabricates memories.
- **Grounded Citations**: Every AI reflection links directly to the specific journal entries that support it. Clicking a citation pill jumps straight to that entry in the diary reader.
- **6 Core Functional Features**:
  1. **🌱 Remind Me Who I Am**: When self-doubt strikes, retrieves documented struggles overcome and past achievements with exact dates.
  2. **🔍 Understand My Patterns**: Identifies recurring themes, emotional correlations, and repeated hesitations as gentle observations.
  3. **⚖️ What Could I Have Done Differently?**: Objectively breaks down difficult conversations into facts vs assumptions and offers constructive alternatives.
  4. **⏳ Talk to My Past Self**: Answers what you were worried about or experiencing six months ago.
  5. **🍁 Monthly Reflections**: Generates a structured monthly review draft highlighting key milestones, recurring challenges, and lessons learned.
  6. **✨ Daily Journaling Prompts**: Introspective questions that can be inserted directly into your journal page with one click.
- **Pluggable Architecture**: Runs out-of-the-box with a built-in Local Grounded RAG engine, with plug-and-play support for Google Gemini (`GEMINI_API_KEY`) and OpenAI.

### 4. Personal Bookshelf
- Realistic physical diary covers with spine textures (linen, leather, paper, craft) and gold foil stamping.
- Organize distinct journals for morning pages, creative writing, travel, or work.

### 5. Calendar & Memory Search
- Monthly interactive calendar with entry dots colored by mood (`peaceful`, `joyful`, `contemplative`, `anxious`, `energetic`, `grateful`).
- Full-text search across titles, entries, quotes, and photographs.

### 6. Goals & Documented Milestones
- Track quiet intentions by status (`in_progress`, `achieved`, `paused`).
- Celebrating accomplished goals with gentle celebratory confetti and linking to supporting diary entries.

### 7. Data Privacy & Sovereignty
- Private SQLite database with WAL mode and foreign key enforcement.
- 1-Click Export of all data as a formatted **Markdown bundle** or clean **JSON archive**.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js (ES Modules), Express, Better-SQLite3, JWT, Multer, Bcrypt.js |
| **AI / RAG** | Token-weighted Lexical & Semantic Retrieval, Local Grounded RAG Engine, Google Gemini API Adapter |
| **DevOps / Cloud** | Docker (multi-stage build), Docker Compose, AWS ECS Fargate, ALB, Amazon EFS, Amazon S3, CloudFront, CloudFormation |

---

## 🚀 Quickstart (Local Development)

### Prerequisites
- Node.js v20+ and npm

### 1. Install Dependencies
```bash
# Install root, server, and client packages
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Run Automated Tests
```bash
# Runs both unit and integration tests (13 tests)
npm --prefix server test
```

### 3. Run Development Servers
```bash
# Terminal 1: Run Backend API Server (Port 5000)
npm run dev:server

# Terminal 2: Run Frontend Vite Dev Server (Port 5173 with proxy to 5000)
npm run dev:client
```
Visit `http://localhost:5173` in your browser.

> **Instant Demo Evaluation**: On the landing page, click **"Explore Demo Journal (Clara)"** to instantly log in as Clara Montgomery with 6 months of authentic journal entries, goals, milestones, and scrapbook photos!

---

## 🐳 Docker & Production Build

```bash
# Build frontend and serve unified app from Node.js
npm --prefix client run build
npm --prefix server start
```

Or run via Docker:
```bash
docker compose up --build -d
```
Visit `http://localhost:5000`.

---

## ☁️ AWS Cloud Deployment

Refer to [`AWS_DEPLOYMENT.md`](./AWS_DEPLOYMENT.md) for full instructions on deploying to **AWS ECS Fargate**, **Application Load Balancer**, **Amazon EFS**, and **Amazon S3** using CloudFormation.
