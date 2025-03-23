import { useQuery } from "@tanstack/react-query";
import { fetchCryptoPrice } from "@/lib/api";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { AssetWithPrice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetTableProps {
  assets: AssetWithPrice[];
  onAddTransaction: () => void;
  onTransferAsset?: (assetId: number) => void;
  showTransferButton?: boolean;
}

export default function AssetTable({ 
  assets, 
  onAddTransaction, 
  onTransferAsset, 
  showTransferButton = false 
}: AssetTableProps) {
  // Non abbiamo bisogno di fare una chiamata API extra perché gli asset includono già i prezzi
  const isLoading = false;

  // Gli asset sono già arricchiti con informazioni sui prezzi
  const enrichedAssets = assets;

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
              {showTransferButton && <TableHead>Azioni</TableHead>}
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
                  <TableCell>{parseFloat(asset.balance).toFixed(4)} {asset.symbol.toUpperCase()}</TableCell>
                  <TableCell>{formatCurrency(asset.avgBuyPrice ? parseFloat(asset.avgBuyPrice) : 0)}</TableCell>
                  <TableCell>{formatCurrency(asset.currentPrice || 0)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(asset.value || 0)}</TableCell>
                  <TableCell className={(asset.priceChange24h || 0) >= 0 ? "text-green-500" : "text-red-500"}>
                    {formatPercentage(asset.priceChange24h || 0)}
                  </TableCell>
                  <TableCell className={(asset.profitLoss || 0) >= 0 ? "text-green-500" : "text-red-500"}>
                    {formatCurrency(asset.profitLoss || 0)}
                  </TableCell>
                  {showTransferButton && onTransferAsset && (
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onTransferAsset(asset.id)}
                        className="flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8L22 12L18 16" />
                          <path d="M2 12H22" />
                        </svg>
                        Trasferisci
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
