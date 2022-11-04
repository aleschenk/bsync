package main

import (
	"testing"

	"bsync.com/m/v2/storage"
)

// TestHelloName calls greetings.Hello with a name, checking
// for a valid return value.
func TestHelloName(t *testing.T) {
	// name := "Gladys"
	// want := regexp.MustCompile(`\b` + name + `\b`)
	// msg, err := Hello("Gladys")
	// if !want.MatchString(msg) || err != nil {
	// 	t.Fatalf(`Hello("Gladys") = %q, %v, want match for %#q, nil`, msg, err, want)
	// }
	InitDatabase(":memory:")
	CreateNewAccount("test")
	SaveSession("test", "default", []storage.Tab{})
	CloseDatabase()
	// t.Fatalf(`Hello("Gladys") = %q, %v, want match for %#q, nil`, msg, err, want)
}
