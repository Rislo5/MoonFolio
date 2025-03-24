import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { createTransaction } from "@/lib/api";
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

// Schema for the transfer
const transferAssetSchema = z.object({
  sourceAssetId: z.string().min(1, "Select an asset to transfer"),
  targetPortfolioId: z.string().min(1, "Select a destination portfolio"),
  amount: z.string().min(1, "Enter an amount to transfer"),
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
    addTransaction, 
    addAsset
  } = usePortfolio();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithPrice | null>(null);
  
  // Form for the transfer
  const form = useForm<z.infer<typeof transferAssetSchema>>({
    resolver: zodResolver(transferAssetSchema),
    defaultValues: {
      sourceAssetId: initialAssetId ? initialAssetId.toString() : "",
      targetPortfolioId: "",
      amount: "",
    },
  });

  // Set the initial asset if specified
  useEffect(() => {
    if (initialAssetId && open) {
      form.setValue("sourceAssetId", initialAssetId.toString());
      const asset = assets.find(a => a.id === initialAssetId);
      if (asset) {
        setSelectedAsset(asset);
      }
    }
  }, [initialAssetId, assets, open, form]);

  // Update the selected asset when the selection changes
  const handleAssetChange = (assetId: string) => {
    const asset = assets.find(a => a.id === parseInt(assetId));
    setSelectedAsset(asset || null);
  };

  // Available portfolios for transfer (excluding the active one)
  const availablePortfolios = portfolios.filter(p => p.id !== activePortfolio?.id);

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof transferAssetSchema>) => {
    if (!activePortfolio || !selectedAsset) return;
    
    const sourceAssetId = parseInt(values.sourceAssetId);
    const targetPortfolioId = parseInt(values.targetPortfolioId);
    const amount = parseFloat(values.amount);
    
    // Check that the amount does not exceed the available balance
    if (amount > parseFloat(selectedAsset.balance.toString())) {
      toast({
        title: "Invalid amount",
        description: "The transfer amount exceeds the available balance",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Check if the destination portfolio exists
      const targetPortfolio = portfolios.find(p => p.id === targetPortfolioId);
      if (!targetPortfolio) {
        throw new Error("Destination portfolio not found");
      }
      
      // 2. Create a "withdraw" transaction in the source portfolio
      await addTransaction({
        assetId: sourceAssetId,
        type: "withdraw",
        amount: amount.toString(),
        price: selectedAsset.currentPrice?.toString() || selectedAsset.avgBuyPrice || "0",
        date: new Date().toISOString(), // Convert to ISO string
      });
      
      // 2b. Update the asset balance in the source portfolio
      const currentBalance = parseFloat(selectedAsset.balance.toString());
      const newBalance = currentBalance - amount;
      
      // If the balance is 0, delete the asset, otherwise update it
      if (newBalance <= 0) {
        // Delete the asset from the source portfolio
        await fetch(`/api/assets/${sourceAssetId}`, {
          method: 'DELETE',
        });
      } else {
        // Update the asset with the new balance
        await fetch(`/api/assets/${sourceAssetId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            balance: newBalance.toString(),
          }),
        });
      }
      
      // 3. Add or update the asset in the destination portfolio using the direct API
      const response = await fetch(`/api/portfolios/${targetPortfolioId}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedAsset.name,
          symbol: selectedAsset.symbol,
          coinGeckoId: selectedAsset.coinGeckoId,
          balance: amount.toString(),
          avgBuyPrice: selectedAsset.currentPrice?.toString() || selectedAsset.avgBuyPrice || "0",
          imageUrl: selectedAsset.imageUrl || undefined
        }),
      });
      
      if (!response.ok) {
        throw new Error("Unable to add the asset to the destination portfolio");
      }
      
      const newAsset = await response.json();
      
      // 4. Create a "deposit" transaction in the destination portfolio
      if (newAsset && newAsset.id) {
        await createTransaction(targetPortfolioId, {
          assetId: newAsset.id,
          type: "deposit",
          amount: amount.toString(),
          price: selectedAsset.currentPrice?.toString() || selectedAsset.avgBuyPrice || "0",
          date: new Date().toISOString(), // Convert to ISO string
        });
      }
      
      toast({
        title: "Transfer completed",
        description: `${amount} ${selectedAsset.symbol.toUpperCase()} successfully transferred to ${targetPortfolio.name}`,
      });
      
      // Force data refresh: assets, transactions and overview
      
      // Invalidate all queries related to the source portfolio assets
      await queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${activePortfolio.id}/assets`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${activePortfolio.id}/overview`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${activePortfolio.id}/transactions`] });
      
      // Invalidate all queries related to the destination portfolio assets
      await queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${targetPortfolioId}/assets`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${targetPortfolioId}/overview`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${targetPortfolioId}/transactions`] });
      
      // Wait a brief moment to allow data to update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to transfer asset:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unable to complete the transfer",
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
          <DialogTitle>Transfer Asset</DialogTitle>
          <DialogDescription>
            Transfer an asset from this portfolio to another.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Asset selection */}
            <FormField
              control={form.control}
              name="sourceAssetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset to transfer</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleAssetChange(value);
                    }}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an asset" />
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
            
            {/* Destination portfolio selection */}
            <FormField
              control={form.control}
              name="targetPortfolioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination portfolio</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a portfolio" />
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
                          No other portfolios available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The asset will be transferred to this portfolio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Amount to transfer */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to transfer</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number"
                        step="any"
                        min="0"
                        max={selectedAsset ? selectedAsset.balance.toString() : undefined}
                        placeholder="e.g. 0.5"
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
                      Available balance: {selectedAsset.balance.toString()} {selectedAsset.symbol.toUpperCase()}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Summary schema */}
            {selectedAsset && form.watch("targetPortfolioId") && (
              <div className="rounded-lg border p-3 bg-muted/10">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-col items-start">
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">{activePortfolio?.name}</span>
                  </div>
                  <ArrowRight className="text-muted-foreground" />
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">To:</span>
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
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.formState.isValid || availablePortfolios.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  "Transfer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};