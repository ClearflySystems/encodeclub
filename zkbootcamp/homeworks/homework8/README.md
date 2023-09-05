## Cairo 1 Contracts

Note - Protostar on Windows is not supported so you'll need to run linux on WSL.

https://ubuntu.com/tutorials/install-ubuntu-on-wsl2-on-windows-10#1-overview


### Install Protostar

https://docs.swmansion.com/protostar/docs/tutorials/installation#windows-compatibility


### Create a project
``` 
protostar init-cairo1 my-project
```

This is going to create a project with an example HelloStarknet smart contract, a utils library
and unit tests for both. You can run unit tets with:
``` 
protostar test-cairo1
```


### Your tasks:
- Create unit test for HelloStarknet get_two method
- Store balance in u128 rather than a felt data type. Modify corresponding methods and unit tests if necessary.
- Already implemented increase_balance() is a bit boring so modify such that it only allows for to increase balance in even amounts. Of course start with a unit test.
- We don't want the balance to go too high. Set up contract owner in a constructor and make sure that only owner can increase balance by more than 1000. Of course start with unit tests.
- Owner would like to quickly check who has increased the balance. Lets store addresses of all users who have increased a balance in an array. Also make sure with unit tests that this information can be retreived.
- Owner would like to quickly check by how much particual users have increased the balance. Lets store this data in a map. Also make sure with unit tests that this information can be retreived.