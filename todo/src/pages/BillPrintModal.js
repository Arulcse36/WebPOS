import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import printService from '../services/printService';

const { width, height } = Dimensions.get('window');

const BillPrintModal = ({ visible, bill, onClose, onPrintSuccess }) => {
  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [email, setEmail] = useState('');
  const webViewRef = useRef(null);

  const handleDirectPrint = async () => {
    setPrinting(true);
    try {
      const result = await printService.printBill(bill);
      Alert.alert('Success', result.message);
      if (onPrintSuccess) onPrintSuccess(bill);
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setPrinting(false);
    }
  };

  const handleSavePDF = async () => {
    setSaving(true);
    try {
      const result = await printService.saveAsPDF(bill);
      Alert.alert(
        'Success', 
        `PDF saved to ${result.filePath}\n\nYou can now print it from any PDF viewer.`
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const result = await printService.shareBill(bill);
      Alert.alert('Success', result.message);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSharing(false);
    }
  };

  const handleEmail = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return;
    }
    
    setSharing(true);
    try {
      const result = await printService.emailBill(bill, email);
      Alert.alert('Success', result.message);
      setShowEmailDialog(false);
      setEmail('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsApp = async () => {
    setSharing(true);
    try {
      const phone = bill.customer?.phone || bill.customerPhone;
      if (phone) {
        await printService.whatsappBill(bill, phone);
      } else {
        await printService.whatsappBill(bill, '');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSharing(false);
    }
  };

  const billHTML = printService.previewBill(bill, handleDirectPrint, onClose);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bill Preview</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Bill Preview */}
        <View style={styles.previewContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: billHTML }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleDirectPrint}
              disabled={printing}
            >
              {printing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="print" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Print</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleSavePDF}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="picture-as-pdf" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="share" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.emailButton]}
              onPress={() => setShowEmailDialog(true)}
              disabled={sharing}
            >
              <Icon name="email" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.whatsappButton]}
              onPress={handleWhatsApp}
              disabled={sharing}
            >
              <Icon name="whatsapp" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Email Dialog */}
        <Modal
          visible={showEmailDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEmailDialog(false)}
        >
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogContainer}>
              <Text style={styles.dialogTitle}>Send Bill via Email</Text>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.dialogButtons}>
                <TouchableOpacity
                  style={[styles.dialogButton, styles.cancelDialogButton]}
                  onPress={() => {
                    setShowEmailDialog(false);
                    setEmail('');
                  }}
                >
                  <Text style={styles.dialogButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dialogButton, styles.sendDialogButton]}
                  onPress={handleEmail}
                >
                  <Text style={styles.dialogButtonText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  webview: {
    flex: 1,
  },
  actionContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    minWidth: 100,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  shareButton: {
    backgroundColor: '#9C27B0',
  },
  emailButton: {
    backgroundColor: '#FF9800',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    elevation: 5,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dialogButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelDialogButton: {
    backgroundColor: '#f44336',
  },
  sendDialogButton: {
    backgroundColor: '#4CAF50',
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BillPrintModal;