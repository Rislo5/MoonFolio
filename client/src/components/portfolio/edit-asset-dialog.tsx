import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { AssetWithPrice } from "@shared/schema";
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
  balance: z.coerce.number().positive("Il saldo deve essere positivo"),
  avgBuyPrice: z.coerce.number().positive("Il prezzo deve essere positivo").optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetWithPrice | null;
};

const EditAssetDialog = ({ open, onOpenChange, asset }: Props) => {
  const { editAsset } = usePortfolio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balance: 0,
      avgBuyPrice: 0,
    },
  });
  
  // Aggiorna i valori di default quando viene selezionato un asset
  useEffect(() => {
    if (asset) {
      form.reset({
        balance: parseFloat(asset.balance),
        avgBuyPrice: asset.avgBuyPrice ? parseFloat(asset.avgBuyPrice) : undefined,
      });
    }
  }, [asset, form]);
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!asset) return;
    
    setIsSubmitting(true);
    try {
      await editAsset(asset.id, {
        balance: values.balance.toString(),
        avgBuyPrice: values.avgBuyPrice ? values.avgBuyPrice.toString() : undefined,
      });
      onOpenChange(false);
      toast({
        title: "Asset aggiornato",
        description: `${asset.name} è stato aggiornato con successo.`,
      });
    } catch (error) {
      console.error("Impossibile aggiornare l'asset:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiornare l'asset",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!asset) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifica Asset</DialogTitle>
          <DialogDescription>
            Modifica {asset.name} ({asset.symbol.toUpperCase()})
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      type="number"
                      step="any"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="avgBuyPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prezzo medio di acquisto (USD)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      type="number"
                      step="any"
                      {...field}
                      value={field.value === undefined ? "" : field.value}
                      onChange={(e) => {
                        const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                        field.onChange(value);
                      }}
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
                {isSubmitting ? "Salvataggio..." : "Salva modifiche"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAssetDialog;