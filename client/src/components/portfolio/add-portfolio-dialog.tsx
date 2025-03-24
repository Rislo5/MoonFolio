import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Sparkles, 
  Plus, 
  Briefcase,
  Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchPopularCryptos, searchCryptos } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Schema for portfolio creation
const createPortfolioSchema = z.object({
  name: z.string().min(2, "Name must contain at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  selectedCryptos: z.array(z.object({
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    image: z.string().optional(),
    balance: z.string().optional(),
    avgPrice: z.string().optional()
  })).optional(),
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
  selected?: boolean;
  balance?: string;
  avgPrice?: string;
};

export const AddPortfolioDialog = ({ open, onOpenChange }: Props) => {
  const { createManualPortfolio, addAsset, setActivePortfolio } = usePortfolio();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CryptoCurrency[]>([]);
  const [selectedCryptos, setSelectedCryptos] = useState<CryptoCurrency[]>([]);
  const [activeTab, setActiveTab] = useState<"popular" | "search">("popular");
  
  // Form for portfolio creation
  const form = useForm<z.infer<typeof createPortfolioSchema>>({
    resolver: zodResolver(createPortfolioSchema),
    defaultValues: {
      name: "",
      selectedCryptos: [],
    },
  });
  
  // Fetch popular cryptocurrencies
  const { data: popularCryptos, isLoading: isLoadingPopular } = useQuery({
    queryKey: ['popularCryptos'],
    queryFn: fetchPopularCryptos,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Perform search when search term changes
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchTerm.trim().length > 2) {
        try {
          const results = await searchCryptos(searchTerm);
          // Add selected flag for already selected items
          const resultsWithSelected = results.map((crypto: CryptoCurrency) => ({
            ...crypto,
            selected: selectedCryptos.some(selected => selected.id === crypto.id)
          }));
          setSearchResults(resultsWithSelected);
        } catch (error) {
          console.error("Error searching cryptos:", error);
        }
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm, selectedCryptos]);
  
  // Handles selection/deselection of a cryptocurrency
  const toggleCryptoSelection = (crypto: CryptoCurrency) => {
    if (selectedCryptos.some(selected => selected.id === crypto.id)) {
      // If already selected, remove it
      setSelectedCryptos(prev => prev.filter(item => item.id !== crypto.id));
    } else {
      // Otherwise add it
      setSelectedCryptos(prev => [...prev, { 
        ...crypto, 
        balance: "", 
        avgPrice: crypto.current_price ? crypto.current_price.toString() : ""
      }]);
    }
  };
  
  // Handles updating the balance of a selected cryptocurrency
  const updateCryptoBalance = (id: string, balance: string) => {
    setSelectedCryptos(prev => 
      prev.map(crypto => 
        crypto.id === id 
          ? { ...crypto, balance } 
          : crypto
      )
    );
  };
  
  // Handles updating the average price of a selected cryptocurrency
  const updateCryptoAvgPrice = (id: string, avgPrice: string) => {
    setSelectedCryptos(prev => 
      prev.map(crypto => 
        crypto.id === id 
          ? { ...crypto, avgPrice } 
          : crypto
      )
    );
  };
  
  // Handles form submission
  const handleFormSubmit = async (values: z.infer<typeof createPortfolioSchema>) => {
    if (!values.name.trim()) {
      toast({
        title: "Campo obbligatorio",
        description: "Inserisci un nome per il tuo portfolio",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the portfolio
      const newPortfolio = await createManualPortfolio(values.name);
      
      // Immediately activate the newly created portfolio
      setActivePortfolio(newPortfolio.id);
      
      // Add all selected assets if present
      if (selectedCryptos.length > 0) {
        for (const crypto of selectedCryptos) {
          // Add only if balance and avgPrice have been filled
          if (crypto.balance && crypto.avgPrice) {
            await addAsset({
              name: crypto.name,
              symbol: crypto.symbol,
              coinGeckoId: crypto.id,
              balance: crypto.balance,
              avgBuyPrice: crypto.avgPrice,
              imageUrl: crypto.image
            });
          }
        }
        
        toast({
          title: "Portfolio creato con successo",
          description: `Portfolio "${values.name}" creato con ${selectedCryptos.filter(c => c.balance && c.avgPrice).length} asset`,
        });
      } else {
        toast({
          title: "Portfolio creato con successo",
          description: "Puoi ora aggiungere asset al tuo portfolio",
        });
      }
      
      // Invalidate all portfolio-related queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['/overview-chart'] });
      
      // Close the dialog
      onOpenChange(false);
      
      // Redirect to the portfolio page
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
  
  // When the dialog is closed, reset everything
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setSearchTerm("");
      setSearchResults([]);
      setSelectedCryptos([]);
      setActiveTab("popular");
    }
    onOpenChange(open);
  };
  
  // Renders a crypto card
  const renderCryptoCard = (crypto: CryptoCurrency) => {
    const isSelected = selectedCryptos.some(selected => selected.id === crypto.id);
    
    return (
      <div
        key={crypto.id}
        className={`border rounded-xl p-3 cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${
          isSelected ? "border-primary bg-primary/10" : ""
        }`}
        onClick={() => toggleCryptoSelection(crypto)}
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
    );
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
            {/* PORTFOLIO NAME SECTION */}
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
            
            {/* ADD CRYPTOCURRENCY SECTION (OPTIONAL) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-2 py-1 rounded-md bg-primary/5">2</Badge>
                  <h3 className="text-lg font-medium">Add Cryptocurrencies (Optional)</h3>
                </div>
                <Badge variant="secondary">Optional</Badge>
              </div>
              
              {/* Tabs for popular/search */}
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={activeTab === "popular" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setActiveTab("popular")}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Popular
                  </Button>
                  <Button
                    type="button"
                    variant={activeTab === "search" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setActiveTab("search")}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                
                {/* Popular tab content */}
                {activeTab === "popular" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {isLoadingPopular ? (
                      // Placeholders while loading
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
                      // List of popular cryptocurrencies
                      popularCryptos.slice(0, 6).map((crypto: any) => renderCryptoCard(crypto))
                    ) : (
                      <div className="col-span-full text-center p-4 text-muted-foreground">
                        No popular cryptocurrencies available
                      </div>
                    )}
                  </div>
                )}
                
                {/* Search tab content */}
                {activeTab === "search" && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        className="pl-10"
                        placeholder="Search for a cryptocurrency (e.g. Bitcoin, Ethereum...)"
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
                                  selectedCryptos.some(selected => selected.id === crypto.id) ? "bg-primary/10" : ""
                                }`}
                                onClick={() => toggleCryptoSelection(crypto)}
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
                            No results found for "{searchTerm}"
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            Type at least 3 characters to start searching
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* List of selected cryptocurrencies */}
              {selectedCryptos.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="text-sm font-medium">Selected Cryptocurrencies</h4>
                  
                  {selectedCryptos.map((crypto) => (
                    <div key={crypto.id} className="border rounded-lg p-3 bg-muted/10">
                      <div className="flex items-center mb-2">
                        {crypto.image && (
                          <img src={crypto.image} alt={crypto.name} className="w-6 h-6 mr-2 rounded-full" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{crypto.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">{crypto.symbol}</p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => toggleCryptoSelection(crypto)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium block mb-1">Quantity</label>
                          <Input 
                            type="number" 
                            step="any" 
                            min="0"
                            placeholder="e.g. 0.25" 
                            value={crypto.balance || ""}
                            onChange={(e) => updateCryptoBalance(crypto.id, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-1">Purchase price ($)</label>
                          <Input 
                            type="number" 
                            step="any" 
                            min="0"
                            placeholder="e.g. 50000" 
                            value={crypto.avgPrice || ""}
                            onChange={(e) => updateCryptoAvgPrice(crypto.id, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.getValues().name}
                className="ml-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating portfolio...
                  </>
                ) : (
                  <>
                    Crea Portfolio
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