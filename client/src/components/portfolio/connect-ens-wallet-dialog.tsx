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
  Switch
} from "@/components/ui/switch";
import { 
  Search, 
  Wallet, 
  Loader2,
  AlertCircle,
  PlusCircle,
  Eye
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

// Schema for ENS wallet connection
const connectWalletSchema = z.object({
  addressOrEns: z.string()
    .min(1, "Enter an Ethereum address or ENS name")
    .refine(
      value => (
        /^0x[a-fA-F0-9]{40}$/.test(value) || // Ethereum address
        /^[a-zA-Z0-9]+(\.eth)$/.test(value)  // ENS name
      ), 
      {
        message: "Enter a valid Ethereum address (0x...) or an ENS name (example.eth)"
      }
    ),
  includeInSummary: z.boolean().default(false) // Modified: default is false
});

type ConnectWalletFormValues = z.infer<typeof connectWalletSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ConnectEnsWalletDialog = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { connectEnsWallet } = usePortfolio();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ConnectWalletFormValues>({
    resolver: zodResolver(connectWalletSchema),
    defaultValues: {
      addressOrEns: "",
      includeInSummary: false // Modified: default is false for consistency with the schema
    }
  });

  const handleSubmit = async (values: ConnectWalletFormValues) => {
    setIsConnecting(true);
    setError(null);

    try {
      // Also pass the includeInSummary parameter
      await connectEnsWallet(values.addressOrEns, values.includeInSummary);
      toast({
        title: t("common.success"),
        description: values.includeInSummary 
          ? `Wallet ${values.addressOrEns} connected and added to the summary`
          : `Wallet ${values.addressOrEns} connected in view-only mode`,
      });
      onOpenChange(false); // Close the dialog after connection
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error connecting to wallet");
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Error connecting to wallet",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect ENS Wallet
          </DialogTitle>
          <DialogDescription>
            Enter an Ethereum address or ENS name to view the tokens in the wallet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="addressOrEns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ethereum Address or ENS</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="vitalik.eth or 0x123..." 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter a valid Ethereum address (0x...) or ENS domain name (name.eth)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="includeInSummary"
              render={({ field }) => (
                <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-4 ${field.value ? 'border-primary' : 'border-muted'}`}>
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">
                      {field.value ? 'Add to general summary' : 'View-only mode'}
                    </FormLabel>
                    <FormDescription>
                      {field.value ? (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                          This wallet will be included in the calculation of your portfolio's total value
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Eye className="mr-2 h-4 w-4" />
                          This wallet will be visible but will not be included in the total value calculation
                        </div>
                      )}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="flex justify-end">
              <Button type="submit" disabled={isConnecting} className="w-full sm:w-auto">
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectEnsWalletDialog;