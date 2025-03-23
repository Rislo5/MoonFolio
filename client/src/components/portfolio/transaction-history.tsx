import { useState } from "react";
import { Link } from "wouter";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatCurrency, formatNumber, formatDate, getTransactionTypeColor } from "@/lib/utils";
import { SearchIcon, PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AddTransactionDialog from "./add-transaction-dialog";

const TransactionHistory = ({ showAddButton = false, maxTransactions = 5 }) => {
  const { transactions, isConnected, activePortfolio } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  
  // Filter transactions
  const filteredTransactions = transactions
    .filter(tx => {
      // Filter by search query
      const matchesSearch = 
        tx.asset?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.asset?.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;
      
      // Filter by transaction type
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Limit number of transactions shown
  const displayedTransactions = filteredTransactions.slice(0, maxTransactions);
  
  // Check if the portfolio is manual (not ENS)
  const isManualPortfolio = isConnected && activePortfolio && !activePortfolio.isEns;
  
  return (
    <Card>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
        {showAddButton && isManualPortfolio && (
          <Button size="sm" onClick={() => setIsAddTransactionOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Transaction
          </Button>
        )}
      </div>
      
      {showAddButton && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              className="pl-10 w-full sm:w-auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
              <SelectItem value="swap">Swap</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdraw">Withdraw</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTransactions.length > 0 ? (
              displayedTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{formatDate(tx.date)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge className={getTransactionTypeColor(tx.type)}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-5 w-5 rounded-full mr-2"
                        src={tx.asset?.imageUrl || `https://cryptologos.cc/logos/${tx.asset?.name.toLowerCase()}-${tx.asset?.symbol.toLowerCase()}-logo.png`}
                        alt={`${tx.asset?.name} logo`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://cryptologos.cc/logos/question-mark.png";
                        }}
                      />
                      <div className="text-sm text-gray-900 dark:text-white">
                        {tx.type === 'swap' 
                          ? `${tx.asset?.symbol.toUpperCase()} → ${tx.toAsset?.symbol.toUpperCase()}`
                          : `${tx.asset?.name} (${tx.asset?.symbol.toUpperCase()})`
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {tx.type === 'sell' || tx.type === 'withdraw' || tx.type === 'swap'
                        ? `-${formatNumber(Number(tx.amount))} ${tx.asset?.symbol.toUpperCase()}`
                        : `+${formatNumber(Number(tx.amount))} ${tx.asset?.symbol.toUpperCase()}`
                      }
                    </div>
                    {tx.type === 'swap' && tx.toAmount && tx.toAsset && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{formatNumber(Number(tx.toAmount))} {tx.toAsset.symbol.toUpperCase()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {tx.price && (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(Number(tx.price))}
                      </div>
                    )}
                    {tx.type === 'swap' && tx.toPrice && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(Number(tx.toPrice))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(tx.value)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                  {isManualPortfolio && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setIsAddTransactionOpen(true)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add your first transaction
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {displayedTransactions.length > 0 && displayedTransactions.length < filteredTransactions.length && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-right">
          <Link href="/transactions">
            <a className="text-primary-DEFAULT dark:text-primary-light hover:underline">
              View all transactions →
            </a>
          </Link>
        </div>
      )}
      
      {isManualPortfolio && (
        <AddTransactionDialog 
          open={isAddTransactionOpen} 
          onOpenChange={setIsAddTransactionOpen} 
        />
      )}
    </Card>
  );
};

export default TransactionHistory;
