-- 데이터베이스 초기화 스크립트
CREATE DATABASE IF NOT EXISTS groupware;
CREATE DATABASE IF NOT EXISTS groupware_shadow;

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON groupware.* TO 'groupware'@'%';
GRANT ALL PRIVILEGES ON groupware_shadow.* TO 'groupware'@'%';
FLUSH PRIVILEGES;
