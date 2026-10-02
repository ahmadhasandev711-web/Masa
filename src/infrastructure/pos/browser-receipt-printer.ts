import { ReceiptPrinter } from '../../domain/shared/contracts/receipt-printer';

export class BrowserReceiptPrinter implements ReceiptPrinter {
  public print(): void {
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }
}
