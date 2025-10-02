package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var rootPath = ".storage"

type FileSystemStorage struct {
	Storage
	mu sync.Mutex
}

func (fss *FileSystemStorage) CreateNewAccount(ID string) error {
	accountDir := fmt.Sprintf("%s/accounts/%s", rootPath, ID)

	if _, err := os.Stat(accountDir); os.IsNotExist(err) {
		return os.MkdirAll(accountDir, os.ModePerm)
	}

	return nil
}

func (fss *FileSystemStorage) GetAccount(ID string) (*Account, error) {
	accountDir := fmt.Sprintf("%s/accounts/%s", rootPath, ID)

	account := Account{ID: ID, CreatedAt: ""}

	if stats, err := os.Stat(accountDir); err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	} else if !stats.IsDir() {
		account.CreatedAt = stats.ModTime().Format(time.RFC3339)
	}

	return &Account{ID: ID, CreatedAt: ""}, nil
}

func (fss *FileSystemStorage) ExistsAccount(ID string) (bool, error) {
	account, err := fss.GetAccount(ID)

	if err != nil {
		return false, err
	}

	if account != nil {
		return true, nil
	}

	return false, nil
}

func sessionFilename(accountID, sessionID string) string {
	// createAt := time.Now().Format(time.RFC3339)
	return fmt.Sprintf("%s/accounts/%s/session_%s", rootPath, accountID, sessionID)
}

func (fss *FileSystemStorage) GetAllSessions(accountID string) ([]string, error) {
	sessions := []string{""}

	accountPath := fmt.Sprintf("%s/accounts/%s", rootPath, accountID)

	err := filepath.Walk(accountPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		fmt.Println(path)
		sessions = append(sessions, path)
		return nil
	})

	return sessions, err
}

func (fss *FileSystemStorage) GetSession(accountID, sessionID string) (*Session, error) {
	sessionFile := sessionFilename(accountID, sessionID)

	fileInfo, err := os.Stat(sessionFile)
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(sessionFile)
	if err != nil {
		return nil, err
	}

	var tabs []Tab

	if err := json.Unmarshal([]byte(data), &tabs); err != nil {
		return nil, err
	}

	return &Session{
		AccountID:  accountID,
		SessionID:  sessionID,
		CreatedAt:  "",
		ModifiedAt: fileInfo.ModTime().Format(time.RFC3339),
		Tabs:       tabs,
	}, nil
}

func (fss *FileSystemStorage) SaveSession(accountID, sessionID string, tabs []Tab) error {
	sessionFile := sessionFilename(accountID, sessionID)

	fss.mu.Lock()
	defer fss.mu.Unlock()

	file, err := os.Create(sessionFile)
	if err != nil {
		return err
	}

	jsonData, err := json.MarshalIndent(tabs, "", "  ")
	if err != nil {
		return err
	}

	err = os.WriteFile(sessionFile, jsonData, 0644)
	if err != nil {
		return err
	}

	return file.Close()
}
