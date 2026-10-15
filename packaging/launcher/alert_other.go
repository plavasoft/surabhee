//go:build !windows

package main

import "fmt"

func alert(title, text string) {
	fmt.Printf("%s\n\n%s\n", title, text)
}
