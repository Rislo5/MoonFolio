import { useState } from "react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { Portfolio } from "@shared/schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio: Portfolio | null;
};

export const DeletePortfolioDialog = ({ open, onOpenChange, portfolio }: Props) => {
  const { deletePortfolio } = usePortfolio();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!portfolio) return null;
  
  const handleDeletePortfolio = async () => {
    if (!portfolio) return;
    
    setIsDeleting(true);
    
    try {
      await deletePortfolio(portfolio.id);
      
      toast({
        title: "Portfolio eliminato",
        description: `Il portfolio "${portfolio.name}" è stato eliminato con successo.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete portfolio:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile eliminare il portfolio",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Elimina Portfolio
          </DialogTitle>
          <DialogDescription>
            Stai per eliminare il portfolio "{portfolio.name}". Questa operazione non può essere annullata.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Tutti gli asset e le transazioni associate a questo portfolio saranno eliminati definitivamente.
            Sei sicuro di voler procedere?
          </p>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Annulla
          </Button>
          <Button 
            variant="destructive" 
            className="ml-2"
            onClick={handleDeletePortfolio}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminazione...
              </>
            ) : (
              <>Elimina Portfolio</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};