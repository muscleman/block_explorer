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

1. `backend` FQDN of your backend with the `front_port`
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
    "front_port":"8008"}
```

1. `"api"` The address of your zano node
2. `"front_port"` Port of backend API 

#### Run Backend Server
```
node server.js
```

## Build Frontend For Production
Following command will produce a `dist` folder that you can copy to your a web server
```
ng build --configuration production
```
