import { useState, useEffect } from "react";
import { X, FileText, Mail, Download, Copy, Sparkles, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApplicationGenerator } from "@/hooks/useApplicationGenerator";
import { Job } from "@/types/job";
import { toast } from "sonner";
import { MarkdownContent } from "@/components/MarkdownContent";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationAssistantModalProps {
  job: Job;
  userId: string;
  onClose: () => void;
}

export const ApplicationAssistantModal = ({ job, userId, onClose }: ApplicationAssistantModalProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'auto' | 'en' | 'sv'>('auto');
  const { generate, loading, result, reset, setResult } = useApplicationGenerator();
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    // Load existing application if available
    const loadExisting = async () => {
      try {
        const { data: matchData } = await supabase
          .from('matches')
          .select('id')
          .eq('user_id', userId)
          .eq('job_id', job.id)
          .maybeSingle();
        
        if (matchData) {
          const { data: appData } = await supabase
            .from('applications')
            .select('*')
            .eq('match_id', matchData.id)
            .maybeSingle();
          
          if (appData) {
            setExistingApplication(appData);
            // Auto-populate result state with existing data
            setResult({
              success: true,
              language: appData.language as 'en' | 'sv',
              cv: appData.generated_cv || undefined,
              cover_letter: appData.generated_cover_letter || undefined,
              email: appData.generated_email_subject || appData.generated_email_body ? {
                subject: appData.generated_email_subject || '',
                body: appData.generated_email_body || '',
              } : undefined,
              job: {
                title: job.title,
                company: job.company,
                location: job.location || '',
              },
            });
          }
        }
      } catch (error) {
        console.error('Error loading existing application:', error);
      } finally {
        setLoadingExisting(false);
      }
    };
    
    loadExisting();
    
    return () => reset();
  }, [job.id, userId]);

  const handleGenerate = async () => {
    await generate(job.id, userId, {
      language_override: selectedLanguage,
      include: ['cv', 'cover_letter', 'email'],
    });
  };

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${type} copied to clipboard!`);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded!`);
  };

  const languageLabel = {
    auto: '🌍 Auto-detect',
    en: '🇬🇧 English',
    sv: '🇸🇪 Swedish',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Application Assistant</h2>
            </div>
            <p className="text-muted-foreground">
              AI-powered CV, cover letter, and email generation
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result?.success && (
            <div className="space-y-6">
              {/* Job Info */}
              <div className="bg-card border rounded-xl p-4">
                <h3 className="font-bold text-lg mb-1">{job.title}</h3>
                <p className="text-muted-foreground mb-2">{job.company}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{job.location || "Remote"}</Badge>
                  {job.employment_type && (
                    <Badge variant="secondary">{job.employment_type}</Badge>
                  )}
                </div>
              </div>

              {/* ATS Banner */}
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-accent mb-1">ATS-Optimized</h4>
                    <p className="text-sm text-muted-foreground">
                      Your application will be tailored with keywords from the job description
                      to help pass Applicant Tracking Systems.
                    </p>
                  </div>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  <Languages className="w-4 h-4 inline mr-2" />
                  Application Language
                </label>
                <div className="flex gap-2">
                  {(['auto', 'en', 'sv'] as const).map((lang) => (
                    <Button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      variant={selectedLanguage === lang ? "default" : "outline"}
                      className={selectedLanguage === lang ? "gradient-primary text-white" : ""}
                    >
                      {languageLabel[lang]}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedLanguage === 'auto'
                    ? "We'll detect the language from the job description"
                    : `All documents will be generated in ${selectedLanguage === 'en' ? 'English' : 'Swedish'}`}
                </p>
              </div>

              {/* What Will Be Generated */}
              <div>
                <h4 className="font-semibold mb-3">What you'll get:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-primary" />
                    <span><strong>Tailored CV</strong> - Reordered to highlight relevant experience</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-primary" />
                    <span><strong>Cover Letter</strong> - Personalized to the job and company</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-primary" />
                    <span><strong>Email Draft</strong> - Professional application email</span>
                  </div>
                </div>
              </div>

              {/* Interview Test Box */}
              <div className="bg-muted/50 border rounded-xl p-4">
                <h4 className="font-semibold mb-2 text-sm">💡 The Interview Test</h4>
                <p className="text-xs text-muted-foreground">
                  Everything in your tailored application should be something you can confidently
                  discuss in an interview. We reorder and emphasize - we never fabricate.
                </p>
              </div>

              {/* Error Display */}
              {result?.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                  <p className="text-sm text-destructive">{result.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Results View */}
          {result?.success && (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold">
                    Generated in {result.language === 'sv' ? '🇸🇪 Swedish' : '🇬🇧 English'}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-1">Your Application is Ready!</h3>
                <p className="text-muted-foreground text-sm">
                  Review, copy, or download each document below
                </p>
              </div>

              {/* Tabs for Different Documents */}
              <Tabs defaultValue="cv" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cv">
                    <FileText className="w-4 h-4 mr-2" />
                    CV
                  </TabsTrigger>
                  <TabsTrigger value="cover">
                    <FileText className="w-4 h-4 mr-2" />
                    Cover Letter
                  </TabsTrigger>
                  <TabsTrigger value="email">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </TabsTrigger>
                </TabsList>

                {/* CV Tab */}
                <TabsContent value="cv" className="space-y-4">
                  {result.cv && (
                    <>
                <div className="bg-muted/30 border rounded-xl p-6 max-h-96 overflow-y-auto">
                  <MarkdownContent content={result.cv} />
                </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopy(result.cv!, 'CV')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy CV
                        </Button>
                        <Button
                          onClick={() => handleDownload(result.cv!, 'cv.md')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Cover Letter Tab */}
                <TabsContent value="cover" className="space-y-4">
                  {result.cover_letter && (
                    <>
                <div className="bg-muted/30 border rounded-xl p-6 max-h-96 overflow-y-auto">
                  <MarkdownContent content={result.cover_letter} />
                </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopy(result.cover_letter!, 'Cover Letter')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Letter
                        </Button>
                        <Button
                          onClick={() => handleDownload(result.cover_letter!, 'cover-letter.md')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Email Tab */}
                <TabsContent value="email" className="space-y-4">
                  {result.email && (
                    <>
                      <div className="bg-muted/30 border rounded-xl p-6">
                        <div className="mb-4">
                          <label className="text-xs font-semibold text-muted-foreground">Subject:</label>
                          <p className="text-sm font-medium mt-1">{result.email.subject}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Body:</label>
                          <pre className="text-sm whitespace-pre-wrap font-sans mt-1">{result.email.body}</pre>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopy(`Subject: ${result.email!.subject}\n\n${result.email!.body}`, 'Email')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Email
                        </Button>
                        <Button
                          onClick={() => handleDownload(`Subject: ${result.email!.subject}\n\n${result.email!.body}`, 'email-draft.txt')}
                          variant="outline"
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {/* Generate Again Button */}
              <Button
                onClick={() => {
                  setExistingApplication(null);
                  reset();
                }}
                variant="outline"
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {!result?.success && !loadingExisting && (
          <div className="p-6 border-t bg-muted/20">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full gradient-primary text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  {existingApplication ? 'Regenerate Application' : 'Generate Application'}
                </>
              )}
            </Button>
            {existingApplication ? (
              <p className="text-xs text-center text-muted-foreground mt-3">
                You have an existing draft from {new Date(existingApplication.generated_at).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-center text-muted-foreground mt-3">
                Estimated time: 10-15 seconds
              </p>
            )}
          </div>
        )}
        {loadingExisting && (
          <div className="p-6 border-t bg-muted/20 text-center">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading existing draft...</p>
          </div>
        )}
      </div>
    </div>
  );
};
