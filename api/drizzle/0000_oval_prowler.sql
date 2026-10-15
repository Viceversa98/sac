CREATE TABLE `approvals` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`tool_call_id` bigint NOT NULL,
	`user_id` int NOT NULL,
	`decision` enum('approved','rejected') NOT NULL,
	`note` varchar(500),
	`decided_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_one_decision` UNIQUE(`tool_call_id`)
);
--> statement-breakpoint
CREATE TABLE `ponds` (
	`id` varchar(16) NOT NULL,
	`name` varchar(100) NOT NULL,
	`volume_m3` decimal(8,2) NOT NULL,
	`species` varchar(50) NOT NULL DEFAULT 'Oreochromis niloticus',
	`max_feed_kg` decimal(6,2),
	`is_simulated` boolean NOT NULL DEFAULT true,
	CONSTRAINT `ponds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sop_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`doc_key` varchar(64) NOT NULL,
	`chunk_no` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`citation` varchar(400) NOT NULL,
	`content` text NOT NULL,
	`embedding` json,
	CONSTRAINT `sop_documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_doc_chunk` UNIQUE(`doc_key`,`chunk_no`)
);
--> statement-breakpoint
CREATE TABLE `telemetry_readings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`pond_id` varchar(16) NOT NULL,
	`ts` datetime NOT NULL,
	`do_mgL` decimal(5,2),
	`temp_c` decimal(4,1),
	`ph` decimal(4,2),
	`tan_mgL` decimal(5,2),
	`nh3_mgL` decimal(6,3),
	`tds_ppm` int,
	`source` enum('simulated','device') NOT NULL DEFAULT 'simulated',
	CONSTRAINT `telemetry_readings_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_pond_ts` UNIQUE(`pond_id`,`ts`)
);
--> statement-breakpoint
CREATE TABLE `tool_calls` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`pond_id` varchar(16) NOT NULL,
	`tool_name` enum('start_aerator','set_feeder_kg','dose_molasses_gL') NOT NULL,
	`args_json` json NOT NULL,
	`rationale` text,
	`citations` json,
	`safety_result` json NOT NULL,
	`status` enum('proposed','approved','rejected','blocked','executed_simulated') NOT NULL,
	`model` varchar(64),
	`prompt_id` char(1),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tool_calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`role` enum('supervisor','operator') NOT NULL,
	`lang` enum('id','en') NOT NULL DEFAULT 'id',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_tool_call_id_tool_calls_id_fk` FOREIGN KEY (`tool_call_id`) REFERENCES `tool_calls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `telemetry_readings` ADD CONSTRAINT `telemetry_readings_pond_id_ponds_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `ponds`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tool_calls` ADD CONSTRAINT `tool_calls_pond_id_ponds_id_fk` FOREIGN KEY (`pond_id`) REFERENCES `ponds`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_pond_ts` ON `telemetry_readings` (`pond_id`,`ts`);