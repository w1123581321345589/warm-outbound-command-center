import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight } from "lucide-react";
import Papa from "papaparse";

interface ParsedProspect {
  firstName: string;
  lastName: string;
  email?: string;
  company: string;
  title: string;
  linkedinUrl?: string;
  twitterHandle?: string;
}

interface ColumnMapping {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  linkedinUrl: string;
  twitterHandle: string;
}

const SOURCES = [
  { value: "Clay", label: "Clay Export" },
  { value: "LinkedIn", label: "LinkedIn Sales Navigator" },
  { value: "Phantombuster", label: "Phantombuster" },
  { value: "Apollo", label: "Apollo.io" },
  { value: "Manual", label: "Manual Entry" },
  { value: "Other", label: "Other" },
];

export default function Import() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [step, setStep] = useState<"upload" | "map" | "preview" | "complete">("upload");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [source, setSource] = useState("Clay");
  const [mapping, setMapping] = useState<ColumnMapping>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    title: "",
    linkedinUrl: "",
    twitterHandle: "",
  });
  const [mappedProspects, setMappedProspects] = useState<ParsedProspect[]>([]);

  const importMutation = useMutation({
    mutationFn: async (data: { teamId: number; source: string; prospects: ParsedProspect[] }) => {
      const res = await fetch(api.prospects.import.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.prospects.list.path] });
      toast({ 
        title: "Import Complete", 
        description: `Successfully imported ${data.imported} prospects.` 
      });
      setStep("complete");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Import Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          toast({ 
            title: "Empty File", 
            description: "The uploaded CSV file is empty.", 
            variant: "destructive" 
          });
          return;
        }

        const headers = Object.keys(results.data[0] as object);
        setHeaders(headers);
        setCsvData(results.data);

        // Auto-detect common column mappings
        const autoMapping: ColumnMapping = {
          firstName: headers.find(h => /first.*name|firstname|first/i.test(h)) || "",
          lastName: headers.find(h => /last.*name|lastname|last|surname/i.test(h)) || "",
          email: headers.find(h => /email|e-mail/i.test(h)) || "",
          company: headers.find(h => /company|organization|org/i.test(h)) || "",
          title: headers.find(h => /title|job.*title|position|role/i.test(h)) || "",
          linkedinUrl: headers.find(h => /linkedin|profile.*url/i.test(h)) || "",
          twitterHandle: headers.find(h => /twitter|x\.com|handle/i.test(h)) || "",
        };

        setMapping(autoMapping);
        setStep("map");
        
        toast({ 
          title: "File Loaded", 
          description: `Found ${results.data.length} rows and ${headers.length} columns.` 
        });
      },
      error: (error) => {
        toast({ 
          title: "Parse Error", 
          description: error.message, 
          variant: "destructive" 
        });
      },
    });
  }, [toast]);

  const handleApplyMapping = () => {
    if (!mapping.firstName || !mapping.lastName || !mapping.company || !mapping.title) {
      toast({ 
        title: "Missing Required Fields", 
        description: "Please map First Name, Last Name, Company, and Title.", 
        variant: "destructive" 
      });
      return;
    }

    const mapped = csvData.map(row => ({
      firstName: row[mapping.firstName] || "",
      lastName: row[mapping.lastName] || "",
      email: mapping.email ? row[mapping.email] : undefined,
      company: row[mapping.company] || "",
      title: row[mapping.title] || "",
      linkedinUrl: mapping.linkedinUrl ? row[mapping.linkedinUrl] : undefined,
      twitterHandle: mapping.twitterHandle ? row[mapping.twitterHandle] : undefined,
    })).filter(p => p.firstName && p.lastName && p.company && p.title);

    setMappedProspects(mapped);
    setStep("preview");
  };

  const handleImport = () => {
    importMutation.mutate({
      teamId: 1, // Default team for demo
      source,
      prospects: mappedProspects,
    });
  };

  const handleReset = () => {
    setStep("upload");
    setCsvData([]);
    setHeaders([]);
    setMappedProspects([]);
    setMapping({
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      title: "",
      linkedinUrl: "",
      twitterHandle: "",
    });
  };

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Import Prospects</h2>
          <p className="text-muted-foreground mt-1">
            Upload a CSV file from Clay, LinkedIn Sales Navigator, or other sources.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {["upload", "map", "preview", "complete"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s 
                  ? "bg-primary text-primary-foreground" 
                  : ["upload", "map", "preview", "complete"].indexOf(step) > i
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              }`}>
                {["upload", "map", "preview", "complete"].indexOf(step) > i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Select a CSV file containing your prospects data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger data-testid="select-source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-2 border-dashed border-muted rounded-xl p-12 text-center">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Drag and drop your CSV file here, or click to browse.
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                  data-testid="input-file-upload"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Map Columns */}
        {step === "map" && (
          <Card>
            <CardHeader>
              <CardTitle>Map Columns</CardTitle>
              <CardDescription>
                Match your CSV columns to prospect fields. Required fields are marked with *.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "firstName", label: "First Name *", required: true },
                  { key: "lastName", label: "Last Name *", required: true },
                  { key: "email", label: "Email", required: false },
                  { key: "company", label: "Company *", required: true },
                  { key: "title", label: "Title *", required: true },
                  { key: "linkedinUrl", label: "LinkedIn URL", required: false },
                  { key: "twitterHandle", label: "Twitter Handle", required: false },
                ].map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Select 
                      value={mapping[field.key as keyof ColumnMapping]} 
                      onValueChange={(v) => setMapping(prev => ({ ...prev, [field.key]: v }))}
                    >
                      <SelectTrigger data-testid={`select-map-${field.key}`}>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- None --</SelectItem>
                        {headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleReset} data-testid="button-back">
                  Back
                </Button>
                <Button onClick={handleApplyMapping} data-testid="button-apply-mapping">
                  Continue to Preview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Import</CardTitle>
              <CardDescription>
                Review the first 5 prospects before importing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium">{mappedProspects.length} prospects ready to import</p>
                  <p className="text-sm text-muted-foreground">Source: {source}</p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Title</th>
                      <th className="px-4 py-2 text-left font-medium">Company</th>
                      <th className="px-4 py-2 text-left font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedProspects.slice(0, 5).map((p, i) => (
                      <tr key={i} className="border-t" data-testid={`row-preview-${i}`}>
                        <td className="px-4 py-2" data-testid={`text-name-${i}`}>{p.firstName} {p.lastName}</td>
                        <td className="px-4 py-2" data-testid={`text-title-${i}`}>{p.title}</td>
                        <td className="px-4 py-2" data-testid={`text-company-${i}`}>{p.company}</td>
                        <td className="px-4 py-2 text-muted-foreground" data-testid={`text-email-${i}`}>{p.email || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {mappedProspects.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ...and {mappedProspects.length - 5} more prospects
                </p>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep("map")} data-testid="button-back-to-map">
                  Back to Mapping
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={importMutation.isPending}
                  data-testid="button-import"
                >
                  {importMutation.isPending ? "Importing..." : "Import Prospects"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Import Complete!</h3>
              <p className="text-muted-foreground mb-6">
                {mappedProspects.length} prospects have been added to your pipeline.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleReset} data-testid="button-import-more">
                  Import More
                </Button>
                <Button onClick={() => setLocation("/pipeline")} data-testid="button-view-pipeline">
                  View Pipeline
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
