import React, { useState } from 'react';
import { Trade, Contract } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ContractModal } from '../dialogs/ContractModal';
import { contractService } from '../../services/contractService';

interface TradeHistoryProps {
  trades: Trade[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingContractId, setLoadingContractId] = useState<string | null>(null);

  const handleViewContract = async (trade: Trade) => {
    if (!trade.contract_id) return;
    
    setLoadingContractId(trade.id);
    const contract = await contractService.getContractById(trade.contract_id);
    setLoadingContractId(null);

    if (contract) {
      setSelectedContract(contract);
      setIsModalOpen(true);
    }
  };

  return (
    <Card className="bg-card border-border shadow-xl overflow-hidden">
      <ContractModal 
        contract={selectedContract} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      <CardHeader className="bg-muted/30 border-b border-border">
        <CardTitle className="text-2xl font-heading font-bold text-foreground">Trade History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Metal</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Quantity</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total Price</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Contract</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-10 h-10 opacity-10" />
                      <p className="text-sm font-medium">No completed trades yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade) => (
                  <TableRow key={trade.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {new Date(trade.executed_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">{trade.metal}</TableCell>
                    <TableCell className="font-medium text-foreground">{trade.quantity} {trade.unit}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {trade.price.toLocaleString()} {trade.currency}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-none font-bold text-[10px] tracking-widest">
                        EXECUTED
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary hover:bg-primary/10 font-bold text-[10px] tracking-widest"
                        onClick={() => handleViewContract(trade)}
                        disabled={!trade.contract_id || loadingContractId === trade.id}
                      >
                        {loadingContractId === trade.id ? (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4 mr-1.5" />
                        )}
                        VIEW
                        <ExternalLink className="w-3 h-3 ml-1.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
