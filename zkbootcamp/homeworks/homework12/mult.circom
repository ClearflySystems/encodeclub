pragma circom 2.0.0;


/*This circuit template checks that c is the multiplication of two inputs */
template Multiplier2 () {


// Declaration of signals.

signal input in1;

signal input in2;

signal output c;


// Constraints.

c <== (in1 * in2);

}

component main {public [in1,in2]} = Multiplier2();

/* INPUT = {
  "in1" : "2",
  "in2" : "77"
} */