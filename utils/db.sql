CREATE TABLE IF NOT EXISTS iot_user(
    username text not null,
    password text not null,
    PRIMARY KEY(username)
);

INSERT INTO iot_user(username, password) VALUES ('user','pass') ON CONFLICT DO NOTHING;