import os
import csv
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from groq import Groq

# Load environment variables from .env file
load_dotenv()

# Fetch API keys from environment variables
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Validate that keys are loaded
if not TELEGRAM_TOKEN or not GROQ_API_KEY:
    raise ValueError("Missing TELEGRAM_TOKEN or GROQ_API_KEY in .env file")

# Initialize the Groq AI client
groq_client = Groq(api_key=GROQ_API_KEY)

# Define the database file globally
csv_file = "asha_database.csv"

# Create database file if it doesn't exist
if not os.path.exists(csv_file):
    with open(csv_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["Timestamp", "Patient_Audio_Text", "AI_Analysis"])

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_message = (
        "Namaste! 🙏 I am GramAI, your rural health Co-Pilot.\n\n"
        "Send me a voice note telling me the patient's symptoms (in Hindi or English), "
        "and I will log the data and give you a quick triage recommendation."
    )
    await update.message.reply_text(welcome_message)

async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Let the user know we received it
    await update.message.reply_text("🎧 Listening... processing your voice note.")
    
    try:
        # 1. Download the voice note from Telegram
        voice_file = await update.message.voice.get_file()
        file_path = "temp_voice.ogg"
        await voice_file.download_to_drive(file_path)

        # 2. Transcribe the audio to text using Groq's Whisper AI
        with open(file_path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(file_path, file.read()),
                model="whisper-large-v3",
                prompt="Audio may contain Hindi, English, or Indian medical terms.",
                language="hi"
            )
        patient_text = transcription.text
        
        # Tell the user what we heard
        await update.message.reply_text(f"📝 I heard: \"{patient_text}\"\n\n🤖 Analyzing health data...")

        # 3. Analyze the text using Groq's Llama 3 AI
        system_prompt = """
        You are GramAI, an expert medical assistant for ASHA workers in India.
        The user will provide a transcribed voice note in Hindi/Hinglish.
        1. Accurately translate the Hindi terms to English medical terms.
        2. Account for slight misspellings (e.g., if you see "Sukham", infer "Zukam" which means Cold). 
        3. CRITICAL: If you truly do not recognize a word, DO NOT hallucinate symptoms like diarrhea. Just write "Unknown symptom".
        
        Reply strictly in this format:
        🩺 **Extracted Symptoms:** (List in English)
        📈 **Extracted Vitals:** (List in English, or say 'None')
        💡 **Triage Recommendation:** (Provide a short, safe next-step in BOTH Devanagari Hindi and English).
        """

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": patient_text}
            ],
            model="llama-3.3-70b-versatile", 
        )
        
        ai_response = chat_completion.choices[0].message.content

        # 4. Send the final analysis back to the ASHA worker
        await update.message.reply_text(ai_response)

        # 5. Save to our CSV "Database" (THIS IS THE NEW PART)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(csv_file, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow([timestamp, patient_text, ai_response])
        
        # 6. Confirm saving to the user
        await update.message.reply_text("💾 Data successfully saved to the central registry!")

        # Cleanup: Delete the temporary audio file
        if os.path.exists(file_path):
            os.remove(file_path)

    except Exception as e:
        await update.message.reply_text(f"Sorry, something went wrong: {e}")

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🤖 Analyzing your text message...")
    patient_text = update.message.text
    
    try:
        system_prompt = """
        You are GramAI, an expert medical assistant for ASHA workers in India.
        1. Translate any Hindi to English medical terms.
        2. Reply strictly in this format:
        🩺 **Extracted Symptoms:** (List)
        📈 **Extracted Vitals:** (List or 'None')
        💡 **Triage Recommendation:** (Short next-step in Hindi and English).
        """
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": patient_text}
            ],
            model="llama-3.3-70b-versatile", 
        )
        ai_response = chat_completion.choices[0].message.content
        await update.message.reply_text(ai_response)
        
        # Save to CSV just like the voice notes
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(csv_file, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow([timestamp, patient_text, ai_response])
            
        await update.message.reply_text("💾 Text data successfully saved to the registry!")
        
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        with open(csv_file, mode='r', encoding='utf-8') as file:
            row_count = sum(1 for row in file) - 1  # Subtract 1 for the header row
        
        await update.message.reply_text(f"📊 **GramAI Daily Stats**\n\nTotal Patient Records Synced: {row_count}")
    except Exception:
        await update.message.reply_text("No data logged yet!")

if __name__ == '__main__':
    print("Starting GramAI...")
    app = Application.builder().token(TELEGRAM_TOKEN).build()

    # Handlers
    app.add_handler(CommandHandler('start', start_command))
    app.add_handler(CommandHandler('stats', stats_command))
    
    app.add_handler(MessageHandler(filters.VOICE, handle_voice))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    print("GramAI is running! Go to Telegram and send a voice note.")
    app.run_polling()