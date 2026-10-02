/**
 * Dining Table Management Enums (Phase 10 - GR-8.1)
 */

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',       // متاحة لاستقبال زبائن جدد
  OCCUPIED = 'OCCUPIED',         // مشغولة بطلب مفتوح
  BILL_PRINTED = 'BILL_PRINTED', // تم طباعة الشيك وبانتظار التحصيل
  RESERVED = 'RESERVED',         // محجوزة مسبقاً
  CLEANING = 'CLEANING',         // قيد التنظيف والتعقيم
}

export enum TableShape {
  SQUARE = 'SQUARE',       // مربعة
  ROUND = 'ROUND',         // دائرية
  RECTANGLE = 'RECTANGLE', // مستطيلة
}

export enum SplitBillType {
  EQUAL = 'EQUAL',                 // تقسيم بالتساوي بين عدد أشخاص
  BY_ITEMS = 'BY_ITEMS',           // تقسيم بحسب الأصناف المختارة
  CUSTOM_AMOUNT = 'CUSTOM_AMOUNT', // تقسيم بمبالغ نقدية مخصصة
}
