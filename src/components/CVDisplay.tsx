import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, Briefcase, GraduationCap, Award, Globe, Github, Linkedin, Edit, Plus, X, FolderGit } from "lucide-react";

interface CVDisplayProps {
  cvData: any;
  onReupload?: () => void;
  onSkillsUpdate?: (skills: string[]) => Promise<void>;
}

export default function CVDisplay({ cvData, onReupload, onSkillsUpdate }: CVDisplayProps) {
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const skills = cvData?.skills_flat || [];
  const experienceYears = cvData?.experience_years;
  const workExperience = cvData?.work_experience || [];
  const projects = cvData?.projects || [];
  const education = cvData?.education?.[0];
  const languages = cvData?.languages || [];
  const certifications = cvData?.certifications || [];
  const bio = cvData?.bio;
  const github = cvData?.github;
  const linkedin = cvData?.linkedin;

  useEffect(() => {
    setEditedSkills(skills);
  }, [skills]);

  const handleStartEdit = () => {
    setEditedSkills([...skills]);
    setIsEditingSkills(true);
  };

  const handleCancelEdit = () => {
    setEditedSkills(skills);
    setNewSkill("");
    setIsEditingSkills(false);
  };

  const handleSaveSkills = async () => {
    if (!onSkillsUpdate) return;
    
    try {
      setIsSaving(true);
      await onSkillsUpdate(editedSkills);
      setIsEditingSkills(false);
      setNewSkill("");
    } catch (error) {
      console.error("Failed to save skills:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !editedSkills.includes(trimmed)) {
      setEditedSkills([...editedSkills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditedSkills(editedSkills.filter(s => s !== skillToRemove));
  };

  if (!cvData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Your CV Data
          </CardTitle>
          {onReupload && (
            <Button variant="outline" size="sm" onClick={onReupload}>
              Re-upload CV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Summary */}
        {cvData.name && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg">
            <h3 className="text-xl font-bold">{cvData.name}</h3>
            {cvData.role && <p className="text-muted-foreground">{cvData.role}</p>}
            {cvData.location && <p className="text-sm text-muted-foreground">{cvData.location}</p>}
          </div>
        )}

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-2xl font-bold">{experienceYears || 0}</p>
            <p className="text-xs text-muted-foreground">Years Experience</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{workExperience.length}</p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{skills.length}</p>
            <p className="text-xs text-muted-foreground">Skills</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{certifications.length}</p>
            <p className="text-xs text-muted-foreground">Certifications</p>
          </div>
        </div>

        {/* Skills - PRIMARY SECTION */}
        {(skills.length > 0 || isEditingSkills) && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">
                  Skills ({isEditingSkills ? editedSkills.length : skills.length})
                </h3>
              </div>
              
              {onSkillsUpdate && !isEditingSkills && (
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Skills
                </Button>
              )}
            </div>

            {/* Edit Mode */}
            {isEditingSkills && (
              <div className="space-y-3 mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add new skill (e.g., Docker)"
                    className="flex-1"
                  />
                  <Button onClick={handleAddSkill} size="sm" variant="secondary">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveSkills} 
                    disabled={isSaving}
                    className="gradient-primary text-white"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Skills Display */}
            <div className="flex flex-wrap gap-2">
              {(isEditingSkills ? editedSkills : skills).map((skill: string, idx: number) => (
                <Badge 
                  key={idx} 
                  variant="secondary"
                  className={isEditingSkills ? "pr-1" : ""}
                >
                  {skill}
                  {isEditingSkills && (
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Work Experience - Collapsible */}
        {workExperience.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="work-experience">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Work Experience ({workExperience.length} {workExperience.length === 1 ? 'role' : 'roles'})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {workExperience.map((exp: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.company}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.start_date} - {exp.end_date || 'Present'}
                        {exp.location && ` • ${exp.location}`}
                      </p>
                      {exp.responsibilities && exp.responsibilities.length > 0 && (
                        <ul className="mt-2 text-sm space-y-1">
                          {exp.responsibilities.slice(0, 3).map((resp: string, i: number) => (
                            <li key={i} className="text-muted-foreground">• {resp}</li>
                          ))}
                          {exp.responsibilities.length > 3 && (
                            <li className="text-xs text-muted-foreground italic">
                              + {exp.responsibilities.length - 3} more...
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Projects - Collapsible */}
        {projects.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="projects">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FolderGit className="w-5 h-5" />
                  <span>Projects ({projects.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {projects.map((project: any, idx: number) => (
                    <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                      <h4 className="font-semibold">{project.name || project.title}</h4>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.map((tech: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {project.url && (
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View Project →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Education */}
        {education && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Education</h3>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold">{education.degree}</p>
              {education.institution && (
                <p className="text-sm text-muted-foreground">{education.institution}</p>
              )}
              {education.year && (
                <p className="text-xs text-muted-foreground">{education.year}</p>
              )}
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Languages</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang: any, idx: number) => {
                const langName = typeof lang === 'string' ? lang : lang.language;
                const proficiency = typeof lang === 'object' ? lang.proficiency : '';
                return (
                  <Badge key={idx} variant="outline">
                    {langName} {proficiency && `(${proficiency})`}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Certifications</h3>
            </div>
            <div className="space-y-2">
              {certifications.map((cert: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-medium">{cert.name || cert}</span>
                  {cert.year && <span className="text-sm text-muted-foreground">{cert.year}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {bio && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm leading-relaxed">{bio}</p>
          </div>
        )}

        {/* Links */}
        {(github || linkedin) && (
          <div className="flex gap-3">
            {github && (
              <a
                href={github.startsWith('http') ? github : `https://${github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
