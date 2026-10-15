package main

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// startPath is "inbox", "group", or "stop". The Windows build sets it with -X.
var startPath = "inbox"

const port = "43123"

func main() {
	root, err := installRoot()
	if err != nil {
		alert("Andhra Thota", err.Error())
		os.Exit(1)
	}
	if startPath == "stop" {
		if err := stopServer(root); err != nil {
			alert("Andhra Thota", err.Error())
			os.Exit(1)
		}
		alert("Andhra Thota", "The order agent and the group agent are stopped.")
		return
	}
	if err := ensureServer(root); err != nil {
		alert("Andhra Thota", err.Error())
		os.Exit(1)
	}
	page := "/inbox"
	if startPath == "group" {
		page = "/group"
	}
	if err := openBrowser("http://127.0.0.1:" + port + page); err != nil {
		alert("Andhra Thota", "The agent is running at http://127.0.0.1:"+port+page)
	}
}

func installRoot() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	exe, err = filepath.EvalSymlinks(exe)
	if err != nil {
		return "", err
	}
	return filepath.Dir(exe), nil
}

func ensureServer(root string) error {
	if listening() {
		return nil
	}
	node := nodeBinary(root)
	if _, err := os.Stat(node); err != nil {
		return fmt.Errorf("The Node runtime is missing at %s.", node)
	}
	app := filepath.Join(root, "app")
	if _, err := os.Stat(filepath.Join(app, "server.js")); err != nil {
		return fmt.Errorf("The stall program is missing at %s.", filepath.Join(app, "server.js"))
	}
	logPath := filepath.Join(root, "andhra-thota.log")
	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}
	cmd := exec.Command(node, "server.js")
	cmd.Dir = app
	cmd.Env = append(os.Environ(),
		"PORT="+port,
		"HOSTNAME=127.0.0.1",
		"NODE_ENV=production",
		"ANDHRA_THOTA_HOME="+root,
	)
	cmd.Env = append(cmd.Env, readEnvFile(filepath.Join(root, "andhra-thota.env"))...)
	cmd.Stdout = logFile
	cmd.Stderr = logFile
	detach(cmd)
	if err := cmd.Start(); err != nil {
		logFile.Close()
		return err
	}
	_ = os.WriteFile(filepath.Join(root, "andhra-thota.pid"), []byte(fmt.Sprintf("%d\n", cmd.Process.Pid)), 0o644)
	exited := make(chan error, 1)
	go func() {
		exited <- cmd.Wait()
		logFile.Close()
	}()
	deadline := time.Now().Add(45 * time.Second)
	for time.Now().Before(deadline) {
		if listening() {
			return nil
		}
		select {
		case err := <-exited:
			tail := logTail(logPath)
			if err != nil {
				return fmt.Errorf("The agent stopped before it could open.\n\n%s", tail)
			}
			return fmt.Errorf("The agent stopped before it could open.\n\n%s", tail)
		case <-time.After(200 * time.Millisecond):
		}
	}
	return fmt.Errorf("The agent did not open in time. See %s.", logPath)
}

func stopServer(root string) error {
	raw, err := os.ReadFile(filepath.Join(root, "andhra-thota.pid"))
	if err != nil {
		if listening() {
			return fmt.Errorf("The agent is still running, but its process file is missing. Close it from Task Manager.")
		}
		return nil
	}
	var pid int
	if _, err := fmt.Sscanf(strings.TrimSpace(string(raw)), "%d", &pid); err != nil || pid <= 0 {
		return fmt.Errorf("The process file could not be read.")
	}
	proc, err := os.FindProcess(pid)
	if err == nil {
		_ = proc.Kill()
	}
	_ = os.Remove(filepath.Join(root, "andhra-thota.pid"))
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		if !listening() {
			return nil
		}
		time.Sleep(200 * time.Millisecond)
	}
	return fmt.Errorf("The agent is still running. Close the Node process in Task Manager.")
}

func listening() bool {
	conn, err := net.DialTimeout("tcp", "127.0.0.1:"+port, 250*time.Millisecond)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

func nodeBinary(root string) string {
	if runtime.GOOS == "windows" {
		return filepath.Join(root, "runtime", "node.exe")
	}
	return filepath.Join(root, "runtime", "node")
}

func readEnvFile(path string) []string {
	raw, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	var lines []string
	for _, line := range strings.Split(string(raw), "\n") {
		line = strings.TrimSpace(strings.TrimRight(line, "\r"))
		if line == "" || strings.HasPrefix(line, "#") || !strings.Contains(line, "=") {
			continue
		}
		lines = append(lines, line)
	}
	return lines
}

func logTail(path string) string {
	raw, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	text := string(raw)
	if len(text) > 1200 {
		text = text[len(text)-1200:]
	}
	return strings.TrimSpace(text)
}

func openBrowser(url string) error {
	switch runtime.GOOS {
	case "windows":
		return exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		return exec.Command("open", url).Start()
	default:
		return exec.Command("xdg-open", url).Start()
	}
}
