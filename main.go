package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"

	"github.com/google/uuid"
)

var ETAG = uuid.New().String()

func StaticHandler(dir string) http.HandlerFunc {
	fs := http.FileServer(http.Dir(dir))

	return func(w http.ResponseWriter, r *http.Request) {
		r.Header.Del("If-Modified-Since")
		w.Header().Set("Etag", ETAG)

		fs.ServeHTTP(w, r)
	}
}

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

	mux := http.NewServeMux()
	mux.Handle("/", StaticHandler(dist))

	log.Printf("Listening on port %s, serving: %s, api: %s", port, dist, api)
	err = http.ListenAndServe(":"+port, mux)
	if err != nil {
		log.Fatal(err)
	}
}
