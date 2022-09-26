package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	dist := os.Getenv("DIST")
	if dist == "" {
		dist = "/dist"
	}

	api := os.Getenv("BASE_URL")
	if api == "" {
		log.Fatal("BASE_URL not set")
	}
	err := os.WriteFile(path.Join(dist, "apiurl.js"), []byte(fmt.Sprintf("globalThis.VUE_APP_BASE_URL = '%s';", api)), 0644)
	if err != nil {
		log.Fatal(err)
	}

	fs := http.FileServer(http.Dir(dist))
	http.Handle("/", fs)

	log.Printf("Listening on port %s, serving: %s, api: %s", port, dist, api)
	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}
