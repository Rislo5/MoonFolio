import { useState } from "react";
import { Link } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatCurrency, formatNumber, shortenAddress } from "@/lib/utils";
import { SearchIcon, PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddAssetDialog from "./add-asset-dialog";
import { AssetWithPrice } from "@shared/schema";

const AssetSummary = ({ showAddButton = false, maxAssets = 5 }) => {
  const { assets, isConnected, activePortfolio } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  
  // Filter and sort assets
  const filteredAssets = assets
    .filter(asset => 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.value - a.value);
  
  // Limit number of assets shown
  const displayedAssets = filteredAssets.slice(0, maxAssets);
  
  // Check if the portfolio is manual (not ENS)
  const isManualPortfolio = isConnected && activePortfolio && !activePortfolio.isEns;
  
  return (
    <Card className="mb-8">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assets Summary</h2>
        {showAddButton && isManualPortfolio && (
          <Button size="sm" onClick={() => setIsAddAssetOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Asset
          </Button>
        )}
      </div>
      
      {showAddButton && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">24h</TableHead>
              <TableHead className="text-right">P/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedAssets.length > 0 ? (
              displayedAssets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-8 w-8 rounded-full mr-3"
                        src={asset.imageUrl || `https://cryptologos.cc/logos/${asset.name.toLowerCase()}-${asset.symbol.toLowerCase()}-logo.png`}
                        alt={`${asset.name} logo`}
                        onError={(e) => {
                          // If image fails to load, set a default image
                          (e.target as HTMLImageElement).src = "https://cryptologos.cc/logos/question-mark.png";
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{asset.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatNumber(Number(asset.balance))} {asset.symbol.toUpperCase()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatCurrency(asset.currentPrice)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(asset.value)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      asset.priceChange24h >= 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {asset.priceChange24h >= 0 ? "+" : ""}
                      {asset.priceChange24h.toFixed(1)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {asset.avgBuyPrice && (
                      <div className={`text-sm font-medium ${
                        asset.profitLoss >= 0 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {asset.profitLoss >= 0 ? "+" : ""}
                        {formatCurrency(asset.profitLoss)}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No assets found</p>
                  {isManualPortfolio && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setIsAddAssetOpen(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add your first asset
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {displayedAssets.length > 0 && displayedAssets.length < filteredAssets.length && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-right">
          <Link href="/assets">
            <a className="text-primary-DEFAULT dark:text-primary-light hover:underline">
              View all assets →
            </a>
          </Link>
        </div>
      )}
      
      {isManualPortfolio && (
        <AddAssetDialog 
          open={isAddAssetOpen} 
          onOpenChange={setIsAddAssetOpen} 
        />
      )}
    </Card>
  );
};

export default AssetSummary;
