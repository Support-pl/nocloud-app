echo "globalThis.VUE_APP_BASE_URL = '"$VUE_APP_BASE_URL"';" > apiurl.js
thttpd -D -h 0.0.0.0 -p 80 -d /home/static -u static -l - -M 60
