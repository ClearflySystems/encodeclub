## Prerequisites

Node Js, NPM, Yarn, Angular CLI

Windows users may need to allow execution of NPM scripts. Run PowerShell as Administrator and execute:
```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Deploy smart contracts
```
yarn run ts-node --files ./scripts/deploy.ts
```


### Setup Frontend Angular APP with Bootstrap

https://therichpost.com/how-to-install-bootstrap-5-in-angular-15/

New Angular App - No routing, SCSS.
```
ng new frontend
cd frontend
npm install bootstrap
npm install @popperjs/core
```

Add to angular.json under styles/scripts in the build section:
```
"node_modules/bootstrap/dist/css/bootstrap.min.css"
"node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
```

#### Install Ethers
```
npm i ethers@^5.7.2
```

#### Install Metamask connectors
```
npm i @metamask/detect-provider
npm i @metamask/providers
```

##### To build and serve
```
npm run start
```
http://localhost:4200/

---
