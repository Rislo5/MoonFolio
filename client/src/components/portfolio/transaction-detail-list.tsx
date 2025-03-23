import { useState, useMemo } from "react";
import { TransactionWithDetails } from "@shared/schema";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate, getTransactionTypeColor } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ArrowUpDown,
  Calendar,
  CircleArrowDown,
  CircleArrowUp,
  ExternalLink,
  ListFilter,
  MoreHorizontal,
  PencilLine,
  PlusCircle,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AddTransactionDialog from "./add-transaction-dialog";

type SortOption = {
  column: keyof TransactionWithDetails | 'date';
  direction: 'asc' | 'desc';
};

export default function TransactionDetailList() {
  const { transactions, removeTransaction } = usePortfolio();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>({ column: 'date', direction: 'desc' });
  const [showAddTransactionDialog, setShowAddTransactionDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Gestisce l'eliminazione di una transazione
  const handleDeleteTransaction = async (transactionId: number) => {
    if (window.confirm("Sei sicuro di voler eliminare questa transazione? Questa azione non può essere annullata.")) {
      setIsDeleting(transactionId);
      try {
        await removeTransaction(transactionId);
        toast({
          title: "Transazione eliminata",
          description: "La transazione è stata rimossa dal portfolio",
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile eliminare la transazione",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Gestisce il cambio dell'ordinamento
  const handleSort = (column: keyof TransactionWithDetails | 'date') => {
    setSortOption((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Filtra e ordina le transazioni
  const filteredAndSortedTransactions = useMemo(() => {
    // Prima filtriamo per termine di ricerca
    const filtered = transactions.filter((transaction) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.asset.name.toLowerCase().includes(searchLower) ||
        transaction.asset.symbol.toLowerCase().includes(searchLower) ||
        transaction.type.toLowerCase().includes(searchLower)
      );
    });

    // Poi ordiniamo secondo l'opzione selezionata
    return [...filtered].sort((a, b) => {
      // Ordinamento per data (usa un campo speciale)
      if (sortOption.column === 'date') {
        // Gestisce in modo sicuro i valori null o undefined
        const aDate = a.date ? new Date(a.date) : new Date(0);
        const bDate = b.date ? new Date(b.date) : new Date(0);
        const aValue = aDate.getTime();
        const bValue = bDate.getTime();
        return sortOption.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Ordinamento per altre colonne
      const aValue = a[sortOption.column] || '';
      const bValue = b[sortOption.column] || '';
      
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
  }, [transactions, searchTerm, sortOption]);

  // Ottiene un'etichetta per il tipo di transazione
  const getTransactionTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy': return 'Acquisto';
      case 'sell': return 'Vendita';
      case 'swap': return 'Scambio';
      case 'transfer': return 'Trasferimento';
      default: return type;
    }
  };

  // Icona per il tipo di transazione
  const getTransactionTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy': return <CircleArrowDown className="h-4 w-4 mr-1" />;
      case 'sell': return <CircleArrowUp className="h-4 w-4 mr-1" />;
      case 'swap': return <RefreshCcw className="h-4 w-4 mr-1" />;
      case 'transfer': return <ExternalLink className="h-4 w-4 mr-1" />;
      default: return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">Storico Transazioni</h3>
          <p className="text-sm text-muted-foreground">
            {transactions.length} transazioni totali
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca transazioni..."
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
              <DropdownMenuItem onClick={() => handleSort('asset')}>
                Asset {sortOption.column === 'asset' && (sortOption.direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('type')}>
                Tipo {sortOption.column === 'type' && (sortOption.direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('date')}>
                Data {sortOption.column === 'date' && (sortOption.direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('value')}>
                Valore {sortOption.column === 'value' && (sortOption.direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="h-9" onClick={() => setShowAddTransactionDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuova Transazione
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">
                <div className="flex items-center">
                  Asset
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('asset')}
                  />
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center">
                  Tipo
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('type')}
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
                  Prezzo
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Valore
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('value')}
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  Data
                  <ArrowUpDown
                    className="ml-2 h-3 w-3 cursor-pointer text-muted-foreground"
                    onClick={() => handleSort('date')}
                  />
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {searchTerm ? (
                    <div>
                      <p className="text-muted-foreground mb-2">Nessuna transazione corrisponde alla ricerca "{searchTerm}"</p>
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                        Cancella ricerca
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-muted-foreground mb-2">Non hai ancora nessuna transazione in questo portfolio</p>
                      <Button variant="outline" size="sm" onClick={() => setShowAddTransactionDialog(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Aggiungi la prima transazione
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.asset.imageUrl ? (
                        <img
                          src={transaction.asset.imageUrl}
                          alt={transaction.asset.name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-medium text-xs">
                            {transaction.asset.symbol.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">{transaction.asset.name}</div>
                        <div className="text-xs text-muted-foreground">{transaction.asset.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`flex items-center w-fit ${getTransactionTypeColor(transaction.type)}`}
                    >
                      {getTransactionTypeIcon(transaction.type)}
                      {getTransactionTypeLabel(transaction.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {Number(transaction.amount).toLocaleString('it-IT', {
                        maximumFractionDigits: 8,
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.price ? formatCurrency(Number(transaction.price)) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{formatCurrency(transaction.value)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      {formatDate(transaction.date ? new Date(transaction.date) : new Date())}
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
                        <DropdownMenuItem onClick={() => console.log('Modifica', transaction.id)}>
                          <PencilLine className="h-4 w-4 mr-2" />
                          Modifica transazione
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          disabled={isDeleting === transaction.id}
                        >
                          {isDeleting === transaction.id ? (
                            <>
                              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                              Eliminazione...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina transazione
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
      <AddTransactionDialog
        open={showAddTransactionDialog}
        onOpenChange={setShowAddTransactionDialog}
      />
    </Card>
  );
}