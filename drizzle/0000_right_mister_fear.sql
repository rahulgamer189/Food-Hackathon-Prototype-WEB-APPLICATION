CREATE TABLE `campusSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotDate` varchar(10) NOT NULL,
	`healthScore` int NOT NULL DEFAULT 86,
	`mealsLogged` int NOT NULL DEFAULT 1284,
	`wasteReducedPercent` int NOT NULL DEFAULT 18,
	`activeStreaks` int NOT NULL DEFAULT 72,
	`expectedStudents` int NOT NULL DEFAULT 482,
	`totalStudents` int NOT NULL DEFAULT 540,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campusSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `campusSnapshots_snapshotDate_unique` UNIQUE(`snapshotDate`)
);
--> statement-breakpoint
CREATE TABLE `inventoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`unit` varchar(24) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`reorderLevel` int NOT NULL DEFAULT 0,
	`expiryDate` varchar(10),
	`status` enum('ok','low','expiring') NOT NULL DEFAULT 'ok',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuDate` varchar(10) NOT NULL,
	`mealType` enum('breakfast','lunch','dinner') NOT NULL,
	`dishName` varchar(160) NOT NULL,
	`tag` varchar(64) NOT NULL,
	`calories` int NOT NULL DEFAULT 0,
	`proteinGrams` int NOT NULL DEFAULT 0,
	`fiberGrams` int NOT NULL DEFAULT 0,
	`expectedServings` int NOT NULL DEFAULT 0,
	`preparedServings` int NOT NULL DEFAULT 0,
	`consumedServings` int NOT NULL DEFAULT 0,
	`nutritionScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nutritionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`itemName` varchar(160) NOT NULL,
	`source` enum('scanner','menu','manual') NOT NULL DEFAULT 'scanner',
	`calories` int NOT NULL DEFAULT 0,
	`proteinGrams` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nutritionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`age` int,
	`heightCm` int,
	`weightKg` int,
	`gender` varchar(32),
	`activityLevel` varchar(48),
	`goals` text,
	`dietaryPreferences` text,
	`allergies` text,
	`localFoodPreferences` text,
	`wellnessScore` int NOT NULL DEFAULT 74,
	`streakDays` int NOT NULL DEFAULT 6,
	`weeklyRhythm` varchar(64) NOT NULL DEFAULT '68,82,74,91,78,88,74',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `studentProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `wasteLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menuDate` varchar(10) NOT NULL,
	`mealType` enum('breakfast','lunch','dinner') NOT NULL,
	`preparedKg` int NOT NULL DEFAULT 0,
	`consumedKg` int NOT NULL DEFAULT 0,
	`savedKg` int NOT NULL DEFAULT 0,
	`co2SavedKg` int NOT NULL DEFAULT 0,
	`costSavedPaise` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wasteLogs_id` PRIMARY KEY(`id`)
);
