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
  CreditCard
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPopularCryptos, searchCryptos } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Schema per il primo step
const portfolioSchema = z.object({
  name: z.string().min(3, "Il nome deve contenere almeno 3 caratteri").max(50, "Il nome non può superare i 50 caratteri"),
});

// Schema per il secondo step
const assetSchema = z.object({
  assetId: z.string().optional(),
  assetName: z.string().optional(),
  assetSymbol: z.string().optional(),
  assetImage: z.string().optional(),
  assetCoinGeckoId: z.string().optional(),
  quantity: z.string().min(1, "Inserisci una quantità"),
  pricePerCoin: z.string().min(1, "Inserisci un prezzo"),
  searchQuery: z.string().optional()
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
  const { createManualPortfolio, addAsset, setActivePortfolio, portfolios } = usePortfolio();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CryptoCurrency[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null);
  const [createdPortfolioId, setCreatedPortfolioId] = useState<number | null>(null);
  
  // Form per il nome del portfolio
  const portfolioForm = useForm<z.infer<typeof portfolioSchema>>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      name: "",
    },
  });
  
  // Form per l'aggiunta dell'asset
  const assetForm = useForm<z.infer<typeof assetSchema>>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      quantity: "",
      pricePerCoin: "",
      searchQuery: "",
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
    assetForm.setValue("assetId", crypto.id);
    assetForm.setValue("assetName", crypto.name);
    assetForm.setValue("assetSymbol", crypto.symbol);
    assetForm.setValue("assetImage", crypto.image);
    assetForm.setValue("assetCoinGeckoId", crypto.id);
    // Se la criptovaluta ha un prezzo corrente, precompiliamo il campo
    if (crypto.current_price) {
      assetForm.setValue("pricePerCoin", crypto.current_price.toString());
    }
  };
  
  // Gestisce il submit del primo step
  const handleStep1Submit = async (values: z.infer<typeof portfolioSchema>) => {
    setIsSubmitting(true);
    try {
      const newPortfolio = await createManualPortfolio(values.name);
      // @ts-ignore - portfolio structure is complex
      setCreatedPortfolioId(newPortfolio.id);
      setStep(2);
      setProgress(66);
      toast({
        title: "Portfolio creato con successo",
        description: "Ora puoi aggiungere il tuo primo asset",
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
  
  // Gestisce il submit del secondo step
  const handleStep2Submit = async (values: z.infer<typeof assetSchema>) => {
    if (!createdPortfolioId || !selectedCrypto) {
      toast({
        title: "Errore",
        description: "Seleziona prima una criptovaluta",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addAsset({
        name: selectedCrypto.name,
        symbol: selectedCrypto.symbol,
        coinGeckoId: selectedCrypto.id,
        balance: values.quantity,
        avgBuyPrice: values.pricePerCoin,
        imageUrl: selectedCrypto.image
      });
      
      // Attiva il portfolio appena creato
      setActivePortfolio(createdPortfolioId);
      
      // Chiudi il dialog e reimposta tutto
      onOpenChange(false);
      resetForms();
      
      toast({
        title: "Asset aggiunto con successo",
        description: "Il tuo portfolio è pronto all'uso",
      });
      
      // Reindirizza alla dashboard
      window.location.href = '/';
    } catch (error) {
      console.error("Failed to add asset:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile aggiungere l'asset",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reimposta tutti i form e lo stato
  const resetForms = () => {
    portfolioForm.reset();
    assetForm.reset();
    setStep(1);
    setProgress(33);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedCrypto(null);
    setCreatedPortfolioId(null);
  };
  
  // Quando il dialog viene chiuso, resetta tutto
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForms();
    }
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center mb-1">
            <DialogTitle className="text-xl font-bold">
              {step === 1 ? "Crea Nuovo Portfolio" : "Aggiungi il Primo Asset"}
            </DialogTitle>
            <Badge variant="outline" className="ml-auto">Step {step}/2</Badge>
          </div>
          <Progress value={progress} className="h-1 mb-3" />
          <DialogDescription>
            {step === 1 
              ? "Inizia creando un nuovo portfolio per tenere traccia dei tuoi investimenti"
              : "Aggiungi la tua prima criptovaluta al portfolio"}
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 ? (
          <Form {...portfolioForm}>
            <form onSubmit={portfolioForm.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FormField
                    control={portfolioForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Nome Portfolio</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                            <Input 
                              className="pl-10"
                              placeholder="Es. Il mio portafoglio principale" 
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
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg border border-muted">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    Suggerimenti per i tuoi portfolio
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {["Portfolio principale", "Investimenti lungo termine", "Trading attivo", "Risparmi pensione"].map((suggestion) => (
                      <Button 
                        key={suggestion} 
                        variant="outline" 
                        size="sm" 
                        type="button"
                        className="justify-start text-sm"
                        onClick={() => portfolioForm.setValue("name", suggestion)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-1">
                  {isSubmitting ? "Creazione in corso..." : (
                    <>
                      Avanti
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...assetForm}>
            <form onSubmit={assetForm.handleSubmit(handleStep2Submit)} className="space-y-4">
              <div className="space-y-4">
                <Tabs defaultValue="search" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="search">
                      <Search className="h-4 w-4 mr-2" />
                      Cerca
                    </TabsTrigger>
                    <TabsTrigger value="popular">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Popolari
                    </TabsTrigger>
                  </TabsList>
                  
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
                  
                  <TabsContent value="popular">
                    <div className="border rounded-md max-h-[200px] overflow-y-auto">
                      {isLoadingPopular ? (
                        <div className="p-4 text-center">
                          <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-3 py-1">
                              <div className="h-2 bg-muted rounded"></div>
                              <div className="h-2 bg-muted rounded"></div>
                              <div className="h-2 bg-muted rounded"></div>
                            </div>
                          </div>
                        </div>
                      ) : popularCryptos && popularCryptos.length > 0 ? (
                        <div className="p-1">
                          {popularCryptos.map((crypto) => (
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
                              <div className="flex-1">
                                <p className="font-medium">{crypto.name}</p>
                                <p className="text-xs text-muted-foreground uppercase">{crypto.symbol}</p>
                              </div>
                              {crypto.current_price && (
                                <p className="text-sm font-medium">
                                  ${crypto.current_price.toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          Nessuna criptovaluta popolare disponibile
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                {selectedCrypto && (
                  <Card className="border border-primary/20 bg-primary/5">
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
                          control={assetForm.control}
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
                          control={assetForm.control}
                          name="pricePerCoin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prezzo di acquisto ($)</FormLabel>
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
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setStep(1);
                  setProgress(33);
                }}>
                  Indietro
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedCrypto} 
                  className="gap-1"
                >
                  {isSubmitting ? "Salvataggio in corso..." : "Completa"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};