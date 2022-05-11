# Blockexplorer

## Frontend

Edit source/environments.ts and source/environments.prod.ts

```
export const environment = {
  production: false,
  backend: 'http://10.0.0.13:8008',
  documentionApi: 'https://docs.zano.org'
};
```

1. `backend` FQDN of your backend with the `frontEnd_api`
2. `documentationApi` Address used to build documentation explanations

#### Run Frontend development Server

```
ng serve -o
```

## Backend Server

Edit `config.json`

```
{
    "api":"http://10.0.0.13:12111",
    "frontEnd_api": "http://localhost:4200",
    "server_port": "8008",
    "auditable_wallet": {
        "api": "http://10.0.0.13:12233"
    }
```

1. `"api"` The address of your zano node.
2. `"frontEnd_api"` The address of the angular uses for CORS. seems to not like 127.0.0.1
3. `"server_port"` Port of backend API used by angular to obtain data.
4. `"auditable_wallet"` FDQN of your auditable wallet running as a service.

#### Run Backend Server

```
node server.js
```

## Build Frontend For Production

Following command will produce a `dist` folder that you can copy to your a web server

```
ng build --configuration production
```
