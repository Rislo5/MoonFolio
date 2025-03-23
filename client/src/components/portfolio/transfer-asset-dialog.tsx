import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { createAsset } from "@/lib/api";
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
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, ArrowRight, CreditCard } from "lucide-react";
import { AssetWithPrice, Portfolio } from "@shared/schema";

// Schema per il trasferimento dell'asset
const transferSchema = z.object({
  sourceAssetId: z.number({
    required_error: "Seleziona l'asset da trasferire",
  }),
  targetPortfolioId: z.number({
    required_error: "Seleziona il portfolio di destinazione",
  }),
  amount: z.string().min(1, "Inserisci una quantità da trasferire"),
  fee: z.string().optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAssetId?: number;
};

export const TransferAssetDialog = ({ open, onOpenChange, initialAssetId }: Props) => {
  const { portfolios, assets, activePortfolio, addTransaction } = usePortfolio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePortfolios, setAvailablePortfolios] = useState<Portfolio[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithPrice | null>(null);
  
  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceAssetId: initialAssetId || 0,
      amount: "",
      fee: "0",
    },
  });
  
  // Filtra i portfolio disponibili (escludendo quello attivo)
  useEffect(() => {
    if (activePortfolio && portfolios) {
      const filteredPortfolios = portfolios.filter(p => p.id !== activePortfolio.id);
      setAvailablePortfolios(filteredPortfolios);
    }
  }, [activePortfolio, portfolios]);
  
  // Se viene passato initialAssetId, imposta l'asset selezionato
  useEffect(() => {
    if (initialAssetId && assets) {
      const asset = assets.find(a => a.id === initialAssetId);
      if (asset) {
        setSelectedAsset(asset);
        form.setValue("sourceAssetId", asset.id);
      }
    }
  }, [initialAssetId, assets, form]);
  
  // Gestisce la selezione dell'asset
  const handleAssetChange = (assetId: number) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
      setSelectedAsset(asset);
    }
  };
  
  // Gestisce il submit del form
  const handleSubmit = async (values: z.infer<typeof transferSchema>) => {
    if (!selectedAsset || !activePortfolio) {
      toast({
        title: "Errore",
        description: "Seleziona un asset e un portfolio di destinazione",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Ottieni il portfolio di destinazione
      const targetPortfolio = portfolios.find(p => p.id === values.targetPortfolioId);
      if (!targetPortfolio) {
        throw new Error("Portfolio di destinazione non trovato");
      }
      
      // 2. Crea una transazione di trasferimento in uscita dal portfolio corrente
      await addTransaction({
        assetId: values.sourceAssetId,
        type: "transfer",
        amount: "-" + values.amount, // Segnale negativo per indicare l'uscita
        price: selectedAsset.currentPrice ? selectedAsset.currentPrice.toString() : "0",
        date: new Date().toISOString()
      });
      
      // 3. In un'app reale, il backend gestirebbe tutto il flusso di trasferimento
      // Per questa demo, simuliamo l'aggiunta dell'asset anche nel portfolio di destinazione
      
      // Verifica se l'asset esiste già nel portfolio di destinazione
      const existingAssetInTarget = assets.find(a => 
        a.portfolioId === values.targetPortfolioId && 
        a.coinGeckoId === selectedAsset.coinGeckoId
      );
      
      if (existingAssetInTarget) {
        // Se l'asset esiste già, aggiungi solo una transazione di trasferimento in entrata
        await addTransaction({
          assetId: existingAssetInTarget.id,
          type: "transfer",
          amount: values.amount, // Valore positivo per indicare l'entrata
          price: selectedAsset.currentPrice ? selectedAsset.currentPrice.toString() : "0",
          date: new Date().toISOString()
        });
      } else {
        // Se l'asset non esiste, crealo prima nel portfolio di destinazione
        try {
          const newAsset = await createAsset(
            values.targetPortfolioId,
            {
              name: selectedAsset.name,
              symbol: selectedAsset.symbol,
              coinGeckoId: selectedAsset.coinGeckoId,
              balance: values.amount, // La quantità trasferita diventa il bilancio iniziale
              avgBuyPrice: selectedAsset.currentPrice ? selectedAsset.currentPrice.toString() : undefined,
              imageUrl: selectedAsset.imageUrl
            }
          );
          
          // Poi aggiungi una transazione di trasferimento in entrata
          await addTransaction({
            assetId: newAsset.id,
            type: "transfer",
            amount: values.amount, // Valore positivo per indicare l'entrata
            price: selectedAsset.currentPrice ? selectedAsset.currentPrice.toString() : "0",
            date: new Date().toISOString()
          });
        } catch (error) {
          console.error("Failed to create asset in target portfolio:", error);
          // Continua comunque, almeno abbiamo registrato l'uscita dal portfolio corrente
        }
      }
      
      toast({
        title: "Trasferimento avviato",
        description: `Hai trasferito ${values.amount} ${selectedAsset.symbol.toUpperCase()} al portfolio #${values.targetPortfolioId}`,
      });
      
      // Chiudi il dialog e resetta il form
      onOpenChange(false);
      form.reset();
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
          <DialogTitle className="text-xl font-bold">Trasferisci Asset</DialogTitle>
          <DialogDescription>
            Sposta cripto tra i tuoi diversi portfolio
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="sourceAssetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset da trasferire</FormLabel>
                    <Select
                      disabled={Boolean(initialAssetId)}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        handleAssetChange(Number(value));
                      }}
                      defaultValue={initialAssetId ? String(initialAssetId) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona un asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            <div className="flex items-center">
                              {asset.imageUrl && (
                                <img src={asset.imageUrl} alt={asset.name} className="w-5 h-5 mr-2 rounded-full" />
                              )}
                              <span>{asset.name} ({asset.symbol.toUpperCase()})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedAsset && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    {selectedAsset.imageUrl && (
                      <img src={selectedAsset.imageUrl} alt={selectedAsset.name} className="w-8 h-8 mr-2 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium">{selectedAsset.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        Bilancio: {parseFloat(selectedAsset.balance).toLocaleString()} {selectedAsset.symbol.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantità da trasferire</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          type="number"
                          step="any"
                          className="pl-10"
                          placeholder={`Es. 0.5 ${selectedAsset?.symbol.toUpperCase() || ''}`}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    {selectedAsset && (
                      <FormDescription>
                        Massimo: {parseFloat(selectedAsset.balance).toLocaleString()} {selectedAsset.symbol.toUpperCase()}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee di rete (opzionale)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          type="number"
                          step="any"
                          className="pl-10"
                          placeholder="Es. 0.001"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetPortfolioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio di destinazione</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona un portfolio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePortfolios.length > 0 ? (
                          availablePortfolios.map((portfolio) => (
                            <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                              {portfolio.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-portfolio" disabled>
                            Nessun altro portfolio disponibile
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {availablePortfolios.length === 0 && (
                      <FormDescription>
                        Crea prima un altro portfolio per poter trasferire gli asset
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button 
                type="submit" 
                className="gap-1"
                disabled={isSubmitting || availablePortfolios.length === 0}
              >
                {isSubmitting ? "Trasferimento in corso..." : (
                  <>
                    Trasferisci
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};