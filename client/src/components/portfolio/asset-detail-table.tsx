import { useState, useMemo } from "react";
import { AssetWithPrice } from "@shared/schema";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  CircleArrowDown,
  CircleArrowUp,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import AddTransactionDialog from "./add-transaction-dialog";
import AddAssetDialog from "./add-asset-dialog";
import { Badge } from "@/components/ui/badge";

// Tipo per le opzioni di ordinamento
type SortOption = {
  column: keyof AssetWithPrice | 'profitLossPercentage';
  direction: 'asc' | 'desc';
};

export default function AssetDetailTable() {
  const { assets, removeAsset } = usePortfolio();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>({ column: 'value', direction: 'desc' });
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithPrice | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Apre il dialog per aggiungere una transazione per un asset specifico
  const handleAddTransaction = (asset: AssetWithPrice) => {
    setSelectedAsset(asset);
    setShowAddTransactionDialog(true);
  };

  // Gestisce l'eliminazione di un asset
  const handleDeleteAsset = async (assetId: number) => {
    if (window.confirm("Sei sicuro di voler eliminare questo asset? Questa azione non può essere annullata.")) {
      setIsDeleting(assetId);
      try {
        await removeAsset(assetId);
        toast({
          title: "Asset eliminato",
          description: "L'asset è stato rimosso dal portfolio",
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile eliminare l'asset",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Gestisce il cambio dell'ordinamento
  const handleSort = (column: keyof AssetWithPrice | 'profitLossPercentage') => {
    setSortOption((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Filtra e ordina gli asset
  const filteredAndSortedAssets = useMemo(() => {
    // Prima filtriamo per termine di ricerca
    const filtered = assets.filter((asset) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        asset.name.toLowerCase().includes(searchLower) ||
        asset.symbol.toLowerCase().includes(searchLower)
      );
    });

    // Poi ordiniamo secondo l'opzione selezionata
    return [...filtered].sort((a, b) => {
      // Gestisci ordinamento per profitLossPercentage che non è una chiave diretta
      if (sortOption.column === 'profitLossPercentage') {
        const aValue = a.profitLossPercentage || 0;
        const bValue = b.profitLossPercentage || 0;
        return sortOption.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Ordinamento per altre colonne
      const aValue = a[sortOption.column] || 0;
      const bValue = b[sortOption.column] || 0;
      
      // Ordinamento per stringhe
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOption.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Ordinamento per numeri
      return sortOption.direction === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
  }, [assets, searchTerm, sortOption]);

  // Calcola il valore totale di tutti gli asset
  const totalValue = useMemo(() => {
    return assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
  }, [assets]);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">Asset detenuti</h3>
          <p className="text-sm text-muted-foreground">
            {assets.length} asset per un valore totale di {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <ListFilter className="mr-2 h-4 w-4" />
                Filtri
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ordina per</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSort('name')}>
                Nome {sortOption.column === 'name' && (sortOption.direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('value')}>
                Valore {sortOption.column === 'value' && (sortOption.direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('profitLossPercentage')}>
                Guadagno/Perdita {sortOption.column === 'profitLossPercentage' && (sortOption.direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('priceChange24h')}>
                Variazione 24h {sortOption.column === 'priceChange24h' && (sortOption.direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="default" 
            size="sm" 
            className="h-9"
            onClick={() => setShowAddAssetDialog(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuovo Asset
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                <div className="flex items-center">
                  Asset
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('name')}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Quantità
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Prezzo medio
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('avgBuyPrice')}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Prezzo attuale
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('currentPrice')}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Variazione 24h
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('priceChange24h')}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Valore totale
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('value')}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Guadagno/Perdita
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('profitLossPercentage')}
                  />
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {searchTerm ? (
                    <div>
                      <p className="text-muted-foreground mb-2">Nessun asset corrisponde alla ricerca "{searchTerm}"</p>
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                        Cancella ricerca
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground mb-2">Non hai ancora nessun asset in questo portfolio</p>
                      <Button variant="outline" size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Aggiungi il primo asset
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedAssets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {asset.imageUrl ? (
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-medium text-xs">
                            {asset.symbol.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-xs text-muted-foreground">{asset.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {Number(asset.balance).toLocaleString('it-IT', {
                        maximumFractionDigits: 8,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(Number(asset.avgBuyPrice) || 0)}</TableCell>
                  <TableCell>{formatCurrency(asset.currentPrice || 0)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex items-center w-fit px-2 ${
                        (asset.priceChange24h || 0) >= 0
                          ? 'text-green-500 bg-green-500/10'
                          : 'text-red-500 bg-red-500/10'
                      }`}
                    >
                      {(asset.priceChange24h || 0) >= 0 ? (
                        <CircleArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <CircleArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {formatPercentage(asset.priceChange24h || 0)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatCurrency(asset.value || 0)}</div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`flex items-center ${
                        (asset.profitLossPercentage || 0) >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {(asset.profitLossPercentage || 0) >= 0 ? (
                        <CircleArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <CircleArrowDown className="h-3 w-3 mr-1" />
                      )}
                      <span>{formatPercentage(asset.profitLossPercentage || 0)}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({formatCurrency(asset.profitLoss || 0)})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAddTransaction(asset)}>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Aggiungi transazione
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Modifica asset
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteAsset(asset.id)}
                          disabled={isDeleting === asset.id}
                        >
                          {isDeleting === asset.id ? (
                            <>
                              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                              Eliminazione...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina asset
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog per aggiungere transazioni */}
      {selectedAsset && (
        <AddTransactionDialog
          open={showAddTransactionDialog}
          onOpenChange={setShowAddTransactionDialog}
          defaultAssetId={selectedAsset.id}
        />
      )}
    </Card>
  );
}