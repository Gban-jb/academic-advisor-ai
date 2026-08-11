-- Run this once in your Neon dashboard SQL editor
-- (Dashboard → your project → SQL Editor)

CREATE TABLE IF NOT EXISTS users (
  id               TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
  name             TEXT,
  email            TEXT UNIQUE,
  "emailVerified"  TIMESTAMPTZ,
  image            TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id                  TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
  "userId"            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INTEGER,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id             TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);
