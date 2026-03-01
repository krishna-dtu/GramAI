import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# This is crucial: It allows your React app (running on a different port) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon demo purposes, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/patients")
def get_patients():
    # Read the CSV and send it to the dashboard as JSON
    csv_file = "asha_database.csv"
    
    if not os.path.exists(csv_file):
        return [] # Return empty if no data yet
        
    try:
        df = pd.read_csv(csv_file)
        # Convert the CSV rows into a list of dictionaries (JSON format)
        return df.to_dict(orient="records")
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("Starting GramAI API Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)