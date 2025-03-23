import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { fetchPopularCryptos, searchCryptos } from "@/lib/api";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  coinGeckoId: z.string().min(1, "Please select a cryptocurrency"),
  name: z.string().min(1, "Name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  balance: z.coerce.number().positive("Balance must be positive"),
  avgBuyPrice: z.coerce.number().positive("Price must be positive").optional(),
  imageUrl: z.string().optional(),
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
};

const AddAssetDialog = ({ open, onOpenChange }: Props) => {
  const { addAsset } = usePortfolio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cryptoList, setCryptoList] = useState<CryptoCurrency[]>([]);
  const [searchResults, setSearchResults] = useState<CryptoCurrency[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [openCryptoSelect, setOpenCryptoSelect] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coinGeckoId: "",
      name: "",
      symbol: "",
      balance: undefined,
      avgBuyPrice: undefined,
      imageUrl: "",
    },
  });
  
  // Fetch popular cryptocurrencies on mount
  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        const data = await fetchPopularCryptos();
        // Map to format we need
        const cryptos = data.map((crypto: any) => ({
          id: crypto.id,
          name: crypto.name,
          symbol: crypto.symbol,
          image: crypto.image,
        }));
        setCryptoList(cryptos);
      } catch (error) {
        console.error("Failed to fetch popular cryptocurrencies:", error);
        toast({
          title: "Error",
          description: "Failed to fetch cryptocurrencies",
          variant: "destructive",
        });
      }
    };
    
    fetchCryptos();
  }, [toast]);
  
  // Handle search query changes
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const data = await searchCryptos(searchQuery);
        // Map to format we need
        const cryptos = data.coins.map((crypto: any) => ({
          id: crypto.id,
          name: crypto.name,
          symbol: crypto.symbol,
          image: crypto.large,
        }));
        setSearchResults(cryptos);
      } catch (error) {
        console.error("Failed to search cryptocurrencies:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    
    return () => clearTimeout(searchTimer);
  }, [searchQuery]);
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await addAsset({
        name: values.name,
        symbol: values.symbol,
        coinGeckoId: values.coinGeckoId,
        balance: values.balance.toString(), // Convert to string
        avgBuyPrice: values.avgBuyPrice ? values.avgBuyPrice.toString() : undefined, // Convert to string if defined
        imageUrl: values.imageUrl,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to add asset:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add asset",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // When a cryptocurrency is selected, populate the form fields
  const onCryptoSelect = (crypto: CryptoCurrency) => {
    form.setValue("coinGeckoId", crypto.id);
    form.setValue("name", crypto.name);
    form.setValue("symbol", crypto.symbol);
    form.setValue("imageUrl", crypto.image || "");
    setOpenCryptoSelect(false);
  };
  
  // Combine search results and popular cryptos for display
  const displayCryptos = searchQuery.length >= 2 ? searchResults : cryptoList;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Add a cryptocurrency to your portfolio
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="coinGeckoId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cryptocurrency</FormLabel>
                  <Popover open={openCryptoSelect} onOpenChange={setOpenCryptoSelect}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCryptoSelect}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? cryptoList.find((crypto) => crypto.id === field.value)?.name ||
                              searchResults.find((crypto) => crypto.id === field.value)?.name ||
                              "Select cryptocurrency"
                            : "Select cryptocurrency"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search cryptocurrency..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        {isSearching && (
                          <div className="py-6 text-center text-sm">Searching...</div>
                        )}
                        {!isSearching && (
                          <CommandList>
                            <CommandEmpty>No cryptocurrencies found</CommandEmpty>
                            <CommandGroup>
                              {displayCryptos.map((crypto) => (
                                <CommandItem
                                  key={crypto.id}
                                  value={crypto.id}
                                  onSelect={() => onCryptoSelect(crypto)}
                                >
                                  <div className="flex items-center">
                                    {crypto.image && (
                                      <img
                                        src={crypto.image}
                                        alt={crypto.name}
                                        className="mr-2 h-5 w-5 rounded-full"
                                      />
                                    )}
                                    <span>{crypto.name}</span>
                                    <span className="ml-1 text-gray-500">
                                      ({crypto.symbol.toUpperCase()})
                                    </span>
                                  </div>
                                  <CheckIcon
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      field.value === crypto.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        )}
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance</FormLabel>
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
                  <FormLabel>Average Buy Price (USD)</FormLabel>
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAssetDialog;
