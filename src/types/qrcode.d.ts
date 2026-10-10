// Fallback ambient declaration for qrcode to guarantee zero build failures in any environment
declare module 'qrcode' {
  const QRCode: any;
  export default QRCode;
}
