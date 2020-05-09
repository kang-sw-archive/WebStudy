-- Generate histogram
SELECT post_number    AS bucket,
       COUNT(*)       AS COUNT
FROM   posts_old
GROUP  BY bucket;
