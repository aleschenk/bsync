package storage

type Tab map[string]interface{}

type Account struct {
	ID        string `genji:"id"`
	CreatedAt string `genji:"created_at"`
}

type Session struct {
	AccountID  string `genji:"account_id json:accountId"`
	SessionID  string `genji:"session_id json:sessionId"`
	CreatedAt  string `genji:"created_at json:createdAt"`
	ModifiedAt string `genji:"modified_at json:modifiedAt"`
	Tabs       []Tab  `genji:"tabs json:tabs"`
}

type Storage interface {
	CreateNewAccount(ID string) error
	GetAllSessions(accountID, sessionID string) ([]string, error)
	GetSession(accountID, sessionID string) (*Session, error)
	SaveSession(accountID, sessionID string, tabs []Tab) error
}
