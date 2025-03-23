import { useWallet } from "@/context/wallet-context";
import { shortenAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

interface WalletHeaderProps {
  title: string;
  onAddTransaction?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function WalletHeader({ 
  title, 
  onAddTransaction, 
  onRefresh,
  loading = false
}: WalletHeaderProps) {
  const { wallet } = useWallet();

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {wallet && (
          <p className="text-muted-foreground">
            {wallet.type === "ens" && wallet.address
              ? shortenAddress(wallet.address, 6)
              : wallet.name}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {onRefresh && (
          <Button 
            variant="outline" 
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Refresh</span>
          </Button>
        )}
        {onAddTransaction && (
          <Button 
            onClick={onAddTransaction}
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Transaction</span>
          </Button>
        )}
      </div>
    </div>
  );
}
