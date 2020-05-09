CREATE TABLE posts(
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    parent_id_if_exists BIGINT UNSIGNED DEFAULT NULL,
    forum_number INT UNSIGNED NOT NULL,
    forum_post_number INT UNSIGNED NOT NULL,
    title CHAR(120) NOT NULL,
    author CHAR(32) NOT NULL,
    content MEDIUMTEXT,
    password_if_annonymous CHAR(64),
    num_replies INT UNSIGNED NOT NULL DEFAULT 0,
    is_removed BIT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY(id)
);

CREATE TABLE forums (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    title CHAR(255) NOT NULL,
    intro TEXT,
    PRIMARY KEY(id)
);

CREATE TABLE replies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    post_id BIGINT UNSIGNED NOT NULL,
    author CHAR(32) NOT NULL,
    password_if_annonymous CHAR(64),
    content TEXT,
    is_removed BIT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY(id)
);

-- Generate histogram
SELECT post_number    AS bucket,
       COUNT(*)       AS COUNT
FROM   posts_old
GROUP  BY bucket;
