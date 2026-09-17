# GramAI

GramAI is a rural health data pipeline built for ASHA (Accredited Social Health Activist) workers in India. It captures patient symptom reports over Telegram, as voice notes or text, in Hindi, Hinglish, or English, transcribes and analyzes them with AI, logs them to a central registry, and exposes that registry through an API and dashboard for review.

## Overview

ASHA workers operate in low-connectivity, low-resource settings and need a fast way to record patient symptoms and get a preliminary triage recommendation without relying on manual paperwork or slow web forms. GramAI addresses this with a Telegram bot as the primary interface, since Telegram is lightweight and widely available even on low-end devices and patchy networks.

The system consists of three components:

- **Telegram Bot (`bot.py`)**: the primary interface for ASHA workers. Accepts voice notes and text messages, transcribes and analyzes them using AI, and stores structured records.
- **API (`api.py`)**: a FastAPI service that reads the patient registry and exposes it as JSON for consumption by a dashboard.
- **Dashboard (`frontend/`)**: a web frontend for visualizing and reviewing the logged patient records.

## How It Works

1. An ASHA worker sends a voice note or text message describing a patient's symptoms to the Telegram bot, in Hindi, Hinglish, or English.
2. If the input is a voice note, it is transcribed using Groq's Whisper Large v3 model, with a prompt tuned for Hindi, English, and Indian medical terminology.
3. The transcribed or typed text is sent to Groq's Llama 3.3 70B model with a system prompt that instructs it to act as a medical assistant for ASHA workers. The model:
   - Translates Hindi/Hinglish terms into English medical terminology, correcting for common misspellings and phonetic variants.
   - Extracts symptoms and vitals from the report.
   - Produces a short, safe triage recommendation in both Devanagari Hindi and English.
   - Avoids hallucinating symptoms it cannot confidently identify, explicitly flagging unrecognized input instead.
4. The bot replies to the worker with the structured analysis and confirms that the record has been saved.
5. Every interaction (timestamp, raw patient text, and AI analysis) is appended to a CSV registry (`asha_database.csv`), which functions as the central data store.
6. The FastAPI service reads this CSV and serves it as JSON at a REST endpoint, which the frontend dashboard consumes to display patient records.

## Features

- **Multilingual voice and text intake** via Telegram, requiring no app installation beyond Telegram itself.
- **AI-powered transcription** using Groq's Whisper Large v3, tuned for Hindi/English/Indian medical vocabulary.
- **AI-powered triage analysis** using Groq's Llama 3.3 70B, returning symptoms, vitals, and a bilingual recommendation.
- **Guardrails against hallucination**: the model is explicitly instructed to flag unrecognized input rather than invent symptoms.
- **Central CSV-backed registry** of all patient interactions with timestamps.
- **`/stats` command** for ASHA workers to check the total number of patient records synced.
- **REST API** for programmatic access to the patient registry.
- **Web dashboard** for reviewing logged records.

## Tech Stack

| Layer | Technology |
|---|---|
| Bot | Python, `python-telegram-bot` |
| Speech-to-text | Groq API, Whisper Large v3 |
| Language model | Groq API, Llama 3.3 70B Versatile |
| Data store | CSV (`asha_database.csv`) |
| API | FastAPI, Pandas |
| Frontend | React |

## Project Structure

```
GramAI/
├── bot.py                # Telegram bot: voice/text intake, transcription, AI analysis, logging
├── api.py                # FastAPI service exposing the patient registry as JSON
├── asha_database.csv     # CSV registry of patient records (timestamp, text, AI analysis)
├── frontend/              # Web dashboard for viewing patient records
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.9+
- A Telegram bot token (via [BotFather](https://t.me/BotFather))
- A Groq API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/krishna-dtu/GramAI.git
   cd GramAI
   ```

2. Install Python dependencies:

   ```bash
   pip install python-telegram-bot groq python-dotenv fastapi uvicorn pandas
   ```

3. Create a `.env` file in the project root with the following variables:

   ```
   TELEGRAM_TOKEN=your_telegram_bot_token
   GROQ_API_KEY=your_groq_api_key
   ```

### Running the Bot

```bash
python bot.py
```

The bot will start polling Telegram for incoming voice notes and text messages.

### Running the API

```bash
python api.py
```

The API starts on `http://0.0.0.0:8000` and exposes the following endpoint:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/patients` | Returns all logged patient records as a JSON array |

### Running the Frontend

```bash
cd frontend
npm install
npm start
```

The frontend consumes the `/api/patients` endpoint to display patient records. Ensure the API server is running first.

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Displays a welcome message and usage instructions |
| `/stats` | Returns the total number of patient records synced |

Sending a voice note or plain text message triggers automatic transcription (if applicable), AI analysis, and logging.

## Data Schema

Each row in `asha_database.csv` contains:

| Column | Description |
|---|---|
| `Timestamp` | Date and time the record was logged |
| `Patient_Audio_Text` | Transcribed or typed patient report |
| `AI_Analysis` | The AI-generated symptoms, vitals, and triage recommendation |

## Disclaimer

GramAI provides preliminary, AI-generated triage suggestions to support ASHA workers and is not a substitute for professional medical diagnosis or emergency care. All recommendations should be verified against established clinical protocols and escalated to qualified healthcare providers where appropriate.

## License

No license has been specified for this repository. All rights reserved by the author unless stated otherwise.
