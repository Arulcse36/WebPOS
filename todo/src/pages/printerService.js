import { ReactNativePosPrinter } from 'react-native-thermal-pos-printer';

class PrinterService {
  constructor() {
    this.connectedPrinter = null;
  }

  async initialize() {
    try {
      await ReactNativePosPrinter.init();
      console.log('Printer service initialized');
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  async connectToPrinter(deviceIndex = 0) {
    try {
      const devices = await ReactNativePosPrinter.getDevices();
      
      if (devices.length === 0) {
        throw new Error('No printers found');
      }

      const printer = devices[deviceIndex];
      await printer.connect({ timeout: 5000 });
      this.connectedPrinter = printer;
      
      return {
        success: true,
        printerName: printer.name,
        printerAddress: printer.address
      };
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  async printReceipt(orderData) {
    if (!this.connectedPrinter) {
      throw new Error('No printer connected');
    }

    try {
      // Print header
      await this.connectedPrinter.printText(orderData.storeName || 'MY STORE', {
        align: 'CENTER',
        size: 36,
        bold: true,
      });

      await this.connectedPrinter.printText(orderData.storeAddress || '', {
        align: 'CENTER',
        size: 12,
      });

      await this.connectedPrinter.printText('----------------------------');

      // Print items
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          await this.connectedPrinter.printText(
            `${item.name.padEnd(20)} ${item.price.toFixed(2)}`.slice(0, 32)
          );
        }
      }

      await this.connectedPrinter.printText('----------------------------');
      
      // Print total
      await this.connectedPrinter.printText(`TOTAL ${' '.repeat(20)} ${orderData.total.toFixed(2)}`, {
        bold: true,
        size: 24,
      });

      // Print QR code if URL provided
      if (orderData.qrUrl) {
        await ReactNativePosPrinter.printQRCode(orderData.qrUrl, {
          align: 'CENTER',
          size: 6,
          errorLevel: 'H',
        });
      }

      // Print footer
      await this.connectedPrinter.printText('\nThank you for your business!\n', {
        align: 'CENTER',
      });

      // Cut paper
      await ReactNativePosPrinter.cutPaper();
      
      return { success: true };
    } catch (error) {
      console.error('Printing error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connectedPrinter) {
      try {
        await this.connectedPrinter.disconnect();
        this.connectedPrinter = null;
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }

  isConnected() {
    return this.connectedPrinter !== null;
  }
}

export default new PrinterService();