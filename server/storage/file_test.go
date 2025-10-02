package storage

import (
	"fmt"
	"testing"
)

func TestCreateNewAccount(t *testing.T) {
	store := FileSystemStorage{}
	if err := store.CreateNewAccount("test"); err != nil {
		t.Error(err)
		return
	}

	account, err := store.GetAccount("test")
	if err != nil {
		t.Error(err)
		return
	}

	if account.ID != "test" {
		t.Error("Expected test, got ", account.ID)
	}
}

func TestSaveSession(t *testing.T) {
	accountID := "test"
	sessionID := "default"
	store := FileSystemStorage{}
	store.CreateNewAccount(accountID)
	store.SaveSession(accountID, sessionID, []Tab{
		{
			"id": "123",
		}, {
			"id": "124",
		},
	})
}

func TestGetSession(t *testing.T) {
	accountID := "test"
	sessionID := "default"
	store := FileSystemStorage{}
	store.CreateNewAccount(accountID)
	session, err := store.GetSession(accountID, sessionID)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Printf("%s", session.AccountID)
	id := session.Tabs[0]["id"].(string)

	fmt.Printf("%s", id)
	// assert(tabs.AccountID == accountID)
}
