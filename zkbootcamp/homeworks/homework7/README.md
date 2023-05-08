## Homework 7
### Noir

#### Install Noir 
https://noir-lang.org/getting_started/nargo_installation

Follow the instructions to install Rust and Noir (the nargo directory is in crates/nargo)

#### Create an example project

https://noir-lang.org/getting_started/hello_world.html  

1. Create a new project 
```
nargo new hello_world
```

2. Build the project 
```
cd hello_world
nargo check
```

3. Edit the inputs in the Prover.toml file
```
x = "1" y = "2"
```

4. Edit the Verifier.toml as follows
```
y = "2" setpub = []
```

5. Generate the proof
```
nargo prove my_proof
```

6. Verify the proof
```
nargo verify my_proof
```