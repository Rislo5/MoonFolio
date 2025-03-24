import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiGithub, SiLinkedin } from "react-icons/si";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface AboutUsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Team member data - professionally structured
const teamMembers = [
  {
    name: "Alessandro Rossi",
    role: "Project Lead",
    avatar: "", // Avatar image URL
    github: "https://github.com/alexrossi",
    linkedin: "https://linkedin.com/in/alexrossi",
  },
  {
    name: "Marco Bianchi",
    role: "Frontend Developer",
    avatar: "", // Avatar image URL
    github: "https://github.com/marcobianchi",
    linkedin: "https://linkedin.com/in/marcobianchi",
  },
  {
    name: "Giulia Verdi",
    role: "Backend Developer",
    avatar: "", // Avatar image URL
    github: "https://github.com/giuliaverdi",
    linkedin: "https://linkedin.com/in/giuliaverdi",
  },
  {
    name: "Luca Ferrari",
    role: "Blockchain Specialist",
    avatar: "", // Avatar image URL
    github: "https://github.com/lucaferrari",
    linkedin: "https://linkedin.com/in/lucaferrari",
  },
  {
    name: "Sofia Ricci",
    role: "UX Designer",
    avatar: "", // Avatar image URL
    github: "https://github.com/sofiaricci",
    linkedin: "https://linkedin.com/in/sofiaricci",
  },
  {
    name: "Davide Marino",
    role: "QA Engineer",
    avatar: "", // Avatar image URL
    github: "https://github.com/davidemarino",
    linkedin: "https://linkedin.com/in/davidemarino",
  }
];

export function AboutUsDialog({ open, onOpenChange }: AboutUsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with proper visual hierarchy and alignment */}
        <div className="bg-primary/5 p-6">
          <DialogHeader className="text-center mb-0">
            <DialogTitle className="text-2xl font-bold mb-2">About Moonfolio</DialogTitle>
            <DialogDescription>
              A comprehensive crypto portfolio tracking application
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Mission section with strong visual appeal */}
          <section>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="inline-block w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>
                </svg>
              </span>
              Our Mission
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Moonfolio is an open-source project designed to simplify cryptocurrency portfolio 
              management and tracking. We believe in financial transparency and accessibility, 
              creating tools that help users make informed decisions about their digital assets.
            </p>
          </section>
          
          <Separator />
          
          {/* Open Source section with balanced design */}
          <section>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="inline-block w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"></path>
                  <path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"></path>
                  <path d="M19 11h2m-1 -1v2"></path>
                </svg>
              </span>
              Open Source
            </h3>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <p className="text-muted-foreground leading-relaxed flex-1">
                This project is fully open-source and welcomes contributors from around the world. 
                Our codebase is hosted on GitHub, where anyone can review, suggest changes, or 
                contribute to future development.
              </p>
              <Button variant="outline" className="flex items-center gap-2 self-start md:self-center whitespace-nowrap" asChild>
                <a href="https://github.com/moonfolio/crypto-tracker" target="_blank" rel="noopener noreferrer">
                  <SiGithub className="h-4 w-4" /> View on GitHub
                </a>
              </Button>
            </div>
          </section>
          
          <Separator />
          
          {/* Team section with consistent and balanced grid */}
          <section>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <span className="inline-block w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16.5 21c2.5 -1.5 3.5 -4 3.5 -7"></path>
                  <path d="M4 21c0 0 2.5 -1 3 -4c.5 -3.5 2.5 -3.5 3 -4c.5 -.5 0 -2 -2 -2.5c-1 3 -3.17 3.5 -4 3c-2 -1 -2 2 -1 3"></path>
                  <path d="M10 21v-5a2 2 0 1 1 4 0v5"></path>
                  <path d="M11 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
                  <path d="M7 14c1 -2 2 -2 3.5 -2c1.5 0 2.5 0 3.5 2"></path>
                </svg>
              </span>
              Meet Our Team
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {teamMembers.map((member, index) => (
                <Card key={index} className="overflow-hidden border border-border/50 transition-all hover:border-primary/20 hover:shadow-sm">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <Avatar className="h-20 w-20 mb-4 border-2 border-primary/20">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="font-semibold text-lg">{member.name}</h4>
                    <p className="text-muted-foreground text-sm mb-3">{member.role}</p>
                    <div className="flex space-x-4">
                      <a 
                        href={member.github} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`${member.name}'s GitHub profile`}
                      >
                        <SiGithub className="h-5 w-5" />
                      </a>
                      <a 
                        href={member.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`${member.name}'s LinkedIn profile`}
                      >
                        <SiLinkedin className="h-5 w-5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          <Separator />
          
          {/* Technology section with visually structured list */}
          <section>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <span className="inline-block w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-2 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 17h-2v-2"></path>
                  <path d="M9 21v-2"></path>
                  <path d="M13 21v-6"></path>
                  <path d="M17 21v-10"></path>
                  <path d="M21 21v-14"></path>
                  <path d="M21 7h-4"></path>
                  <path d="M9 3v2"></path>
                  <path d="M5 3v6"></path>
                  <path d="M1 13h4"></path>
                  <path d="M5 17v4"></path>
                </svg>
              </span>
              Technology Stack
            </h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Moonfolio leverages modern web technologies to deliver a fast, responsive, and accessible experience:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                "React frontend with TypeScript",
                "Node.js backend",
                "Tailwind CSS for styling",
                "PostgreSQL database",
                "Real-time data via WebSockets",
                "ENS & Ethereum wallet integration",
                "Responsive design for all devices"
              ].map((tech, index) => (
                <div key={index} className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2"></span>
                  <span className="text-muted-foreground">{tech}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        
        {/* Footer with proper alignment and hierarchy */}
        <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex justify-center sm:justify-center">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}