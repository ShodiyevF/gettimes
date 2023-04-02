create database workedtimes;

drop table if exists users cascade;
create table users(
    user_serial_id int generated always as identity,
    user_id text not null primary key,
    user_fullname text not null,
    user_createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

drop table if exists workedtimes cascade;
create table workedtimes(
    workedtime_id int generated always as identity primary key,
    workedtime_time text not null,
    workedtime_action varchar(9) not null,
    user_id text not null references users(user_id),
    workedtime_createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);