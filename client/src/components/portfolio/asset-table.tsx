import { useQuery } from "@tanstack/react-query";
import { getCryptoPrices } from "@/lib/api";
import { formatCurrency, formatPercentage, calculateProfitLoss, calculateProfitLossPercentage } from "@/lib/utils";
import { Asset } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetTableProps {
  assets: Asset[];
  onAddTransaction: () => void;
}

export default function AssetTable({ assets, onAddTransaction }: AssetTableProps) {
  // Generate coin IDs for API call
  const coinIds = assets.map(asset => asset.symbol.toLowerCase());

  // Fetch current prices from API
  const { data: prices, isLoading } = useQuery({
    queryKey: [`/api/crypto/prices?ids=${coinIds.join(',')}`],
    enabled: assets.length > 0
  });

  // Enrich assets with current prices and calculations
  const enrichedAssets = assets.map(asset => {
    const symbol = asset.symbol.toLowerCase();
    const currentPrice = prices?.[symbol]?.usd || 0;
    const change24h = prices?.[symbol]?.usd_24h_change || 0;
    const totalValue = currentPrice * parseFloat(asset.quantity);
    const avgPrice = parseFloat(asset.avgPrice);
    const profitLoss = calculateProfitLoss(currentPrice, avgPrice, parseFloat(asset.quantity));
    const profitLossPercentage = calculateProfitLossPercentage(currentPrice, avgPrice);

    return {
      ...asset,
      currentPrice,
      totalValue,
      change24h,
      profitLoss,
      profitLossPercentage
    };
  });

  if (assets.length === 0) {
    return (
      <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm p-6 text-center">
        <h3 className="font-bold text-lg mb-4">No Assets Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Start tracking your assets by adding them to your portfolio</p>
        <Button onClick={onAddTransaction}>Add Your First Asset</Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-lighter rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-lg">Your Assets</h3>
        <Button onClick={onAddTransaction} size="sm">
          Add Asset
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Avg. Price</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>24h</TableHead>
              <TableHead>Profit/Loss</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading state
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(7).fill(0).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Data state
              enrichedAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <img 
                          className="h-8 w-8 rounded-full" 
                          src={`https://cryptologos.cc/logos/${asset.name.toLowerCase()}-${asset.symbol.toLowerCase()}-logo.png?v=024`} 
                          alt={asset.name}
                          onError={(e) => {
                            // Fallback for missing images
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random`;
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">{asset.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{asset.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{parseFloat(asset.quantity).toFixed(4)} {asset.symbol.toUpperCase()}</TableCell>
                  <TableCell>{formatCurrency(parseFloat(asset.avgPrice))}</TableCell>
                  <TableCell>{formatCurrency(asset.currentPrice || 0)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(asset.totalValue || 0)}</TableCell>
                  <TableCell className={(asset.change24h || 0) >= 0 ? "text-green-500" : "text-red-500"}>
                    {formatPercentage(asset.change24h || 0)}
                  </TableCell>
                  <TableCell className={(asset.profitLoss || 0) >= 0 ? "text-green-500" : "text-red-500"}>
                    {formatCurrency(asset.profitLoss || 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
