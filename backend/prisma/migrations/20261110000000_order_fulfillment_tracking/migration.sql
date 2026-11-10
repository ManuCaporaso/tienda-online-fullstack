-- Order fulfillment & tracking
-- 1) Ampliar los enums para poder convertir los valores existentes.
-- 2) Migrar datos: HOME_DELIVERY -> SHIPPING y REJECTED -> CANCELLED.
-- 3) Dejar los enums con el conjunto final de valores.
-- 4) Agregar columnas de seguimiento y snapshot de dirección de envío.

ALTER TABLE `order`
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    MODIFY `deliveryType` ENUM('HOME_DELIVERY', 'PICKUP', 'SHIPPING') NOT NULL DEFAULT 'PICKUP';

UPDATE `order` SET `status` = 'CANCELLED' WHERE `status` = 'REJECTED';
UPDATE `order` SET `deliveryType` = 'SHIPPING' WHERE `deliveryType` = 'HOME_DELIVERY';

ALTER TABLE `order`
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'IN_PREPARATION', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    MODIFY `deliveryType` ENUM('SHIPPING', 'PICKUP') NOT NULL DEFAULT 'PICKUP',
    ADD COLUMN `shippingAddress` JSON NULL,
    ADD COLUMN `trackingNumber` VARCHAR(191) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL;
