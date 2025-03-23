import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(3, "Il nome deve contenere almeno 3 caratteri").max(50, "Il nome non può superare i 50 caratteri"),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddPortfolioDialog = ({ open, onOpenChange }: Props) => {
  const { createManualPortfolio } = usePortfolio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await createManualPortfolio(values.name);
      onOpenChange(false);
      form.reset();
      toast({
        title: "Portfolio creato con successo",
        description: "Il tuo nuovo portfolio è stato creato",
      });
    } catch (error) {
      console.error("Failed to create portfolio:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile creare il portfolio",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Portfolio</DialogTitle>
          <DialogDescription>
            Inserisci un nome per il tuo nuovo portfolio di criptovalute
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Portfolio</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Es. Il mio portfolio principale" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creazione in corso..." : "Crea Portfolio"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};