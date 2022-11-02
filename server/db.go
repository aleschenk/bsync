package main

import (
	"context"

	"github.com/genjidb/genji"
)

var db genji.DB

func InitDatabase(ctx context.Context) {
	// Create a database instance, here we'll store everything in memory
	db, err := genji.Open(":memory:")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	db.WithContext(ctx)

	// Create a table. Genji tables are schemaless by default, you don't need to specify a schema.
	err = db.Exec("CREATE TABLE IF NOT EXISTS account (name text, ...)")
	if err != nil {
		panic(err)
	}

	// Create a table. Genji tables are schemaless by default, you don't need to specify a schema.
	err = db.Exec("CREATE TABLE IF NOT EXISTS tabs (timestamp)")
	if err != nil {
		panic(err)
	}
}

func CreateNewAccount() (string, error) {
	type Account struct {
		ID   uint
		Name string
	}

	// Let's create a user
	u := Account{
		ID:   20,
		Name: "foo",
	}
	u.ID = 12
	u.Name = "69001"

	err := db.Exec(`INSERT INTO user VALUES ?`, &u)

	return "123", err
}
