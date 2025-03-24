import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

interface FaqDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// FAQ data structured for better maintenance
const faqItems = [
  {
    question: "What is Moonfolio?",
    answer: "Moonfolio is a cryptocurrency portfolio tracking application that allows you to monitor your digital assets across multiple wallets. It provides real-time price updates, portfolio analytics, and visualization tools to help you make informed decisions about your crypto investments."
  },
  {
    question: "How do I add my crypto assets?",
    answer: "You can add your assets in two ways: 1) Connect an ENS wallet or Ethereum address to automatically import your holdings, or 2) Create a manual portfolio where you can add individual assets and transactions."
  },
  {
    question: "What is an ENS wallet?",
    answer: "Ethereum Name Service (ENS) is a naming system for Ethereum addresses. Instead of using a long hexadecimal address (0x...), you can use a human-readable name like 'yourname.eth'. Moonfolio supports connecting portfolios via ENS names or standard Ethereum addresses."
  },
  {
    question: "Does Moonfolio store my private keys?",
    answer: "No. Moonfolio never asks for or stores your private keys. When connecting an ENS wallet or Ethereum address, we only use the public address to read blockchain data. Your funds always remain under your control."
  },
  {
    question: "Which cryptocurrencies are supported?",
    answer: "Moonfolio supports all major cryptocurrencies available on CoinGecko. For ENS/Ethereum wallets, we automatically detect ETH and common ERC-20 tokens like WETH, USDC, USDT, WBTC, DAI, LINK, UNI, and MATIC."
  },
  {
    question: "How accurate is the portfolio data?",
    answer: "For manually created portfolios, the accuracy depends on the information you provide. For connected ENS/Ethereum wallets, we fetch real blockchain data and combine it with price information from reliable market data providers to ensure high accuracy."
  },
  {
    question: "Is Moonfolio free to use?",
    answer: "Yes, Moonfolio is completely free and open-source. There are no premium features or subscriptions."
  },
  {
    question: "Can I import/export my portfolio data?",
    answer: "Currently, we don't support direct import/export of portfolio data. However, this feature is on our roadmap for future development."
  },
  {
    question: "How is my data protected?",
    answer: "Moonfolio uses secure industry-standard practices to protect your data. All portfolio information is stored securely in our database. We never share your personal information with third parties."
  },
  {
    question: "How can I contribute to the project?",
    answer: "As an open-source project, we welcome contributions from the community. You can contribute by reporting bugs, suggesting features, or submitting pull requests to our GitHub repository."
  }
];

export function FaqDialog({ open, onOpenChange }: FaqDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">Frequently Asked Questions</DialogTitle>
          <DialogDescription>
            Get answers to common questions about Moonfolio and how to use it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                <AccordionTrigger className="text-left font-medium py-4">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <DialogFooter className="sm:justify-center gap-2 pt-2">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}