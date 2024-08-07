# Waku Frontend

The chat application to use The Waku Network.

## Why

- a PoC to battle test The Waku Network.
- create user experience with REST API / WebSocket
- facilitate the developer adoption of Waku protocols
- split concern to harden the protocol stabliity with C/S model
- incubate app based sync protocol


*Notes:* This project is still in the early stage of development, and the data is not persistent, you may lose the message history any time.


## Features

### Public community chat

The public chat room is open to everyone who knows the community name. The content is not encrypted.

## Plans

- WebSocket to support real-time chat
- End-to-end encryption for 1to1 chat


## Development

### Locally
```shell
npm install

npm run dev
```

The default API endpoint used to contact a Waku Node is http://localhost:8645

In order to set a custom endpoint, please set the env variable `VITE_API_ENDPOINT`

For example
```
export VITE_API_ENDPOINT=<my-other-endpoint>
```

### Docker

```
docker build -t waku-frontend .
docker run -p 4000:4000 waku-frontend
```

And go to `http://localhost:4000`.

## Caddy configuration

```
your-domain.com {
        @cors_preflight {
                method OPTIONS
        }
        respond @cors_preflight 204

        header {
                Access-Control-Allow-Origin *
                Access-Control-Allow-Methods GET,POST,OPTIONS,HEAD,PATCH,PUT,DELETE
                Access-Control-Allow-Headers User-Agent,Content-Type,X-Api-Key
                Access-Control-Max-Age 86400
        }
        reverse_proxy :8645
}
```

## Depend APIs

- /relay/v1/auto/messages
- /store/v3/messages

## Known Issues

- https://github.com/waku-org/nwaku/issues/2615, temporary fix is set pageSize to `300`.
