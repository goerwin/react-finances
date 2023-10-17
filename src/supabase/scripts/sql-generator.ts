import fs from 'fs';
import path from 'path';
import jsonDatabase from '/Users/goerwin/Library/CloudStorage/GoogleDrive-erwingaitano@gmail.com/My Drive/Databases/expensesIncomes.json';

function parseSqlValue(value: string | number | null | undefined) {
  if (typeof value === 'string' && value) return `'${value}'`;
  if (typeof value === 'number') return value;
  return null;
}

const walletValues = jsonDatabase.wallets.map(
  (it) =>
    `(${parseSqlValue(it.id)}, ${parseSqlValue(it.name)}, ${parseSqlValue(
      it.type
    )}, ${parseSqlValue(it.sortPriority)}, ${parseSqlValue(
      it.description
    )}, ${parseSqlValue(it.startDate)}, ${parseSqlValue(it.expectedPerMonth)})
    `
);

const categoryValues = jsonDatabase.categories.map(
  (it) =>
    `(${parseSqlValue(it.id)}, ${parseSqlValue(it.name)}, ${parseSqlValue(
      it.sortPriority
    )}, ${parseSqlValue(it.description)}, ${parseSqlValue(it.walletId)})
    `
);

const actionValues = jsonDatabase.actions.map(
  (it) =>
    `(${parseSqlValue(it.id)}, ${parseSqlValue(it.value)}, ${parseSqlValue(
      it.date
    )}, ${parseSqlValue(it.description)}, ${parseSqlValue(it.categoryId)})`
);

const query = `
drop table if exists users cascade;
drop table if exists categories cascade;
drop table if exists wallets cascade;
drop table if exists actions;
drop type if exists action_type;

CREATE TYPE action_type AS ENUM ('income', 'expense');

create table users (
	id uuid primary key default gen_random_uuid(),
	email varchar(256) unique not null,
	name varchar(256) not null,
	created_at timestamptz not null,
	updated_at timestamptz
);

create table wallets (
	id uuid primary key default gen_random_uuid(),
	name varchar(256) not null,
	action_type action_type not null,
	sort_priority integer,
	description varchar(256),
	start_date timestamptz,
	expected_per_month integer
	-- user_id uuid references users(id)
);

create table categories (
	id uuid primary key default gen_random_uuid(),
	name varchar(256) not null,
	sort_priority integer,
	description varchar(256),
	wallet_id uuid references wallets(id)
);

create table actions (
	id uuid primary key default gen_random_uuid(),
	value integer not null check (value >= 0),
	date timestamptz not null,
	description varchar(256),
	category_id uuid references categories(id)
);

insert into wallets (id, name, action_type, sort_priority, description, start_date, expected_per_month)
values ${walletValues};

insert into categories (id, name, sort_priority, description, wallet_id)
values ${categoryValues};

insert into actions (id, value, date, description, category_id)
values ${actionValues};
`;

fs.writeFileSync(path.resolve(__dirname, 'query.sql'), query, 'utf-8');
