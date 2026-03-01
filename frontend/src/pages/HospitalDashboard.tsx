import { useState, useEffect } from "react";
import { Users, AlertTriangle, Activity, Search, Filter, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TriageBadge } from "@/components/TriageBadge";
import { mockPatients, symptomChartData, TriageLevel } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const barColors = [
  "hsl(174, 62%, 38%)",
  "hsl(200, 70%, 45%)",
  "hsl(210, 60%, 55%)",
  "hsl(174, 50%, 50%)",
  "hsl(200, 55%, 55%)",
  "hsl(210, 45%, 60%)",
];

// Type for API response
interface APIPatientRecord {
  Timestamp: string;
  Patient_Audio_Text: string;
  AI_Analysis: string;
}

// Type for parsed patient data
interface PatientData {
  id: string;
  timestamp: string;
  audioText: string;
  symptoms: string[];
  vitals: string[];
  triageRecommendation: string;
  triage: "high" | "monitor" | "safe";
}

// Helper function to parse AI_Analysis markdown
function parseAIAnalysis(analysis: string): {
  symptoms: string[];
  vitals: string[];
  recommendation: string;
  riskLevel: "high" | "monitor" | "safe";
} {
  const symptoms: string[] = [];
  const vitals: string[] = [];
  let recommendation = "";
  let riskLevel: "high" | "monitor" | "safe" = "safe";

  const lines = analysis.split("\n");

  for (const line of lines) {
    if (line.includes("**Extracted Symptoms:**")) {
      const symptomText = line.split("**Extracted Symptoms:**")[1]?.trim() || "";
      const symptomList = symptomText.split(/[,;]/).map((s) => s.trim()).filter((s) => s && s !== "None");
      symptoms.push(...symptomList);
    } else if (line.includes("**Extracted Vitals:**")) {
      const vitalText = line.split("**Extracted Vitals:**")[1]?.trim() || "";
      if (vitalText !== "None" && vitalText) {
        const vitalList = vitalText.split(/[,;]/).map((v) => v.trim()).filter((v) => v);
        vitals.push(...vitalList);
      }
    } else if (line.includes("**Triage Recommendation:**")) {
      recommendation = line.split("**Triage Recommendation:**")[1]?.trim() || "";
    }
  }

  // Determine risk level based on keywords in symptoms and recommendation
  const analysisLower = analysis.toLowerCase();
  if (
    analysisLower.includes("emergency") ||
    analysisLower.includes("severe") ||
    analysisLower.includes("critical") ||
    analysisLower.includes("high risk")
  ) {
    riskLevel = "high";
  } else if (
    analysisLower.includes("monitor") ||
    analysisLower.includes("watch") ||
    analysisLower.includes("follow up")
  ) {
    riskLevel = "monitor";
  }

  return { symptoms, vitals, recommendation, riskLevel };
}

// Transform API data to patient display format
function transformAPIData(apiRecords: APIPatientRecord[]): PatientData[] {
  return apiRecords.map((record, index) => {
    const parsed = parseAIAnalysis(record.AI_Analysis);
    return {
      id: `PATIENT-${index + 1}`.padEnd(12, "0"),
      timestamp: record.Timestamp,
      audioText: record.Patient_Audio_Text,
      symptoms: parsed.symptoms,
      vitals: parsed.vitals,
      triageRecommendation: parsed.recommendation,
      triage: parsed.riskLevel,
    };
  });
}

function KpiCard({ title, value, icon: Icon, accent }: { title: string; value: string | number; icon: React.ElementType; accent: string }) {
  return (
    <Card className="shadow-card border-border/60">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HospitalDashboard() {
  const [livePatients, setLivePatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [triageFilter, setTriageFilter] = useState<string>("all");
  const [symptomFilter, setSymptomFilter] = useState<string>("all");

  // Fetch patient data from API
  const fetchPatients = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/patients");
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data: APIPatientRecord[] = await response.json();
      const transformed = transformAPIData(data);
      setLivePatients(transformed);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch patients";
      setError(errorMessage);
      console.error("Fetch error:", errorMessage);
      // Keep showing fallback data if fetch fails
      setLivePatients(transformAPIData(mockPatients as unknown as APIPatientRecord[]));
    } finally {
      setLoading(false);
    }
  };

  // Set up polling interval (5 seconds)
  useEffect(() => {
    fetchPatients(); // Fetch immediately on mount

    const interval = setInterval(() => {
      fetchPatients();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Determine which data to display
  const displayPatients = livePatients.length > 0 ? livePatients : mockPatients.map((p) => ({
    id: p.id,
    timestamp: p.timestamp,
    audioText: "",
    symptoms: p.symptoms,
    vitals: [`${p.vitals.temp}`, p.vitals.spo2].filter(Boolean),
    triageRecommendation: "",
    triage: p.triage as "high" | "monitor" | "safe",
  }));

  const filtered = displayPatients.filter((p) => {
    const matchesSearch =
      p.audioText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTriage = triageFilter === "all" || p.triage === triageFilter;
    const matchesSymptom =
      symptomFilter === "all" || p.symptoms.some((s) => s.toLowerCase() === symptomFilter.toLowerCase());
    return matchesSearch && matchesTriage && matchesSymptom;
  });

  const highRiskCount = displayPatients.filter((p) => p.triage === "high").length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">District Hospital Dashboard</h1>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm text-muted-foreground">Live patient registry from field workers — Feb 28, 2026</p>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {error && (
            <span className="text-xs text-destructive">
              ⚠️ Using fallback data. Backend unavailable.
            </span>
          )}
          {!error && !loading && livePatients.length > 0 && (
            <span className="text-xs text-green-700">
              ✓ Connected to live API
            </span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Patients Logged Today"
          value={displayPatients.length}
          icon={Users}
          accent="bg-primary/10 text-primary"
        />
        <KpiCard
          title="High-Risk Alerts"
          value={highRiskCount}
          icon={AlertTriangle}
          accent="bg-destructive/10 text-destructive"
        />
        <KpiCard
          title="Active Field Workers"
          value={3}
          icon={Activity}
          accent="bg-success/10 text-success"
        />
      </div>

      {/* Filters */}
      <Card className="shadow-card border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={triageFilter} onValueChange={setTriageFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
              </SelectContent>
            </Select>
            <Select value={symptomFilter} onValueChange={setSymptomFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Symptom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Symptoms</SelectItem>
                <SelectItem value="fever">Fever</SelectItem>
                <SelectItem value="cough">Cough</SelectItem>
                <SelectItem value="zukam">Zukam</SelectItem>
                <SelectItem value="headache">Headache</SelectItem>
                <SelectItem value="diarrhea">Diarrhea</SelectItem>
                <SelectItem value="chest pain">Chest Pain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Table */}
        <Card className="shadow-card border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Patient Registry</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-[11px] font-semibold uppercase">Time</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase">Patient</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase">Symptoms</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase">Vitals</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase">Triage</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {p.timestamp.split(" ")[1]}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{p.id}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {p.audioText.substring(0, 40)}
                            {p.audioText.length > 40 ? "..." : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.symptoms.length > 0 ? (
                            p.symptoms.map((s) => (
                              <Badge key={s} variant="secondary" className="text-[10px]">
                                {s}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">None reported</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {p.vitals.length > 0 ? (
                          p.vitals.map((v) => (
                            <Badge key={v} variant="outline" className="text-[10px] mr-1">
                              {v}
                            </Badge>
                          ))
                        ) : (
                          <span>None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TriageBadge level={p.triage} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-xs text-primary h-7">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {loading ? "Loading patient data..." : "No patients match the current filters."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Symptom Chart */}
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Common Symptoms This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={symptomChartData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(200,20%,90%)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(210,15%,50%)" }} />
                <YAxis
                  dataKey="symptom"
                  type="category"
                  width={70}
                  tick={{ fontSize: 12, fill: "hsl(210,15%,50%)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(200,20%,90%)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                  {symptomChartData.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
