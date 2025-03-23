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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const formSchema = z.object({
  type: z.enum(["buy", "sell", "swap", "deposit", "withdraw"]),
  assetId: z.coerce.number().positive("Please select an asset"),
  amount: z.coerce.number().positive("Amount must be positive"),
  price: z.coerce.number().positive("Price must be positive").optional()
    .refine(val => val !== undefined || val !== null, {
      message: "Price is required for buy/sell transactions",
      path: ["price"],
    }),
  date: z.string().optional(),
  toAssetId: z.coerce.number().positive("Please select a destination asset").optional(),
  toAmount: z.coerce.number().positive("Amount must be positive").optional(),
  toPrice: z.coerce.number().positive("Price must be positive").optional(),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AddTransactionDialog = ({ open, onOpenChange }: Props) => {
  const { assets, addTransaction } = usePortfolio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "buy",
      assetId: undefined,
      amount: undefined,
      price: undefined,
      date: new Date().toISOString().split('T')[0],
      toAssetId: undefined,
      toAmount: undefined,
      toPrice: undefined,
    },
  });
  
  const transactionType = form.watch("type");
  
  // Update validation based on transaction type
  useEffect(() => {
    // Reset swap-related fields when changing transaction type
    if (transactionType !== "swap") {
      form.setValue("toAssetId", undefined);
      form.setValue("toAmount", undefined);
      form.setValue("toPrice", undefined);
    }
    
    // Reset price for deposit/withdraw transactions
    if (transactionType === "deposit" || transactionType === "withdraw") {
      form.setValue("price", undefined);
    }
  }, [transactionType, form]);
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate based on transaction type
    if ((values.type === "buy" || values.type === "sell") && !values.price) {
      form.setError("price", {
        type: "manual",
        message: "Price is required for buy/sell transactions",
      });
      return;
    }
    
    if (values.type === "swap") {
      if (!values.toAssetId) {
        form.setError("toAssetId", {
          type: "manual",
          message: "Please select a destination asset",
        });
        return;
      }
      
      if (!values.toAmount) {
        form.setError("toAmount", {
          type: "manual",
          message: "Please enter the amount received",
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await addTransaction({
        type: values.type,
        assetId: values.assetId,
        amount: values.amount,
        price: values.price,
        date: values.date,
        toAssetId: values.toAssetId,
        toAmount: values.toAmount,
        toPrice: values.toPrice,
      });
      onOpenChange(false);
      form.reset({
        type: "buy",
        assetId: undefined,
        amount: undefined,
        price: undefined,
        date: new Date().toISOString().split('T')[0],
        toAssetId: undefined,
        toAmount: undefined,
        toPrice: undefined,
      });
    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add transaction",
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
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Record a new transaction in your portfolio
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="swap">Swap</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdraw">Withdraw</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{transactionType === "swap" ? "From Asset" : "Asset"}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            {asset.name} ({asset.symbol.toUpperCase()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {transactionType === "swap" ? "Amount Sent" : "Amount"}
                    </FormLabel>
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
            </div>
            
            {transactionType !== "deposit" && transactionType !== "withdraw" && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {transactionType === "swap" ? "Price of Sent Asset (USD)" : "Price (USD)"}
                    </FormLabel>
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
            )}
            
            {transactionType === "swap" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="toAssetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Asset</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assets
                              .filter(asset => asset.id !== form.getValues("assetId"))
                              .map((asset) => (
                                <SelectItem key={asset.id} value={asset.id.toString()}>
                                  {asset.name} ({asset.symbol.toUpperCase()})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="toAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Received</FormLabel>
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
                </div>
                
                <FormField
                  control={form.control}
                  name="toPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price of Received Asset (USD)</FormLabel>
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
              </>
            )}
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
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
                {isSubmitting ? "Adding..." : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
