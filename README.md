# AI-Powered CSV Importer for GrowEasy CRM

An intelligent, production-ready, full-stack application designed to import contact lists of any layout and column naming configuration, map them to the GrowEasy CRM target schema using Google Gemini AI, process records in real-time batches, and stream import diagnostics back to the user via a sleek dashboard.

---

## 📸 Screenshots

### 1. Upload Leads Screen (Drag & Drop)
![Upload Screen](https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=1200&h=600&q=80)

### 2. CSV Table Preview (No AI Processing Yet)
![Preview Screen](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&h=600&q=80)

### 3. Real-Time Streaming Import Sequence
![Streaming Import Screen](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=600&q=80)

---

## ✨ Features

- **Dynamic Column Mapping**: Intelligently matches arbitrary column layouts (e.g., `primary contact`, `customer mobile`, `phone no` -> `mobile_without_country_code`).
- **Resilient Fallback Mode**: Automatically falls back to a high-fidelity local mapping engine (regex, synonym lookups, distance metrics) if `GEMINI_API_KEY` is not provided.
- **Sequential Batch Processing**: Splits CSV datasets into groups of 25 records to optimize token limits and API request success rates.
- **NDJSON Progress Streaming**: Streams real-time processing status, records counters, active engine, and estimated remaining times to the client interface using line-delimited JSON.
- **Retry Mechanism**: Automatically retries failed Gemini batches up to 3 times before fallback execution, ensuring high availability.
- **CRM Integrity Filters**: Skip records missing both email and mobile numbers. Limits values to allowed CRM Statuses and CRM Data Sources.
- **Multi-Contact Splitting**: Splits multiple phone numbers or emails in a single cell, mapping the first to the main record and routing subsequent ones to the notes section.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Animations**: Framer Motion
- **Tables**: TanStack Table (React Table)
- **Form State**: React Hook Form
- **CSV Parser**: PapaParse
- **Drag & Drop**: React Dropzone
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js & TypeScript
- **Framework**: Express
- **File Upload Handler**: Multer
- **CSV Stream Parser**: csv-parser
- **Validations**: Zod
- **AI Engine**: Google Gen AI SDK (`@google/genai`)
- **Environment**: dotenv, cors

---

## 📂 Folder Structure

```text
├── backend/
│   ├── src/
│   │   ├── config/          # Configurations (Gemini API config)
│   │   ├── controllers/     # Route Controllers (Upload & Process streaming)
│   │   ├── middleware/      # Middleware definitions
│   │   ├── prompts/         # AI System instructions and User prompts templates
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Services layer (Gemini API mapping & Rule fallback)
│   │   └── utils/           # Buffer stream CSV parsers
│   ├── .env                 # Environment variables config
│   ├── tsconfig.json        # TypeScript configuration
│   └── package.json         # Node.js dependencies
└── frontend/
    ├── app/                 # Next.js App Router templates (pages, layout, styles)
    ├── components/
    │   ├── crm/             # Importer UI screens (Upload, Preview, Importing, Results)
    │   └── ui/              # Reusable design wrappers (Card, Button, Progress, Table, Input)
    ├── hooks/               # useCsvImport React hook
    ├── lib/                 # Core utilities (classname merging helpers)
    ├── types/               # TypeScript schemas
    ├── tsconfig.json        # TypeScript configuration
    └── package.json         # Frontend Node.js dependencies
```

---

## 🔑 Environment Variables

### Backend Config (`backend/.env`)

Configure a `.env` file in the `backend/` directory:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

*Note: If `GEMINI_API_KEY` is omitted, the application will automatically fall back to rule-based parsing.*

### Frontend Config (`frontend/.env.local` or environment config)

Create a `.env.local` file in the `frontend/` directory (optional - defaults to `http://localhost:5000`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🤖 Gemini API Setup

To get your API Key for Gemini mapping:
1. Navigate to [Google AI Studio](https://aistudio.google.com/).
2. Log in with your Google account credentials.
3. Click on the **Get API Key** button on the top sidebar.
4. Click **Create API Key** (choose a Google Cloud project).
5. Copy your generated API Key and paste it as `GEMINI_API_KEY` in `backend/.env`.

---

## 🚀 Running the Project

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18+) and **npm** installed on your system.

### 1. Run the Backend
```bash
cd backend
npm install
npm run dev
```
The server will spin up and run on [http://localhost:5000](http://localhost:5000).

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
The application will boot and run on [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deployment Links

### Frontend Deployment
- **Platform**: Vercel
- **Production URL**: [https://groweasy-csv-importer.vercel.app](https://groweasy-csv-importer.vercel.app) *(placeholder)*
- **Configuration**: Set `NEXT_PUBLIC_API_URL` to point to your live backend endpoint.

### Backend Deployment
- **Platform**: Render or Railway
- **Production URL**: [https://groweasy-csv-importer-backend.onrender.com](https://groweasy-csv-importer-backend.onrender.com) *(placeholder)*
- **Configuration**: Define `PORT`, `GEMINI_API_KEY`, and `GEMINI_MODEL` environment variables in your server provider console dashboard.
