FROM nginx:1.19

COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./export/effect-for-lambda-part2 /usr/share/nginx/html
