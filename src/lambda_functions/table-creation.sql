CREATE TABLE IF NOT EXISTS vegafoliodb.`badge` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` nvarchar(255) NOT NULL UNIQUE,
    `description` nvarchar(512) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`badge_criteria` (
    `id` int NOT NULL AUTO_INCREMENT,
    `criteria_type` enum('shine', 'action') NOT NULL,
    `action_type` varchar(255) NULL,
    `value` int NULL,
    `badge_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_2` (`badge_id`),
    CONSTRAINT `FK_24` FOREIGN KEY `FK_2` (`badge_id`) REFERENCES `badge` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`country` (
    `id` int NOT NULL AUTO_INCREMENT UNIQUE,
    `iso` char(2) NOT NULL UNIQUE,
    `iso3` char(3) NOT NULL UNIQUE,
    `name` nvarchar(100) NOT NULL UNIQUE,
    `region` nvarchar(80) NOT NULL,
    `num_code` int(3) NULL,
    `phone_code` int(5) NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`state` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` nvarchar(255) NOT NULL UNIQUE,
    `country_id` int NOT NULL,
    `code` smallint(5) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_2` (`country_id`),
    CONSTRAINT `FK_17` FOREIGN KEY `FK_2` (`country_id`) REFERENCES `country` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`city` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` nvarchar(100) NOT NULL UNIQUE,
    `code` smallint(5) NOT NULL,
    `country_id` int NOT NULL,
    `state_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_2` (`state_id`),
    CONSTRAINT `FK_18` FOREIGN KEY `FK_2` (`state_id`) REFERENCES `state` (`id`),
    KEY `FK_3` (`country_id`),
    CONSTRAINT `FK_19` FOREIGN KEY `FK_3` (`country_id`) REFERENCES `country` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`user` (
    `id` int NOT NULL AUTO_INCREMENT,
    `firebase_uid` varchar(255) NOT NULL UNIQUE,
    `first_name` nvarchar(100) NOT NULL,
    `last_name` nvarchar(100) NOT NULL,
    `email` varchar(255) NOT NULL UNIQUE,
    `username` char(20) NOT NULL UNIQUE,
    `profile_image` varchar(512),
    `birthday` date NULL,
    `gender` boolean NULL,
    `is_private` boolean NOT NULL,
    `is_verified` boolean NOT NULL,
    `created_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `last_online` timestamp NOT NULL,
    `city_id` int NULL,
    `country_id` int NULL,
    `shine` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_2` (`city_id`),
    CONSTRAINT `FK_1` FOREIGN KEY `FK_2` (`city_id`) REFERENCES `city` (`id`),
    KEY `FK_3` (`country_id`),
    CONSTRAINT `FK_2` FOREIGN KEY `FK_3` (`country_id`) REFERENCES `country` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`post` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` nvarchar(255) NOT NULL,
    `text` nvarchar(4000) NOT NULL,
    `user_id` int NOT NULL,
    `resume_url` varchar(512) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `FK_2` (`user_id`),
    CONSTRAINT `FK_4` FOREIGN KEY `FK_2` (`user_id`) REFERENCES `user` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`comment` (
    `id` int NOT NULL AUTO_INCREMENT,
    `text` nvarchar(3000) NOT NULL,
    `post_id` int NOT NULL,
    `user_id` int NOT NULL,
    `parent_id` int NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `FK_2` (`user_id`),
    CONSTRAINT `FK_5` FOREIGN KEY `FK_2` (`user_id`) REFERENCES `user` (`id`),
    KEY `FK_3` (`post_id`),
    CONSTRAINT `FK_6` FOREIGN KEY `FK_3` (`post_id`) REFERENCES `post` (`id`),
    KEY `FK_4` (`parent_id`),
    CONSTRAINT `FK_7` FOREIGN KEY `FK_4` (`parent_id`) REFERENCES `comment` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`comment_like` (
    `id` int NOT NULL AUTO_INCREMENT,
    `comment_id` int NOT NULL,
    `user_id` int NOT NULL,
    `is_like` boolean NOT NULL,
    `time_stamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `FK_2` (`user_id`),
    CONSTRAINT `FK_15` FOREIGN KEY `FK_2` (`user_id`) REFERENCES `user` (`id`),
    KEY `FK_3` (`comment_id`),
    CONSTRAINT `FK_16` FOREIGN KEY `FK_3` (`comment_id`) REFERENCES `comment` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`company` (
    `id` int NOT NULL AUTO_INCREMENT,
    `name` nvarchar(255) NOT NULL,
    `logo_url` varchar(255) NOT NULL,
    `website` varchar(512) NOT NULL,
    `industry` varchar(255) NULL,
    `size` varchar(255) NULL,
    `domain` varchar(255) NOT NULL,
    `founded` date NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`company_post` (
    `id` int NOT NULL AUTO_INCREMENT,
    `company_id` int NOT NULL,
    `post_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_1` (`company_id`),
    CONSTRAINT `FK_15_1` FOREIGN KEY `FK_1` (`company_id`) REFERENCES `company` (`id`),
    KEY `FK_2` (`post_id`),
    CONSTRAINT `FK_16_1` FOREIGN KEY `FK_2` (`post_id`) REFERENCES `post` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`education` (
    `id` int NOT NULL AUTO_INCREMENT,
    `education` nvarchar(255) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`education_post` (
    `id` int NOT NULL AUTO_INCREMENT,
    `education_id` int NOT NULL,
    `post_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_1` (`education_id`),
    CONSTRAINT `FK_19_1` FOREIGN KEY `FK_1` (`education_id`) REFERENCES `education` (`id`),
    KEY `FK_2` (`post_id`),
    CONSTRAINT `FK_20` FOREIGN KEY `FK_2` (`post_id`) REFERENCES `post` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`experience` (
    `id` int NOT NULL AUTO_INCREMENT,
    `job` nvarchar(255) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`experience_post` (
    `id` int NOT NULL AUTO_INCREMENT,
    `experience_id` int NOT NULL,
    `post_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_1` (`experience_id`),
    CONSTRAINT `FK_17_1` FOREIGN KEY `FK_1` (`experience_id`) REFERENCES `experience` (`id`),
    KEY `FK_2` (`post_id`),
    CONSTRAINT `FK_18_1` FOREIGN KEY `FK_2` (`post_id`) REFERENCES `post` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`position` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` nvarchar(255) NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`position_post` (
    `id` int NOT NULL AUTO_INCREMENT,
    `post_id` int NOT NULL,
    `position_id` int NOT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_1` (`post_id`),
    CONSTRAINT `FK_22` FOREIGN KEY `FK_1` (`post_id`) REFERENCES `post` (`id`),
    KEY `FK_3` (`position_id`),
    CONSTRAINT `FK_22_1` FOREIGN KEY `FK_3` (`position_id`) REFERENCES `position` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`post_like` (
    `id` int NOT NULL AUTO_INCREMENT,
    `post_id` int NOT NULL,
    `user_id` int NOT NULL,
    `is_like` boolean NOT NULL,
    `time_stamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `FK_2` (`post_id`),
    CONSTRAINT `FK_14` FOREIGN KEY `FK_2` (`post_id`) REFERENCES `post` (`id`),
    KEY `FK_3` (`user_id`),
    CONSTRAINT `FK_14_1` FOREIGN KEY `FK_3` (`user_id`) REFERENCES `user` (`id`)
);

CREATE TABLE IF NOT EXISTS vegafoliodb.`user_badge` (
    `id` int NOT NULL AUTO_INCREMENT,
    `user_id` int NOT NULL,
    `badge_id` int NOT NULL,
    `awarded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `FK_1` (`user_id`),
    CONSTRAINT `FK_22_2` FOREIGN KEY `FK_1` (`user_id`) REFERENCES `user` (`id`),
    KEY `FK_2` (`badge_id`),
    CONSTRAINT `FK_23` FOREIGN KEY `FK_2` (`badge_id`) REFERENCES `badge` (`id`)
);