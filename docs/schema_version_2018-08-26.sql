SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema mydb
-- -----------------------------------------------------
-- -----------------------------------------------------
-- Schema cloud_vdm
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `cloud_vdm` DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci ;
USE `cloud_vdm` ;

-- -----------------------------------------------------
-- Table `config`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `config` ;

CREATE TABLE IF NOT EXISTS `config` (
  `id` VARCHAR(64) NOT NULL,
  `value` VARCHAR(256) NULL,
  `update_by` VARCHAR(64) NULL,
  `update_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `machines`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `machines` ;

CREATE TABLE IF NOT EXISTS `machines` (
  `machine_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(256) NOT NULL,
  `status` VARCHAR(128) NOT NULL,
  `last_update` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_alarm` TINYINT(1) NOT NULL,
  `serial` VARCHAR(256) NOT NULL,
  `description` TEXT NULL,
  `location` TEXT NULL DEFAULT NULL,
  `geo_location` VARCHAR(64) NULL DEFAULT NULL,
  `staff_name` VARCHAR(256) NULL,
  `ip_address` VARCHAR(64) NULL DEFAULT NULL,
  `temperature` FLOAT NULL,
  `cpu_percent` INT UNSIGNED NULL,
  `mem_percent` INT UNSIGNED NULL,
  `network_signal` VARCHAR(20) NULL,
  PRIMARY KEY (`machine_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `machine_log`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `machine_log` ;

CREATE TABLE IF NOT EXISTS `machine_log` (
  `when` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `machine_id` VARCHAR(64) NOT NULL,
  `event` VARCHAR(64) NOT NULL,
  `data_json` TEXT NOT NULL,
  `temperature` FLOAT NULL,
  `cpu_percent` INT UNSIGNED NULL,
  `mem_percent` INT UNSIGNED NULL,
  `network_signal` VARCHAR(20) NULL,
  PRIMARY KEY (`when`),
  INDEX `fk_machine_log_machines1_idx` (`machine_id` ASC),
  CONSTRAINT `fk_machine_log_machines1`
    FOREIGN KEY (`machine_id`)
    REFERENCES `machines` (`machine_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `machine_coin_stat`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `machine_coin_stat` ;

CREATE TABLE IF NOT EXISTS `machine_coin_stat` (
  `stamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `machine_id` VARCHAR(64) NOT NULL,
  `status` VARCHAR(128) NOT NULL,
  `coin_remain_1` INT(11) NOT NULL DEFAULT 0,
  `coin_remain_2` INT(11) NOT NULL DEFAULT 0,
  `coin_remain_5` INT(11) NOT NULL DEFAULT 0,
  `coin_remain_10` INT(11) NOT NULL DEFAULT 0,
  `coin_remain_20` INT(11) NOT NULL DEFAULT 0,
  `coin_remain_50` INT(11) NOT NULL DEFAULT 0,
  `coin_remain_100` INT(11) NOT NULL DEFAULT 0,
  `coin_remain_total` INT(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`stamp`, `machine_id`),
  UNIQUE INDEX `status_UNIQUE` (`status` ASC),
  CONSTRAINT `fk_machine_stat_machine_id`
    FOREIGN KEY (`machine_id`)
    REFERENCES `machines` (`machine_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `products`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `products` ;

CREATE TABLE IF NOT EXISTS `products` (
  `product_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(256) NOT NULL,
  `price` INT(11) NOT NULL,
  `group` VARCHAR(64) NULL,
  `create_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by` VARCHAR(256) NOT NULL,
  `update_at` TIMESTAMP NULL DEFAULT NULL,
  `update_by` VARCHAR(256) NULL,
  PRIMARY KEY (`product_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `orders`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `orders` ;

CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` INT(11) NOT NULL AUTO_INCREMENT,
  `machine_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(128) NOT NULL,
  `order_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `payment_method` VARCHAR(64) NOT NULL,
  `qr_code` VARCHAR(256) NULL,
  `qr_api_response` TEXT NULL DEFAULT NULL,
  `status` VARCHAR(128) NOT NULL,
  `total_price` FLOAT NOT NULL,
  `coin_input_amount` FLOAT NULL DEFAULT NULL,
  `coin_change_amount` FLOAT NULL DEFAULT NULL,
  PRIMARY KEY (`order_id`, `machine_id`, `product_id`),
  INDEX `fk_orders_machine_id` (`machine_id` ASC),
  INDEX `fk_orders_product_id` (`product_id` ASC),
  CONSTRAINT `fk_orders_machine_id`
    FOREIGN KEY (`machine_id`)
    REFERENCES `machines` (`machine_id`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_product_id`
    FOREIGN KEY (`product_id`)
    REFERENCES `products` (`product_id`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `product_qrcode`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `product_qrcode` ;

CREATE TABLE IF NOT EXISTS `product_qrcode` (
  `qr_id` INT(11) NOT NULL,
  `product_id` VARCHAR(64) NULL,
  `qr_code` VARCHAR(256) NOT NULL,
  `status` VARCHAR(128) NOT NULL,
  `use_at` TIMESTAMP NULL DEFAULT NULL,
  `create_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `create_by` VARCHAR(256) NOT NULL,
  PRIMARY KEY (`qr_id`),
  INDEX `fk_product_qrcode_products1_idx` (`product_id` ASC),
  CONSTRAINT `fk_product_qrcode_products1`
    FOREIGN KEY (`product_id`)
    REFERENCES `products` (`product_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `roles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `roles` ;

CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` INT(11) NOT NULL,
  `role_name` VARCHAR(256) NOT NULL,
  `role_permission_json` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`role_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users` ;

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` VARCHAR(64) NOT NULL,
  `role_id` INT(11) NOT NULL,
  `password` TEXT NOT NULL,
  `full_name` VARCHAR(256) NOT NULL,
  `create_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_by` VARCHAR(256) NOT NULL,
  `update_at` TIMESTAMP NULL,
  `update_by` VARCHAR(256) NULL,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `last_login_ip` VARCHAR(64) NULL DEFAULT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  INDEX `fk_users_role_id` (`role_id` ASC),
  CONSTRAINT `fk_users_role_id`
    FOREIGN KEY (`role_id`)
    REFERENCES `roles` (`role_id`)
    ON DELETE RESTRICT)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `user_log`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `user_log` ;

CREATE TABLE IF NOT EXISTS `user_log` (
  `when` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` VARCHAR(64) NOT NULL,
  `ip_address` VARCHAR(64) NOT NULL,
  `event` VARCHAR(128) NOT NULL,
  `data_json` TEXT NULL,
  PRIMARY KEY (`when`, `user_id`),
  INDEX `fk_user_log_users1_idx` (`user_id` ASC),
  CONSTRAINT `fk_user_log_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `user_notifications`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `user_notifications` ;

CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(64) NOT NULL,
  `notification_type` VARCHAR(32) NOT NULL,
  `when_show` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `when_read` TIMESTAMP NULL,
  `message` TEXT NOT NULL,
  `data_json` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`, `user_id`),
  INDEX `fk_user_notifications_users1_idx` (`user_id` ASC),
  CONSTRAINT `fk_user_notifications_users1`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE NO ACTION
    ON UPDATE RESTRICT)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `machine_devices`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `machine_devices` ;

CREATE TABLE IF NOT EXISTS `machine_devices` (
  `device_id` VARCHAR(64) NOT NULL,
  `machine_id` VARCHAR(64) NOT NULL,
  `type` VARCHAR(45) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `serial` VARCHAR(256) NOT NULL,
  `version` VARCHAR(45) NULL,
  `data` TEXT NULL,
  `status` VARCHAR(128) NULL,
  PRIMARY KEY (`device_id`),
  INDEX `fk_machine_devices_machines1_idx` (`machine_id` ASC),
  CONSTRAINT `fk_machine_devices_machines2`
    FOREIGN KEY (`machine_id`)
    REFERENCES `machines` (`machine_id`)
    ON DELETE CASCADE
    ON UPDATE RESTRICT)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `machine_device_log`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `machine_device_log` ;

CREATE TABLE IF NOT EXISTS `machine_device_log` (
  `when` INT NOT NULL,
  `device_id` VARCHAR(64) NOT NULL,
  `status` VARCHAR(128) NOT NULL,
  `event` VARCHAR(64) NOT NULL,
  `data_json` TEXT NULL,
  PRIMARY KEY (`when`),
  INDEX `fk_machine_device_log_machine_devices1_idx` (`device_id` ASC),
  CONSTRAINT `fk_machine_device_log_machine_devices1`
    FOREIGN KEY (`device_id`)
    REFERENCES `machine_devices` (`device_id`)
    ON DELETE NO ACTION
    ON UPDATE RESTRICT)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `device_coin_acceptors`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `device_coin_acceptors` ;

CREATE TABLE IF NOT EXISTS `device_coin_acceptors` (
  `device_id` VARCHAR(64) NOT NULL,
  `update_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `current_coin_count` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(128) NOT NULL,
  PRIMARY KEY (`device_id`),
  INDEX `fk_device_coin_acceptors_machine_devices1_idx` (`device_id` ASC),
  CONSTRAINT `fk_device_coin_acceptors_machine_devices1`
    FOREIGN KEY (`device_id`)
    REFERENCES `machine_devices` (`device_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `coin_acceptor_history`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `coin_acceptor_history` ;

CREATE TABLE IF NOT EXISTS `coin_acceptor_history` (
  `when` TIMESTAMP NOT NULL,
  `device_id` VARCHAR(64) NOT NULL,
  `coin_receive` INT NOT NULL,
  `coin_change` INT NOT NULL,
  `is_success` TINYINT(1) NOT NULL,
  PRIMARY KEY (`when`),
  INDEX `fk_coin_acceptor_history_device_coin_acceptors1_idx` (`device_id` ASC),
  CONSTRAINT `fk_coin_acceptor_history_device_coin_acceptors1`
    FOREIGN KEY (`device_id`)
    REFERENCES `device_coin_acceptors` (`device_id`)
    ON DELETE NO ACTION
    ON UPDATE RESTRICT)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
