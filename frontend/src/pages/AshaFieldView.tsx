import { useState, useCallback } from "react";
import { Mic, MicOff, Send, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TriageBadge } from "@/components/TriageBadge";
import { toast } from "sonner";

export default function AshaFieldView() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");

  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setHasRecorded(true);
      }, 3000);
    } else {
      setIsRecording(false);
      setHasRecorded(true);
    }
  }, [isRecording]);

  const handleSubmit = () => {
    if (!patientName.trim()) {
      toast.error("Please enter patient name");
      return;
    }
    toast.success("Patient submitted to registry!", {
      description: `${patientName}, Age ${patientAge || "N/A"} — Triage: Monitor`,
    });
    setPatientName("");
    setPatientAge("");
    setHasRecorded(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-display font-bold text-foreground">ASHA Field Recorder</h1>
        <p className="text-sm text-muted-foreground">Tap the mic to record patient symptoms</p>
      </div>

      {/* Mic Button */}
      <div className="flex justify-center py-6">
        <button
          onClick={toggleRecording}
          className={`relative h-28 w-28 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? "gradient-hero animate-mic-pulse scale-105"
              : "bg-primary hover:bg-primary/90 shadow-elevated"
          }`}
          aria-label={isRecording ? "Stop recording" : "Tap to speak"}
        >
          {isRecording ? (
            <MicOff className="h-10 w-10 text-primary-foreground" />
          ) : (
            <Mic className="h-10 w-10 text-primary-foreground" />
          )}
        </button>
      </div>

      {isRecording && (
        <p className="text-center text-sm font-medium text-primary animate-pulse">
          🔴 Listening... Speak now
        </p>
      )}

      {/* AI Processing Card */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-display">AI Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transcription */}
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Audio Transcription
            </Label>
            <div className="mt-1.5 rounded-md bg-muted/60 p-3 min-h-[48px] text-sm">
              {hasRecorded ? (
                <span>
                  "Patient ko <span className="text-primary font-medium">tez bukhar</span> hai, 
                  <span className="text-primary font-medium"> khansi</span> aur 
                  <span className="text-primary font-medium"> badan dard</span> bhi hai. 
                  Temperature 101 degree hai."
                </span>
              ) : (
                <span className="text-muted-foreground italic">Waiting for audio input...</span>
              )}
            </div>
          </div>

          {/* Extracted Data */}
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Extracted Medical Data
            </Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted/60 p-2.5">
                <p className="text-[10px] uppercase text-muted-foreground font-medium">Symptoms</p>
                <p className="text-sm font-medium mt-0.5">
                  {hasRecorded ? "Fever, Cough, Body Pain" : "—"}
                </p>
              </div>
              <div className="rounded-md bg-muted/60 p-2.5">
                <p className="text-[10px] uppercase text-muted-foreground font-medium">Vitals</p>
                <p className="text-sm font-medium mt-0.5">
                  {hasRecorded ? "Temp: 101°F" : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Triage */}
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              AI Triage Recommendation
            </Label>
            <div className="mt-1.5">
              {hasRecorded ? (
                <div className="flex items-center gap-2">
                  <TriageBadge level="monitor" />
                  <span className="text-sm text-muted-foreground">Recommend follow-up within 24hrs</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Form */}
      <Card className="shadow-card border-border/60">
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Patient Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Ramesh Kumar"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Age
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="e.g. 45"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground font-semibold gap-2">
            <Send className="h-4 w-4" />
            Submit to Registry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
