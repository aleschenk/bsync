package storage

import (
	"encoding/json"
	"time"

	"github.com/genjidb/genji"
	"github.com/genjidb/genji/types"
)

var gdb *genji.DB

func CloseDatabase() {
	gdb.Close()
}

func InitDatabase(path string) {
	// Create a database instance, here we'll store everything in memory
	db, err := genji.Open(path)
	gdb = db

	if err != nil {
		panic(err)
	}

	// db.WithContext(ctx)

	// Create a table. Genji tables are schemaless by default, you don't need to specify a schema.
	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS accounts (
			id  TEXT PRIMARY KEY,
			created_at TEXT NOT NULL
		)
	`)
	if err != nil {
		panic(err)
	}

	// Create a table. Genji tables are schemaless by default, you don't need to specify a schema.
	err = db.Exec(`
		CREATE TABLE IF NOT EXISTS sessions (
			account_id TEXT NOT NULL,
			session_id TEXT NOT NULL,
			created_at TEXT NOT NULL,
			modified_at TEXT NOT NULL,
			tabs (
				...
			)
		)
	`)
	if err != nil {
		panic(err)
	}
}

func CreateNewAccount(ID string) error {
	createdAt := time.Now().Format(time.RFC3339)

	account := Account{
		ID:        ID,
		CreatedAt: createdAt,
	}

	if err := gdb.Exec(`INSERT INTO accounts VALUES ?`, &account); err != nil {
		return err
	}

	return nil
}

func GetAllAccounts() ([]Account, error) {
	result, err := gdb.Query("SELECT * FROM accounts")
	defer result.Close()

	if err != nil {
		return nil, err
	}

	accounts := []Account{}

	err = result.Iterate(func(d types.Document) error {
		var account Account
		jsonData, err := d.MarshalJSON()
		if err != nil {
			return err
		}
		err = json.Unmarshal(jsonData, &account)
		if err != nil {
			return err
		}
		accounts = append(accounts, account)
		return nil
	})

	if err != nil {
		return nil, err
	}

	return accounts, nil
}

func GetAccount(ID string) (*Account, error) {
	doc, err := gdb.QueryDocument("SELECT * FROM accounts WHERE id = ?", ID)
	if genji.IsNotFoundError(err) {
		return nil, nil
	}

	jsonData, err := doc.MarshalJSON()
	if err != nil {
		return nil, err
	}

	var account Account
	if err := json.Unmarshal(jsonData, &account); err != nil {
		return nil, err
	}

	return &account, nil
}

func ExistsAccount(ID string) (bool, error) {
	account, err := GetAccount(ID)
	if err != nil {
		return false, err
	}

	if account != nil {
		return true, nil
	}

	return false, nil
}

func GetSession(accountID, sessionID string) (*Session, error) {
	doc, err := gdb.QueryDocument("SELECT * FROM sessions WHERE account_id = ? AND session_id = ?", accountID, sessionID)
	if genji.IsNotFoundError(err) {
		return nil, nil
	}

	doc.MarshalJSON()
	// Iterate(fn func(field string, value Value) error) error
	// GetByField(field string) (Value, error)
	// MarshalJSON() ([]byte, error)
	return nil, nil
}

func SaveSession(accountID, sessionID string, tabs []Tab) error {
	_, err := gdb.QueryDocument("SELECT * FROM sessions WHERE account_id = ? AND session_id = ?", accountID, sessionID)

	if genji.IsNotFoundError(err) {
		createNewSession(accountID, sessionID, tabs)
		return err
	}

	return updateSession(accountID, sessionID, tabs)
}

func createNewSession(accountID, sessionID string, tabs []Tab) error {
	createdAt := time.Now().Format(time.RFC3339)

	session := Session{
		AccountID:  accountID,
		SessionID:  sessionID,
		CreatedAt:  createdAt,
		ModifiedAt: createdAt,
		Tabs:       []Tab{},
	}

	return gdb.Exec(`INSERT INTO sessions VALUES ?`, &session)
}

func updateSession(accountID, sessionID string, tabs []Tab) error {
	modifiedAt := time.Now().Format(time.RFC3339)

	return gdb.Exec(`
	UPDATE sessions
	SET modified_at = ?, tabs = ?
	WHERE account_id = ?
	AND session_id = ?`, modifiedAt, tabs, accountID, sessionID)
}
