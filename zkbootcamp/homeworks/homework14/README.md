## Secret Sharing

> Try out Shamir secret sharing

1. Create a polynomial with the secret being the constant term *a0*, the other a values (*a1. . . a4*) can be chosen at random
   The polynomial will be of the form 
``` 
y(x) = a4x4 + a3x3 + a2x2 + a1x + a0 
```
2. Calculate the y values for five x values by evaluating the polynomial, these are the shares.
3. Reconstruct the polynomial using those shares and an online interpolation calculator such as
   https://planetcalc.com/8680/


------

