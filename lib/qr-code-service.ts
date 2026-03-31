import QRCode from 'qrcode';

export interface QRCodeData {
  ticketId: string;
  eventId: string;
  userId: string;
  ticketNumber: string;
  timestamp: number;
}

/**
 * Generate QR code for a ticket
 */
export const generateQRCode = async (data: QRCodeData): Promise<string> => {
  try {
    const qrData = JSON.stringify(data);
    const qrCode = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate QR code as SVG
 */
export const generateQRCodeSVG = async (data: QRCodeData): Promise<string> => {
  try {
    const qrData = JSON.stringify(data);
    const qrCode = await QRCode.toString(qrData, {
      errorCorrectionLevel: 'H' as any,
      type: 'svg' as any,
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw error;
  }
};

/**
 * Parse QR code data
 */
export const parseQRCode = (qrData: string): QRCodeData | null => {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

/**
 * Validate QR code data
 */
export const validateQRCode = (data: QRCodeData): boolean => {
  return !!(data.ticketId && data.eventId && data.userId && data.ticketNumber);
};

/**
 * Check if ticket is expired
 */
export const isTicketExpired = (data: QRCodeData, expirationHours: number = 24): boolean => {
  const now = Date.now();
  const expirationTime = data.timestamp + expirationHours * 60 * 60 * 1000;
  return now > expirationTime;
};
