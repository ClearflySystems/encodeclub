fn main() {

    let secret:u32 = 99;
    let s1:u32 = share(1, secret);
    println!("Called");
}

/**
 * Shamir secret sharing
 * Generate a shared result for index (x)
 * a0 - Our secret number
 * a1 - a4 - any values chosen at random
 * y(x) = a4x^4 + a3x^3 + a2x^2 + a1x^1 + a0
 */
fn share(x:u32, a0:u32) -> u32 {
    let a1:u32 = 10;
    let a2:u32 = 11;
    let a3:u32 = 7;
    let a4:u32 = 3;
    let y:u32 = a4 * x.pow(4) + a3 * x.pow(3) + a2 * x.pow(2) + a1 * x + a0;
    return y;
}