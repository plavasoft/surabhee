//go:build windows

package main

import (
	"syscall"
	"unsafe"
)

func alert(title, text string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	proc := user32.NewProc("MessageBoxW")
	body, _ := syscall.UTF16PtrFromString(text)
	heading, _ := syscall.UTF16PtrFromString(title)
	_, _, _ = proc.Call(0, uintptr(unsafe.Pointer(body)), uintptr(unsafe.Pointer(heading)), 0x40)
}
