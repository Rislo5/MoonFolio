import { useState, useEffect } from "react";
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
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { Asset, AssetWithPrice, Portfolio } from "@shared/schema";

// Schema per il transfer
const transferAssetSchema = z.object({
  sourceAssetId: z.string().min(1, "Seleziona un asset da trasferire"),
  targetPortfolioId: z.string().min(1, "Seleziona un portfolio di destinazione"),
  amount: z.string().min(1, "Inserisci una quantità da trasferire"),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAssetId?: number;
};

export const TransferAssetDialog = ({ open, onOpenChange, initialAssetId }: Props) => {
  const { 
    activePortfolio, 
    portfolios, 
    assets, 
    createTransaction, 
    addAsset, 
    getAsset
  } = usePortfolio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithPrice | null>(null);
  
  // Form per il trasferimento
  const form = useForm<z.infer<typeof transferAssetSchema>>({
    resolver: zodResolver(transferAssetSchema),
    defaultValues: {
      sourceAssetId: initialAssetId ? initialAssetId.toString() : "",
      targetPortfolioId: "",
      amount: "",
    },
  });

  // Impostare l'asset iniziale se specificato
  useEffect(() => {
    if (initialAssetId && open) {
      form.setValue("sourceAssetId", initialAssetId.toString());
      const asset = assets.find(a => a.id === initialAssetId);
      if (asset) {
        setSelectedAsset(asset);
      }
    }
  }, [initialAssetId, assets, open, form]);

  // Aggiorna l'asset selezionato quando cambia la selezione
  const handleAssetChange = (assetId: string) => {
    const asset = assets.find(a => a.id === parseInt(assetId));
    setSelectedAsset(asset || null);
  };

  // Portfolio disponibili per il trasferimento (escluso quello attivo)
  const availablePortfolios = portfolios.filter(p => p.id !== activePortfolio?.id);

  // Gestisce il submit del form
  const handleSubmit = async (values: z.infer<typeof transferAssetSchema>) => {
    if (!activePortfolio || !selectedAsset) return;
    
    const sourceAssetId = parseInt(values.sourceAssetId);
    const targetPortfolioId = parseInt(values.targetPortfolioId);
    const amount = parseFloat(values.amount);
    
    // Controlla che l'importo non superi il saldo disponibile
    if (amount > parseFloat(selectedAsset.balance.toString())) {
      toast({
        title: "Importo non valido",
        description: "L'importo da trasferire supera il saldo disponibile",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Crea una transazione "withdraw" nel portfolio di origine
      await createTransaction({
        assetId: sourceAssetId,
        type: "withdraw",
        amount: amount.toString(),
        price: selectedAsset.currentPrice?.toString() || selectedAsset.avgBuyPrice,
        date: new Date().toISOString(),
      });
      
      // 2. Verifica se l'asset esiste già nel portfolio di destinazione
      const targetPortfolio = portfolios.find(p => p.id === targetPortfolioId);
      if (!targetPortfolio) throw new Error("Portfolio di destinazione non trovato");
      
      // 3. Aggiungi o aggiorna l'asset nel portfolio di destinazione
      // Nota: nella tua implementazione reale, dovresti verificare se l'asset esiste già nel portfolio di destinazione
      await addAsset({
        portfolioId: targetPortfolioId,
        name: selectedAsset.name,
        symbol: selectedAsset.symbol,
        coinGeckoId: selectedAsset.coinGeckoId,
        balance: amount.toString(),
        avgBuyPrice: selectedAsset.currentPrice?.toString() || selectedAsset.avgBuyPrice,
        imageUrl: selectedAsset.imageUrl
      });
      
      // 4. Crea una transazione "deposit" nel portfolio di destinazione
      // Nota: questo dipende da come hai implementato la logica di transazione
      // Potresti avere bisogno di un metodo diverso o aggiuntivo qui
      
      toast({
        title: "Trasferimento completato",
        description: `${amount} ${selectedAsset.symbol.toUpperCase()} trasferiti con successo a ${targetPortfolio.name}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to transfer asset:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile completare il trasferimento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Trasferisci Asset</DialogTitle>
          <DialogDescription>
            Trasferisci un asset da questo portfolio a un altro.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Selezione asset */}
            <FormField
              control={form.control}
              name="sourceAssetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset da trasferire</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleAssetChange(value);
                    }}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un asset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          <div className="flex items-center">
                            {asset.imageUrl && (
                              <img 
                                src={asset.imageUrl} 
                                alt={asset.name} 
                                className="w-5 h-5 mr-2 rounded-full"
                              />
                            )}
                            <span>
                              {asset.name} ({asset.symbol.toUpperCase()})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Selezione portfolio destinazione */}
            <FormField
              control={form.control}
              name="targetPortfolioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio di destinazione</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un portfolio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePortfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                      {availablePortfolios.length === 0 && (
                        <div className="text-center py-2 text-muted-foreground text-sm">
                          Nessun altro portfolio disponibile
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    L'asset sarà trasferito in questo portfolio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Importo da trasferire */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantità da trasferire</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number"
                        step="any"
                        min="0"
                        max={selectedAsset ? selectedAsset.balance.toString() : undefined}
                        placeholder="Es. 0.5"
                        {...field}
                      />
                      {selectedAsset && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                          / {selectedAsset.balance.toString()} {selectedAsset.symbol.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  {selectedAsset && (
                    <FormDescription>
                      Saldo disponibile: {selectedAsset.balance.toString()} {selectedAsset.symbol.toUpperCase()}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Schema riepilogativo */}
            {selectedAsset && form.watch("targetPortfolioId") && (
              <div className="rounded-lg border p-3 bg-muted/10">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-col items-start">
                    <span className="text-muted-foreground">Da:</span>
                    <span className="font-medium">{activePortfolio?.name}</span>
                  </div>
                  <ArrowRight className="text-muted-foreground" />
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">A:</span>
                    <span className="font-medium">
                      {
                        portfolios.find(
                          p => p.id === parseInt(form.watch("targetPortfolioId"))
                        )?.name
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Annulla
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.formState.isValid || availablePortfolios.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Trasferimento in corso...
                  </>
                ) : (
                  "Trasferisci"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};