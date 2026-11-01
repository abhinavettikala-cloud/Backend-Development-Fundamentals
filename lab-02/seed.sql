CREATE TABLE IF NOT EXISTS book (
 id INTEGER PRIMARY KEY,
 title TEXT NOT NULL,
 author TEXT NOT NULL,
 price INTEGER NOT NULL CHECK(price >= 0),
 pages INTEGER NOT NULL CHECK(pages > 0)
);
INSERT OR IGNORE INTO book (id, title, author, price, pages) VALUES
(1,'Python Basics','A. Rao',350,210),
(2,'Learning JavaScript','B. Kumar',420,280),
(3,'Introduction to SQL','C. Sharma',300,180),
(4,'Web Development','D. Patel',550,340),
(5,'Data Structures','E. Reddy',480,310),
(6,'Computer Networks','F. Das',460,290),
(7,'Operating Systems','G. Singh',510,320),
(8,'Database Fundamentals','H. Mehta',390,240),
(9,'Node.js Practice','I. Roy',440,260),
(10,'Software Engineering','J. Nair',500,300);
