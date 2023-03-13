## Prerequisites

Node Js, NPM, Yarn, Nest JS, Angular CLI

Windows users may need to allow execution of NPM scripts. Run PowerShell as Administrator and execute:
```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Setup Backend Nest JS project
```
nest new backend
cd backend
yarn config set nodeLinker node-modules
yarn install
```

#### Add Swagger Backend API
```
yarn add @nestjs/swagger
```

#### Install Ethers
```
yarn add ethers@^5.7.2
```


##### Serve Backend App
```
yarn start:dev
```
http://localhost:3000


---

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

#### Install dotenv - note fs, path and os needed here
```
npm install dotenv
npm install fs path os
```

##### To build and serve
```
npm run start
```
http://localhost:4200/

---
