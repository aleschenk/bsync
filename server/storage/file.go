package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// rootPath defines the base directory for storage.
const rootPath = ".storage"

// metainfoFilename is the metadata file stored per account.
const metainfoFilename = ".metainfo.json"

// FileSystemStorage implements storage using the local filesystem.
type FileSystemStorage struct {
	Storage
	mu sync.Mutex
}

// GetAllAccounts returns all accounts stored in the filesystem.
func (fss *FileSystemStorage) GetAllAccounts() ([]Account, error) {
	var accounts []Account

	accountDir := fmt.Sprintf("%s/accounts", rootPath)

	files, err := os.ReadDir(accountDir)
	if err != nil {
		return accounts, err
	}

	for _, file := range files {
		accounts = append(accounts, Account{ID: file.Name(), CreatedAt: ""})
	}

	return accounts, nil
}

// CreateNewAccount creates an account directory and stores its metadata.
func (fss *FileSystemStorage) CreateNewAccount(account Account) error {
	accountDir := fmt.Sprintf("%s/accounts/%s", rootPath, fmt.Sprintf("%s", account.ID))

	if _, err := os.Stat(accountDir); os.IsNotExist(err) {
		if err := os.MkdirAll(accountDir, os.ModePerm); err != nil {
			return err
		}

		metaInfoPath := fmt.Sprintf("%s/%s", accountDir, metainfoFilename)
		now := time.Now().Format(time.RFC3339)
		metaInfo := map[string]string{
			"password":    account.Password,
			"created_at":  now,
			"modified_at": now,
		}

		metaInfoData, err := json.MarshalIndent(metaInfo, "", "  ")
		if err != nil {
			return err
		}

		return os.WriteFile(metaInfoPath, metaInfoData, 0644)
	}

	return nil
}

// GetAccount loads account metadata from the filesystem.
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

	metaInfoPath := fmt.Sprintf("%s/%s", accountDir, metainfoFilename)
	metaInfoData, err := os.ReadFile(metaInfoPath)
	if err != nil {
		return nil, err
	}

	var metaInfo map[string]string
	if err := json.Unmarshal(metaInfoData, &metaInfo); err != nil {
		return nil, err
	}

	account.Password = metaInfo["password"]

	return &account, nil
}

// ExistsAccount reports whether an account exists.
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

// sessionFilename builds the session file path for an account.
func sessionFilename(accountID, sessionID string) string {
	return fmt.Sprintf("%s/accounts/%s/sessions/%s", rootPath, accountID, sessionID)
}

// GetAllSessions returns all session file names for an account.
func (fss *FileSystemStorage) GetAllSessions(accountID string) ([]string, error) {
	sessions := []string{}

	// TODO: Prevent unsafe account IDs from creating path traversal.
	sessionsPath := fmt.Sprintf("%s/accounts/%s/sessions/", rootPath, accountID)

	err := filepath.Walk(sessionsPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		sessions = append(sessions, info.Name())
		return nil
	})

	return sessions, err
}

// GetSession loads a session and returns its tabs.
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

// SaveSession stores the session tabs in the filesystem.
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
