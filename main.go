package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var ETAG = uuid.New().String()

func StaticHandler(dir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		r.Header.Del("If-Modified-Since")
		w.Header().Set("Etag", ETAG)

		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		if path.Ext(r.URL.Path) == "" {
			http.ServeFile(w, r, "/dist/index.html")
			return
		}

		http.FileServer(http.Dir(dir)).ServeHTTP(w, r)
	}
}

var s3 *minio.Client

func SetS3Client() {
	port := os.Getenv(("S3_PORT"))
	endpoint := os.Getenv("S3_ENDPOINT")
	accessKeyID := os.Getenv("S3_LOGIN")
	secretAccessKey := os.Getenv("S3_PASS")
	useSSL := true

	if port == "" {
		port = "9000"
	}
	if endpoint == "" {
		return
	}

	url := fmt.Sprintf("%s:%s", endpoint, port)
	s3Client, err := minio.New(url, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})

	if err != nil {
		log.Fatal(err)
	}

	s3 = s3Client
}

func GetPresignedUrl(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	bucket := r.URL.Query().Get("bucket")
	name := r.URL.Query().Get("name")
	expiry := time.Second * 24 * 60 * 60

	var (
		presignedUrl *url.URL
		err          error
	)
	method := r.URL.Query().Get("method")

	if !(method == "GET" || method == "PUT") {
		log.Fatal("Wrong method:", method)
	}

	if method == "GET" {
		presignedUrl, err = s3.PresignedGetObject(ctx, bucket, name, expiry*7, url.Values{})
	}
	if method == "PUT" {
		presignedUrl, err = s3.PresignedPutObject(ctx, bucket, name, expiry)
	}

	if err != nil {
		log.Fatal(err)
	}

	w.Write([]byte(presignedUrl.String()))
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

	id := os.Getenv("GA_ID")
	bucket := os.Getenv(("S3_BUCKET"))
	api := os.Getenv("BASE_URL")
	if api == "" {
		log.Fatal("BASE_URL not set")
	}

	s := fmt.Sprintf(
		"globalThis.VUE_APP_BASE_URL = '%s'\nglobalThis.VUE_APP_GA_ID = '%s'\nglobalThis.VUE_APP_S3_BUCKET = '%s'",
		api, id, bucket,
	)
	err := os.WriteFile(path.Join(dist, "api.js"), []byte(s), 0644)
	if err != nil {
		log.Fatal(err)
	}

	SetS3Client()
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead {
			w.WriteHeader(http.StatusOK)
			return
		}
		StaticHandler(dist).ServeHTTP(w, r)
	})
	mux.HandleFunc("/presignedUrl", GetPresignedUrl)

	log.Printf("Listening on port %s, serving: %s, api: %s", port, dist, api)
	err = http.ListenAndServe(":"+port, mux)
	if err != nil {
		log.Fatal(err)
	}
}
