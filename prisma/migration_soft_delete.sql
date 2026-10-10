-- ==============================================================================
-- منظومة ماسا (MASA) - سكريبت ترقية قاعدة البيانات (المرحلة C: الحذف المرن وسجل التدقيق)
-- Database Upgrade Script: Soft Delete (Rule 4.1), Audit Trail (Rule 4.2), and Return Invoices (Rule 4.5)
-- Safe for execution via cPanel phpMyAdmin without dropping any tables or losing data.
-- ==============================================================================

-- 1. إنشاء جدول فواتير المرتجع (Return Invoices Table)
CREATE TABLE IF NOT EXISTS `return_invoices` (
  `id` VARCHAR(191) NOT NULL,
  `return_number` VARCHAR(191) NOT NULL,
  `order_id` VARCHAR(191) NOT NULL,
  `order_number` VARCHAR(191) NOT NULL,
  `branch_id` VARCHAR(191) NULL,
  `amount_minor` INT NOT NULL,
  `reason` TEXT NOT NULL,
  `created_by_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `return_invoices_return_number_key` (`return_number`),
  INDEX `return_invoices_order_id_idx` (`order_id`),
  INDEX `return_invoices_branch_id_created_at_idx` (`branch_id`, `created_at`),
  CONSTRAINT `return_invoices_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `return_invoices_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `return_invoices_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. إضافة حقول الحذف المرن وسجل التدقيق للجداول الأساسية
-- (Safe Procedures to ensure columns are only added if they do not already exist)
-- ------------------------------------------------------------------------------

DELIMITER $$

DROP PROCEDURE IF EXISTS `AddAuditColumns`$$
CREATE PROCEDURE `AddAuditColumns`(
    IN tableName VARCHAR(64)
)
BEGIN
    -- deleted_at
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tableName AND COLUMN_NAME = 'deleted_at'
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `deleted_at` DATETIME(3) NULL;');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;

        SET @idx = CONCAT('ALTER TABLE `', tableName, '` ADD INDEX `', tableName, '_deleted_at_idx` (`deleted_at`);');
        PREPARE stmtIdx FROM @idx;
        EXECUTE stmtIdx;
        DEALLOCATE PREPARE stmtIdx;
    END IF;

    -- deleted_by_id
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tableName AND COLUMN_NAME = 'deleted_by_id'
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `deleted_by_id` VARCHAR(191) NULL;');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    -- created_by_id
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tableName AND COLUMN_NAME = 'created_by_id'
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `created_by_id` VARCHAR(191) NULL;');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    -- updated_by_id
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tableName AND COLUMN_NAME = 'updated_by_id'
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `updated_by_id` VARCHAR(191) NULL;');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- تطبيق الإجراء على الجداول الستة المستهدفة:
CALL `AddAuditColumns`('branches');
CALL `AddAuditColumns`('dining_tables');
CALL `AddAuditColumns`('categories');
CALL `AddAuditColumns`('products');
CALL `AddAuditColumns`('customers');
CALL `AddAuditColumns`('orders');

-- تنظيف الإجراء بعد الانتهاء
DROP PROCEDURE IF EXISTS `AddAuditColumns`;
