import React, { useEffect } from 'react';
import { Button, View, Alert } from 'react-native';
import { ReactNativePosPrinter } from 'react-native-thermal-pos-printer';

const PrinterComponent = () => {
  let connectedPrinter = null;

  const connectToPrinter = async () => {
    try {
      // 1. Initialize the printer module
      await ReactNativePosPrinter.init();

      // 2. Get a list of available printers
      const devices = await ReactNativePosPrinter.getDevices();
      if (devices.length === 0) {
        Alert.alert('No Printers Found', 'Please ensure your printer is on and paired.');
        return;
      }

      // 3. Select the first printer (you can let the user choose)
      const printer = devices[0];
      console.log(`Connecting to: ${printer.name} (${printer.address})`);

      // 4. Connect to the printer
      await printer.connect({ timeout: 5000 });
      connectedPrinter = printer;
      Alert.alert('Success', `Connected to ${printer.name}`);
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', error.message);
    }
  };

  const printReceipt = async () => {
    if (!connectedPrinter) {
      Alert.alert('No Printer', 'Please connect to a printer first.');
      return;
    }

    try {
      // Print a simple header
      await connectedPrinter.printText('=== MY STORE ===', {
        align: 'CENTER',
        size: 36,
        bold: true,
      });

      await connectedPrinter.printText('123 Main Street', {
        align: 'CENTER',
        size: 12,
      });

      await connectedPrinter.printText('----------------------------');

      // Print items
      await connectedPrinter.printText('Item 1               $10.00');
      await connectedPrinter.printText('Item 2               $15.00');

      await connectedPrinter.printText('----------------------------');
      await connectedPrinter.printText('TOTAL                $25.00', {
        bold: true,
        size: 24,
      });

      // Print a QR code
      await ReactNativePosPrinter.printQRCode('https://your-website.com/receipt/123', {
        align: 'CENTER',
        size: 6,
        errorLevel: 'H',
      });

      await connectedPrinter.printText('\nThank you for your business!\n', {
        align: 'CENTER',
      });

      // Cut the paper
      await ReactNativePosPrinter.cutPaper();
    } catch (error) {
      console.error('Printing error:', error);
      Alert.alert('Print Failed', error.message);
    }
  };

  return (
    <View>
      <Button title="Connect to Printer" onPress={connectToPrinter} />
      <Button title="Print Receipt" onPress={printReceipt} />
    </View>
  );
};

export default PrinterComponent;