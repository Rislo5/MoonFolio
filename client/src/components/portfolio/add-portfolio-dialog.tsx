import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
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
  FormDescription
} from "@/components/ui/form";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ArrowRight, 
  Sparkles, 
  Plus, 
  Wallet,
  Briefcase,
  CreditCard,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPopularCryptos, searchCryptos } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Schema unificato per la creazione semplificata
const createPortfolioSchema = z.object({
  name: z.string().min(2, "Il nome deve contenere almeno 2 caratteri").max(50, "Il nome non può superare i 50 caratteri"),
  assetId: z.string().optional(),
  assetName: z.string().optional(),
  assetSymbol: z.string().optional(),
  assetImage: z.string().optional(),
  assetCoinGeckoId: z.string().optional(),
  quantity: z.string().optional(),
  pricePerCoin: z.string().optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CryptoCurrency = {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  current_price?: number;
};

export const AddPortfolioDialog = ({ open, onOpenChange }: Props) => {
  const { createManualPortfolio, addAsset, setActivePortfolio } = usePortfolio();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CryptoCurrency[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null);
  
  // Form unificato per la creazione in un solo passaggio
  const form = useForm<z.infer<typeof createPortfolioSchema>>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      name: "",
      quantity: "",
      pricePerCoin: "",
    },
  });
  
  // Fetch delle criptovalute popolari
  const { data: popularCryptos, isLoading: isLoadingPopular } = useQuery({
    queryKey: ['popularCryptos'],
    queryFn: fetchPopularCryptos,
    staleTime: 1000 * 60 * 5, // 5 minuti
  });
  
  // Effettua la ricerca quando cambia il termine di ricerca
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        try {
          const results = await searchCryptos(searchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error("Error searching cryptos:", error);
        }
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);
  
  // Gestisce la selezione di una criptovaluta
  const handleCryptoSelect = (crypto: CryptoCurrency) => {
    setSelectedCrypto(crypto);
    form.setValue("assetId", crypto.id);
    form.setValue("assetName", crypto.name);
    form.setValue("assetSymbol", crypto.symbol);
    form.setValue("assetImage", crypto.image);
    form.setValue("assetCoinGeckoId", crypto.id);
    
    // Se la criptovaluta ha un prezzo corrente, precompiliamo il campo
    if (crypto.current_price) {
      form.setValue("pricePerCoin", crypto.current_price.toString());
    }
  };
  
  // Gestisce il submit del form unificato
  const handleFormSubmit = async (values: z.infer<typeof createPortfolioSchema>) => {
    if (!values.name.trim()) {
      toast({
        title: "Campo obbligatorio",
        description: "Inserisci un nome per il tuo portfolio",
        variant: "destructive",
      });
      return;
    }
    
    // Se abbiamo selezionato una crypto ma mancano i dettagli
    if (selectedCrypto && (!values.quantity || !values.pricePerCoin)) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci la quantità e il prezzo di acquisto per la criptovaluta selezionata",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Crea il portfolio
      const newPortfolio = await createManualPortfolio(values.name);
      
      // Attiva subito il portfolio appena creato
      setActivePortfolio(newPortfolio.id);
      
      // Se è stato selezionato un asset, aggiungilo
      if (selectedCrypto && values.quantity && values.pricePerCoin) {
        await addAsset({
          name: selectedCrypto.name,
          symbol: selectedCrypto.symbol,
          coinGeckoId: selectedCrypto.id,
          balance: values.quantity,
          avgBuyPrice: values.pricePerCoin,
          imageUrl: selectedCrypto.image
        });
        
        toast({
          title: "Portfolio e asset creati con successo",
          description: "Puoi ora visualizzare e gestire il tuo portfolio",
        });
      } else {
        toast({
          title: "Portfolio creato con successo",
          description: "Puoi ora aggiungere asset al tuo portfolio",
        });
      }
      
      // Chiudi il dialog
      onOpenChange(false);
      
      // Reindirizza alla pagina del portfolio
      setLocation('/portfolios');
    } catch (error) {
      console.error("Failed to create portfolio or add asset:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile completare l'operazione",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Quando il dialog viene chiuso, resetta tutto
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setSearchTerm("");
      setSearchResults([]);
      setSelectedCrypto(null);
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Crea Portfolio in un Solo Passaggio
          </DialogTitle>
          <DialogDescription>
            Crea un wallet e aggiungi subito la tua prima criptovaluta
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* SEZIONE NOME PORTFOLIO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2 py-1 rounded-md bg-primary/5">1</Badge>
                <h3 className="text-lg font-medium">Informazioni Portfolio</h3>
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Portfolio</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input 
                          className="pl-10"
                          placeholder="Es. Il mio portfolio principale" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Scegli un nome significativo per distinguere questo portfolio dagli altri
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                {["Portfolio principale", "Investimenti lungo termine", "Trading attivo", "Risparmio"].map((suggestion) => (
                  <Button 
                    key={suggestion} 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    className="justify-start text-sm h-8 rounded-xl"
                    onClick={() => form.setValue("name", suggestion)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator />
            
            {/* SEZIONE AGGIUNGI ASSET (OPZIONALE) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-2 py-1 rounded-md bg-primary/5">2</Badge>
                  <h3 className="text-lg font-medium">Aggiungi Crypto (Opzionale)</h3>
                </div>
                <Badge variant="secondary">Facoltativo</Badge>
              </div>
              
              <Tabs defaultValue="popular" className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="popular">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Popolari
                  </TabsTrigger>
                  <TabsTrigger value="search">
                    <Search className="h-4 w-4 mr-2" />
                    Cerca
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="popular">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {isLoadingPopular ? (
                      Array(6).fill(0).map((_, i) => (
                        <div key={i} className="border rounded-lg p-3 animate-pulse">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <div className="space-y-1 flex-1">
                              <div className="h-3 bg-muted rounded w-16"></div>
                              <div className="h-2 bg-muted rounded w-8"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : popularCryptos && popularCryptos.length > 0 ? (
                      popularCryptos.slice(0, 6).map((crypto: { id: string; name: string; symbol: string; image?: string; current_price?: number }) => (
                        <div
                          key={crypto.id}
                          className={`border rounded-xl p-3 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${
                            selectedCrypto?.id === crypto.id ? "border-primary bg-primary/10" : ""
                          }`}
                          onClick={() => handleCryptoSelect(crypto)}
                        >
                          <div className="flex items-center space-x-2">
                            {crypto.image && (
                              <img src={crypto.image} alt={crypto.name} className="w-8 h-8" />
                            )}
                            <div>
                              <p className="font-medium text-sm leading-tight">{crypto.name}</p>
                              <p className="text-xs text-muted-foreground uppercase">{crypto.symbol}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center p-4 text-muted-foreground">
                        Nessuna criptovaluta popolare disponibile
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="search" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                      className="pl-10"
                      placeholder="Cerca una criptovaluta (es. Bitcoin, Ethereum...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {searchTerm.trim().length > 0 && (
                    <div className="border rounded-md max-h-[200px] overflow-y-auto">
                      {searchResults.length > 0 ? (
                        <div className="p-1">
                          {searchResults.map((crypto) => (
                            <div
                              key={crypto.id}
                              className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                                selectedCrypto?.id === crypto.id ? "bg-primary/10 border-primary" : ""
                              }`}
                              onClick={() => handleCryptoSelect(crypto)}
                            >
                              {crypto.image && (
                                <img src={crypto.image} alt={crypto.name} className="w-6 h-6 mr-2 rounded-full" />
                              )}
                              <div>
                                <p className="font-medium">{crypto.name}</p>
                                <p className="text-xs text-muted-foreground uppercase">{crypto.symbol}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : searchTerm.trim().length > 2 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Nessun risultato trovato per "{searchTerm}"
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Digita almeno 3 caratteri per iniziare la ricerca
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              {selectedCrypto && (
                <Card className="border border-primary/20 bg-primary/5 mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {selectedCrypto.image && (
                        <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-10 h-10 rounded-full" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{selectedCrypto.name}</h3>
                        <p className="text-sm text-muted-foreground uppercase">{selectedCrypto.symbol}</p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedCrypto(null)}
                      >
                        Cambia
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantità</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                  type="number"
                                  step="any"
                                  className="pl-10"
                                  placeholder="Es. 0.5"
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
                        name="pricePerCoin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prezzo ($)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                  type="number"
                                  step="any"
                                  className="pl-10"
                                  placeholder="Es. 50000"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1 min-w-[120px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Creazione...
                  </>
                ) : (
                  "Crea Portfolio"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};