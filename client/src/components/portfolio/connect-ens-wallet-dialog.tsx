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
  Search, 
  Wallet, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

// Schema per la connessione al wallet ENS
const connectWalletSchema = z.object({
  addressOrEns: z.string()
    .min(1, "Inserisci un indirizzo Ethereum o nome ENS")
    .refine(
      value => (
        /^0x[a-fA-F0-9]{40}$/.test(value) || // Indirizzo Ethereum
        /^[a-zA-Z0-9]+(\.eth)$/.test(value)  // Nome ENS
      ), 
      {
        message: "Inserisci un indirizzo Ethereum valido (0x...) o un nome ENS (esempio.eth)"
      }
    )
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
      addressOrEns: ""
    }
  });

  const handleSubmit = async (values: ConnectWalletFormValues) => {
    setIsConnecting(true);
    setError(null);

    try {
      await connectEnsWallet(values.addressOrEns);
      toast({
        title: t("common.success"),
        description: `Wallet ${values.addressOrEns} connesso con successo`,
      });
      onOpenChange(false); // Chiude il dialog dopo la connessione
    } catch (error) {
      setError(error instanceof Error ? error.message : "Errore durante la connessione al wallet");
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Errore durante la connessione al wallet",
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
            {t("portfolio.connect_ens_wallet")}
          </DialogTitle>
          <DialogDescription>
            {t("portfolio.connect_ens_description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="addressOrEns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("portfolio.address_or_ens")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="vitalik.eth o 0x123..." 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("portfolio.address_or_ens_description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("common.error")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  {t("common.cancel")}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.connecting")}
                  </>
                ) : (
                  t("common.connect")
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